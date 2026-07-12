import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type StripeEnv, verifyWebhook, createStripeClient } from "@/lib/stripe.server";
import {
  sendSubscriptionConfirmationEmail,
  sendCancellationConfirmationEmail,
} from "@/lib/emails.server";

function getSupabase() {
  return supabaseAdmin as any;
}

function resolvePriceId(item: any): string {
  return (
    item?.price?.lookup_key ||
    item?.price?.metadata?.lovable_external_id ||
    item?.price?.id
  );
}

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data } = await (supabaseAdmin as any).auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch (e) {
    console.error("[webhook] getUserEmail failed", e);
    return null;
  }
}

function planLabelFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    reader_monthly: "Reader (Monthly)",
    reader_yearly: "Reader (Yearly)",
    initiate_monthly: "Initiate (Monthly)",
    initiate_yearly: "Initiate (Yearly)",
    patron_monthly: "Patron (Monthly)",
    patron_yearly: "Patron (Yearly)",
  };
  return map[priceId] ?? priceId;
}

function unitAmountFromItem(item: any): { amount: number; currency: string } {
  const cents = item?.price?.unit_amount ?? 0;
  return { amount: cents / 100, currency: (item?.price?.currency ?? "usd").toUpperCase() };
}

async function handleSubscriptionUpsert(subscription: any, env: StripeEnv, shipping?: any) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  // Read prior state so we can detect a fresh cancellation transition.
  const { data: prior } = await getSupabase()
    .from("subscriptions")
    .select("id, cancel_at_period_end, status")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  const row: Record<string, any> = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    product_id: productId,
    price_id: priceId,
    status: subscription.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    environment: env,
    updated_at: new Date().toISOString(),
  };

  if (shipping?.address) {
    row.shipping_name = shipping.name ?? null;
    row.shipping_line1 = shipping.address.line1 ?? null;
    row.shipping_line2 = shipping.address.line2 ?? null;
    row.shipping_city = shipping.address.city ?? null;
    row.shipping_state = shipping.address.state ?? null;
    row.shipping_postal_code = shipping.address.postal_code ?? null;
    row.shipping_country = shipping.address.country ?? null;
  }

  await getSupabase().from("subscriptions").upsert(row, { onConflict: "stripe_subscription_id" });

  // Detect newly-scheduled cancellation and record + notify.
  const becameCancelling =
    subscription.cancel_at_period_end === true &&
    (!prior || prior.cancel_at_period_end !== true);

  if (becameCancelling) {
    const endDate = row.current_period_end ? new Date(row.current_period_end) : null;
    const email = await getUserEmail(userId);
    const confirmationNumber = `RWC-CX-${subscription.id.slice(-8).toUpperCase()}`;

    // Persist consent-of-record for the cancellation action itself.
    await getSupabase().from("consent_events").insert({
      user_id: userId,
      event_type: "subscription_cancel",
      subscription_policy_version: null,
      plan_id: priceId,
      plan_name: planLabelFromPriceId(priceId),
      stripe_subscription_id: subscription.id,
      effective_end_date: row.current_period_end,
      consent_text: `Cancellation scheduled via Stripe customer portal. Confirmation ${confirmationNumber}. Access continues until effective end date.`,
    });

    if (email) {
      await sendCancellationConfirmationEmail({
        to: email,
        planName: planLabelFromPriceId(priceId),
        effectiveEndDate: endDate,
        confirmationNumber,
      });
    }
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  if (!userId || !session.subscription) return;

  const stripe = createStripeClient(env);
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  if (!subscription.metadata?.userId) {
    (subscription as any).metadata = { ...subscription.metadata, userId };
  }
  await handleSubscriptionUpsert(subscription, env, session.shipping_details);

  // Send subscription confirmation email (Stage 3: onscreen + email receipt).
  const item = (subscription as any).items?.data?.[0];
  const priceId = resolvePriceId(item);
  const { amount, currency } = unitAmountFromItem(item);
  const periodEnd = item?.current_period_end ?? (subscription as any).current_period_end;
  const endDate = periodEnd ? new Date(periodEnd * 1000) : null;
  const email =
    session.customer_details?.email ||
    session.customer_email ||
    (await getUserEmail(userId));
  if (email) {
    const origin = process.env.SITE_URL || "https://astralnautstudios.com";
    await sendSubscriptionConfirmationEmail({
      to: email,
      planName: planLabelFromPriceId(priceId),
      displayedPrice: amount,
      currency,
      billingInterval: priceId.endsWith("_yearly") ? "yearly" : "monthly",
      nextChargeDate: endDate,
      cancelUrl: `${origin}/account`,
    });
  }
}

async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  void invoice;
  void env;
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "invoice.paid":
    case "invoice.payment_succeeded":
      await handleInvoicePaid(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid or missing env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
