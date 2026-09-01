#!/usr/bin/env node
/**
 * Create the six subscription prices the app expects, with the lookup_keys
 * that `createCheckoutSession` resolves against.
 *
 * WHY THIS EXISTS: src/utils/payments.functions.ts finds a price with
 *
 *     stripe.prices.list({ lookup_keys: [data.priceId] })
 *
 * where data.priceId is "reader_monthly", "patron_yearly", etc. A price created
 * in the dashboard WITHOUT a lookup key is invisible to that call, and checkout
 * throws "Price not found" no matter how correct the amount looks. The
 * dashboard buries the lookup key field, so creating these by hand is the most
 * likely way to end up with six correct-looking prices and a broken checkout.
 *
 * Idempotent: a price whose lookup_key already exists is left alone, never
 * duplicated and never modified.
 *
 * Usage, from the repo root:
 *   node --env-file=.env scripts/create-stripe-prices.mjs --dry-run
 *   node --env-file=.env scripts/create-stripe-prices.mjs
 *   node --env-file=.env scripts/create-stripe-prices.mjs --env=sandbox
 *
 * Amounts mirror src/config/pricingTiers.ts. If you change them there, change
 * them here — or better, delete the price in Stripe and re-run, because Stripe
 * prices are immutable once created.
 */
import Stripe from "stripe";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ENV = args.find((a) => a.startsWith("--env="))?.split("=")[1] ?? "live";

if (ENV !== "live" && ENV !== "sandbox") {
  console.error(`Bad --env=${ENV}. Use "live" or "sandbox".`);
  process.exit(1);
}

const KEY_VAR = ENV === "sandbox" ? "STRIPE_SANDBOX_API_KEY" : "STRIPE_LIVE_API_KEY";
const apiKey = process.env[KEY_VAR];
if (!apiKey) {
  console.error(`${KEY_VAR} is not set. Run with: node --env-file=.env ${process.argv[1]}`);
  process.exit(1);
}

// Guard against the classic mistake of holding a test key while believing you
// are configuring production.
const looksLive = apiKey.startsWith("sk_live_");
if (ENV === "live" && !looksLive) {
  console.error(`--env=live but ${KEY_VAR} is not an sk_live_ key. Refusing to continue.`);
  process.exit(1);
}
if (ENV === "sandbox" && looksLive) {
  console.error(`--env=sandbox but ${KEY_VAR} is a live key. Refusing to continue.`);
  process.exit(1);
}

// Must match src/lib/stripe.server.ts so behaviour here matches the app.
const stripe = new Stripe(apiKey, { apiVersion: "2026-03-25.dahlia" });

/**
 * One Stripe Product per tier, two Prices per Product. All-access: the tiers
 * differ by earliness and perks, never by which series you may read.
 */
const TIERS = [
  {
    key: "reader",
    name: "Reader",
    description:
      "Full digital access to every Astralnaut Studios series — every page of every issue, forum access, canon voting, and the motion-comic reader.",
    prices: [
      { lookup_key: "reader_monthly", unit_amount: 499, interval: "month" },
      { lookup_key: "reader_yearly", unit_amount: 4990, interval: "year" },
    ],
  },
  {
    key: "initiate",
    name: "Initiate",
    description:
      "Everything in Reader, plus pages 24 hours early, numbered digital variant covers, and behind-the-scenes process content.",
    prices: [
      { lookup_key: "initiate_monthly", unit_amount: 999, interval: "month" },
      { lookup_key: "initiate_yearly", unit_amount: 9990, interval: "year" },
    ],
  },
  {
    key: "patron",
    name: "Patron",
    description:
      "Everything in Initiate, plus pages 48 hours early, cameo eligibility, a quarterly signed physical print, and direct creator Discord access.",
    prices: [
      { lookup_key: "patron_monthly", unit_amount: 2499, interval: "month" },
      { lookup_key: "patron_yearly", unit_amount: 24990, interval: "year" },
    ],
  },
];

const usd = (cents) => `$${(cents / 100).toFixed(2)}`;

async function findPriceByLookupKey(lookupKey) {
  const res = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  return res.data[0] ?? null;
}

async function findProductByTierKey(tierKey) {
  // Products are tagged with metadata.tier_key so re-runs reuse them instead of
  // creating a second "Reader" product alongside the first.
  for await (const product of stripe.products.list({ limit: 100 })) {
    if (product.metadata?.tier_key === tierKey && product.active) return product;
  }
  return null;
}

async function main() {
  console.log(`\nStripe price setup — env=${ENV}${DRY_RUN ? "  (DRY RUN, nothing will be written)" : ""}`);

  const account = await stripe.accounts.retrieve();
  console.log(`account: ${account.id}${account.business_profile?.name ? ` (${account.business_profile.name})` : ""}`);
  console.log(`charges_enabled: ${account.charges_enabled}   payouts_enabled: ${account.payouts_enabled}\n`);

  let created = 0;
  let skipped = 0;

  for (const tier of TIERS) {
    let product = await findProductByTierKey(tier.key);

    if (product) {
      console.log(`product  ${tier.name.padEnd(9)} exists  ${product.id}`);
    } else if (DRY_RUN) {
      console.log(`product  ${tier.name.padEnd(9)} WOULD CREATE`);
    } else {
      product = await stripe.products.create({
        name: tier.name,
        description: tier.description,
        metadata: { tier_key: tier.key },
      });
      console.log(`product  ${tier.name.padEnd(9)} created ${product.id}`);
    }

    for (const p of tier.prices) {
      const existing = await findPriceByLookupKey(p.lookup_key);
      if (existing) {
        const amt = usd(existing.unit_amount);
        const match = existing.unit_amount === p.unit_amount ? "" : `  ** AMOUNT DIFFERS, expected ${usd(p.unit_amount)} **`;
        console.log(`  price  ${p.lookup_key.padEnd(18)} exists  ${existing.id}  ${amt}${match}`);
        skipped++;
        continue;
      }
      if (DRY_RUN || !product) {
        console.log(`  price  ${p.lookup_key.padEnd(18)} WOULD CREATE  ${usd(p.unit_amount)} / ${p.interval}`);
        continue;
      }
      const price = await stripe.prices.create({
        product: product.id,
        lookup_key: p.lookup_key,
        unit_amount: p.unit_amount,
        currency: "usd",
        recurring: { interval: p.interval },
        metadata: { tier_key: tier.key },
      });
      console.log(`  price  ${p.lookup_key.padEnd(18)} created ${price.id}  ${usd(p.unit_amount)} / ${p.interval}`);
      created++;
    }
    console.log("");
  }

  console.log(`Done. created=${created} already-present=${skipped}\n`);
  console.log("Still required before a real purchase can work:");
  console.log(`  - ${ENV === "sandbox" ? "PAYMENTS_SANDBOX_WEBHOOK_SECRET" : "PAYMENTS_LIVE_WEBHOOK_SECRET"} must be set, or verifyWebhook throws on every event`);
  console.log("  - set each product's tax category in the dashboard (they default to a physical-goods preset)\n");
}

main().catch((err) => {
  console.error(`\nFAILED: ${err?.message ?? err}`);
  process.exit(1);
});
