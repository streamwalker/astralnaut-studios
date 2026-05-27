import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

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



export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: {
    priceId: string;
    customerEmail?: string;
    userId?: string;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const stripe = createStripeClient(data.environment);

    const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];

    const customerId = (data.customerEmail || data.userId)
      ? await resolveOrCreateCustomer(stripe, {
          email: data.customerEmail,
          userId: data.userId,
        })
      : undefined;

    // Full compliance handling: Stripe handles tax calculation/collection/filing,
    // fraud protection, dispute handling, and customer support (+3.5% per txn).
    // Incompatible with automatic_tax, customer_update, shipping_address_collection.
    // Patron print shipping is collected post-checkout via the account page.
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: "subscription",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      ...({ managed_payments: { enabled: true } } as any),
      ...(customerId && { customer: customerId }),
      ...(data.userId && {
        metadata: { userId: data.userId, tier_price: data.priceId },
        subscription_data: { metadata: { userId: data.userId, tier_price: data.priceId } },
      }),
    });

    return session.client_secret;
  });

const TIER_LOOKUP_KEYS = [
  "reader_monthly", "reader_yearly",
  "initiate_monthly", "initiate_yearly",
  "patron_monthly", "patron_yearly",
] as const;

/**
 * Build (or reuse) a Billing Portal configuration that lets the customer
 * switch between any of our six tiers, with prorated charges/credits
 * applied immediately. New tier benefits unlock the moment the change
 * is confirmed — both for upgrades and downgrades.
 */
async function getOrCreatePortalConfiguration(
  stripe: ReturnType<typeof createStripeClient>,
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

  const config = await stripe.billingPortal.configurations.create({
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
        // create_prorations = immediate switch, prorated charge for upgrades,
        // prorated credit on next invoice for downgrades. Benefits start now.
        proration_behavior: "create_prorations",
        products,
      },
    },
  });

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
    const configuration = await getOrCreatePortalConfiguration(stripe);
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id as string,
      configuration,
      ...(data.returnUrl && { return_url: data.returnUrl }),
    });
    return portal.url;
  });
