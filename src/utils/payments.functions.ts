import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CONSENT_EVENT } from "@/config/legal";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

const shippingSchema = z.object({
  environment: z.enum(["sandbox", "live"]),
  shipping_name: z.string().trim().min(1).max(200),
  shipping_line1: z.string().trim().min(1).max(200),
  shipping_line2: z.string().trim().max(200).optional().nullable(),
  shipping_city: z.string().trim().min(1).max(100),
  shipping_state: z.string().trim().max(100).optional().nullable(),
  shipping_postal_code: z.string().trim().min(1).max(20),
  shipping_country: z.string().trim().length(2),
});

export const updateShippingAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => shippingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // RLS-scoped read confirms this subscription belongs to the caller.
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("id, stripe_customer_id, price_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError || !sub) throw new Error("No subscription found");
    if (!sub.price_id?.startsWith("patron_")) {
      throw new Error("Shipping address is only collected for Patron tier");
    }

    const line2 = data.shipping_line2?.trim() || null;
    const state = data.shipping_state?.trim() || null;
    const country = data.shipping_country.toUpperCase();

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        shipping_name: data.shipping_name,
        shipping_line1: data.shipping_line1,
        shipping_line2: line2,
        shipping_city: data.shipping_city,
        shipping_state: state,
        shipping_postal_code: data.shipping_postal_code,
        shipping_country: country,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id)
      .eq("user_id", userId);
    if (updateError) throw new Error(updateError.message);

    // Best-effort sync to the Stripe customer record.
    if (sub.stripe_customer_id) {
      try {
        const stripe = createStripeClient(data.environment);
        await stripe.customers.update(sub.stripe_customer_id, {
          name: data.shipping_name,
          shipping: {
            name: data.shipping_name,
            address: {
              line1: data.shipping_line1,
              line2: line2 ?? undefined,
              city: data.shipping_city,
              state: state ?? undefined,
              postal_code: data.shipping_postal_code,
              country,
            },
          },
        });
      } catch (err) {
        console.error("Stripe customer shipping sync failed", err);
      }
    }

    return { success: true };
  });

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}



import { requireSupabaseAuth as _reqAuth } from "@/integrations/supabase/auth-middleware";

// Stage 3: checkout requires a fresh, server-verified consent token that
// the caller obtained from recordCheckoutConsent. Fail-closed: without a
// matching consent row, no Stripe session is created.
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([_reqAuth])
  .inputValidator((data: {
    priceId: string;
    customerEmail?: string;
    userId?: string;
    returnUrl: string;
    environment: StripeEnv;
    consentToken: string;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    if (!data.consentToken || typeof data.consentToken !== "string" || data.consentToken.length > 200) {
      throw new Error("Missing consent token");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    // Consent gate — must be recent, belong to this caller, and reference this plan.
    const { data: consent, error: consentErr } = await supabaseAdmin
      .from("consent_events")
      .select("id, user_id, event_type, plan_id, created_at")
      .eq("id", data.consentToken)
      .maybeSingle();
    if (consentErr || !consent) throw new Error("Consent record not found");
    if (consent.user_id !== context.userId) throw new Error("Consent does not belong to this user");
    if (consent.event_type !== CONSENT_EVENT.checkoutConsent) throw new Error("Wrong consent type");
    if (consent.plan_id !== data.priceId) throw new Error("Consent does not match selected plan");
    const ageMs = Date.now() - new Date(consent.created_at).getTime();
    if (ageMs > 30 * 60 * 1000) throw new Error("Consent has expired — please re-confirm");

    const stripe = createStripeClient(data.environment);

    const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];

    const effectiveUserId = data.userId ?? context.userId;
    const customerId = await resolveOrCreateCustomer(stripe, {
      email: data.customerEmail,
      userId: effectiveUserId,
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: "subscription",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      customer: customerId,
      metadata: { userId: effectiveUserId, tier_price: data.priceId, consent_id: consent.id },
      subscription_data: {
        metadata: { userId: effectiveUserId, tier_price: data.priceId, consent_id: consent.id },
      },
    });

    // Link the session/subscription id back to the consent record for audit.
    await supabaseAdmin
      .from("consent_events")
      .update({ stripe_subscription_id: session.id })
      .eq("id", consent.id);

    return session.client_secret;
  });


const TIER_LOOKUP_KEYS = [
  "reader_monthly", "reader_yearly",
  "initiate_monthly", "initiate_yearly",
  "patron_monthly", "patron_yearly",
] as const;

/**
 * Metadata key stamped on every portal configuration we create, so a later
 * call can recognise its own work instead of creating another one.
 */
const PORTAL_CONFIG_KEY = "rwc_portal_config";

/**
 * Bump this whenever the feature block below changes in a way that must NOT
 * be served from an already-existing configuration — the proration behaviour
 * above all. Configurations already attached to an open portal session keep
 * working; new sessions get a freshly built one.
 */
const PORTAL_CONFIG_VERSION = "v2-always-invoice";

/**
 * Per-isolate memo, so a warm worker serving several portal opens does the
 * Stripe lookup once. Empty on a cold start, which is fine — it is a cache,
 * never a source of truth.
 */
const portalConfigCache = new Map<string, string>();

/**
 * Identity of a configuration: feature version plus the exact set of prices
 * it allows. If a tier price is added or rotated, the fingerprint changes and
 * a new configuration gets built, rather than silently reusing a portal that
 * cannot offer the new price.
 */
function portalFingerprint(priceIds: string[]): string {
  return `${PORTAL_CONFIG_VERSION}:${[...priceIds].sort().join(",")}`;
}

/**
 * Build (or reuse) a Billing Portal configuration that lets the customer
 * switch between any of our six tiers, with prorated charges/credits
 * invoiced immediately. New tier benefits unlock the moment the change is
 * confirmed — both for upgrades and downgrades.
 */
async function getOrCreatePortalConfiguration(
  stripe: ReturnType<typeof createStripeClient>,
  environment: StripeEnv,
): Promise<string> {
  const prices = await stripe.prices.list({
    lookup_keys: [...TIER_LOOKUP_KEYS],
    expand: ["data.product"],
    limit: 20,
  });

  // Group price ids by product id (Stripe requires the product + its allowed prices).
  const byProduct = new Map<string, string[]>();
  for (const p of prices.data) {
    const productId = typeof p.product === "string" ? p.product : p.product?.id;
    if (!productId) continue;
    if (!byProduct.has(productId)) byProduct.set(productId, []);
    byProduct.get(productId)!.push(p.id);
  }
  const products = Array.from(byProduct.entries()).map(([product, priceIds]) => ({
    product,
    prices: priceIds,
  }));

  const fingerprint = portalFingerprint(prices.data.map((p) => p.id));
  const cacheKey = `${environment}:${fingerprint}`;

  const memoized = portalConfigCache.get(cacheKey);
  if (memoized) return memoized;

  // Look for one we built earlier from identical inputs. Newest first, so the
  // match is on the first page in practice; a single page is a deliberate
  // bound on how much work a portal open may cost.
  const existing = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  });
  const reusable = existing.data.find((c) => c.metadata?.[PORTAL_CONFIG_KEY] === fingerprint);
  if (reusable) {
    portalConfigCache.set(cacheKey, reusable.id);
    return reusable.id;
  }

  const config = await stripe.billingPortal.configurations.create({
    metadata: { [PORTAL_CONFIG_KEY]: fingerprint },
    business_profile: { headline: "Manage your Real World Comics subscription" },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "address", "shipping", "tax_id"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
        cancellation_reason: {
          enabled: true,
          options: ["too_expensive", "missing_features", "switched_service", "unused", "customer_service", "other"],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price", "quantity", "promotion_code"],
        // always_invoice = switch now AND invoice the prorated difference now.
        //
        // Do not go back to "create_prorations". That value writes the
        // proration lines but does not invoice them, so they wait for the
        // subscription's next scheduled invoice. On a yearly plan that is up
        // to a year away: the customer would get Initiate immediately having
        // paid the Reader price, and the ~$49 difference would go uncollected
        // until renewal. On upgrade the customer is charged the difference
        // today; on downgrade the credit lands on their Stripe balance and is
        // applied to future invoices (Stripe does not refund it).
        proration_behavior: "always_invoice",
        products,
      },
    },
  });

  portalConfigCache.set(cacheKey, config.id);
  return config.id;
}

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => {
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError || !sub?.stripe_customer_id) throw new Error("No subscription found");

    const stripe = createStripeClient(data.environment);
    const configuration = await getOrCreatePortalConfiguration(stripe, data.environment);
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id as string,
      configuration,
      ...(data.returnUrl && { return_url: data.returnUrl }),
    });
    return portal.url;
  });
