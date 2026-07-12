import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type StripeEnv, verifyWebhook, createStripeClient, isoWeekKey } from "@/lib/stripe.server";

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

function tierFromPriceId(priceId: string): string | null {
  if (priceId.startsWith("reader")) return "reader";
  if (priceId.startsWith("initiate")) return "initiate";
  if (priceId.startsWith("patron")) return "patron";
  return null;
}

const TIER_WEEKLY_ENTRIES: Record<string, number> = {
  reader: 1,
  initiate: 3,
  patron: 10,
};

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
  // Ensure userId metadata is on subscription
  if (!subscription.metadata?.userId) {
    (subscription as any).metadata = { ...subscription.metadata, userId };
  }
  await handleSubscriptionUpsert(subscription, env, session.shipping_details);
}

async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  // Grant weekly sweepstakes entries when an invoice is paid (renewal or initial)
  const userId = invoice.subscription_details?.metadata?.userId
    || invoice.parent?.subscription_details?.metadata?.userId;
  const subId = invoice.subscription || invoice.parent?.subscription_details?.subscription;
  if (!subId) return;

  const stripe = createStripeClient(env);
  const sub = await stripe.subscriptions.retrieve(subId as string);
  const realUserId = userId || sub.metadata?.userId;
  if (!realUserId) return;

  const item = sub.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const tier = tierFromPriceId(priceId);
  if (!tier) return;

  const entriesCount = TIER_WEEKLY_ENTRIES[tier] || 0;
  if (entriesCount === 0) return;

  const email = invoice.customer_email || "";
  const weekKey = isoWeekKey();

  const rows = Array.from({ length: entriesCount }).map(() => ({
    user_id: realUserId,
    email,
    week_key: weekKey,
    source: "paid_tier" as const,
    tier,
  }));

  await getSupabase().from("raffle_entries").insert(rows);
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
