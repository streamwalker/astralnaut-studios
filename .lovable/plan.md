
## Goal

Take live payments via Stripe for the three Real World Comics subscription tiers (monthly + annual), collect a shipping address at Patron signup, and add a free "no purchase necessary" entry path so the raffle is Stripe-safe.

## 1. Enable Stripe (Lovable built-in)

Use Lovable's seamless Stripe integration — no Stripe account or API key required from you upfront. Test environment works immediately; going live requires claiming the account.

**Tax handling:** Use Stripe's *tax calculation & collection only* mode (+0.5%/txn). Full compliance handling is digital-only and the Patron tier ships a physical print, so it isn't eligible. You'd then register/file in jurisdictions where you cross thresholds (Stripe alerts you).

## 2. Products & pricing in Stripe

Create 3 products, each with 2 recurring prices (monthly + annual). Annual gets a standard ~17% discount (2 months free) unless you say otherwise.

| Tier | Monthly | Annual |
|---|---|---|
| Reader | $4.99 | $49.90 |
| Initiate | $12.99 | $129.90 |
| Patron | $24.99 | $249.90 |

Each product gets a Stripe tax code matched to its type (digital subscription for Reader/Initiate; mixed digital+physical for Patron).

## 3. Database

New tables:
- **subscribers** — links a user to their Stripe customer + active subscription, current tier, status, period end, optional shipping address (for Patron).
- **raffle_entries** — one row per weekly entry, with `source` = `paid_tier` or `amoe` (free entry), week identifier, and user.

RLS: users see only their own rows; service role writes from webhook.

## 4. Checkout flow

- Pricing page lists 3 tiers with monthly/annual toggle.
- "Subscribe" → server function creates a Stripe Checkout Session for the selected price.
- Patron checkout enables `shipping_address_collection` (US + countries you ship to).
- On success, redirect to `/account` with a "subscription active" banner.

## 5. Customer portal

"Manage subscription" button on `/account` opens Stripe's hosted Billing Portal so users can change tier, update payment method, update shipping address, or cancel.

## 6. Webhook

Public route at `/api/public/stripe-webhook` verifies the Stripe signature and handles:
- `checkout.session.completed` → upsert subscriber, store shipping address if provided.
- `customer.subscription.updated` / `deleted` → update tier + status + period end.
- `invoice.paid` → grant that week's paid raffle entry/entries for the tier.

## 7. Raffle compliance (AMOE)

- Update tier copy: raffle entries are a perk, but a **free alternate entry** is always available.
- New public page `/raffle/free-entry`: simple form (name, email, weekly entry) with rate limit (1 entry per email per week), writes to `raffle_entries` with `source='amoe'`.
- Add a short Official Rules page (`/raffle/rules`) — placeholder text you can fill in with your final legal copy; required for any sweepstakes.
- Link both from the pricing page and footer.

## 8. Going live (your steps after build)

1. Claim the Stripe account from Lovable → verify business details.
2. Switch from test to live mode.
3. Add real shipping countries + zones for Patron.
4. Replace placeholder Official Rules with reviewed copy.

## Technical notes

- Server functions (`createServerFn`) handle all Stripe API calls; secret key never touches the browser.
- Webhook lives at `src/routes/api/public/stripe-webhook.ts` and uses `supabaseAdmin` after signature verification.
- Subscriber lookups use `requireSupabaseAuth` middleware so RLS applies.
- Annual price IDs are stored alongside monthly so the portal can offer upgrades/downgrades cleanly.

## Out of scope (ask if you want these)

- Proration rules beyond Stripe defaults
- Coupons / promo codes
- Gift subscriptions
- Print fulfillment automation (you'll get shipping addresses; quarterly fulfillment is manual)
