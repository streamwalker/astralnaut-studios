# Conversion & Retention Correction Pass

Surgical fixes — no restyling, no palette/font changes. Reuses existing components, tokens, and gradient buttons. Implemented in the order the spec recommends.

## 1. Single source of truth for subscriber count (Task 1)

- Add `site_stats` table (id, subscriber_count, campaign_goal, pages_published, series_live, updated_at) via migration. Public SELECT, admin-only writes. Seed one row with real current numbers (pages=52, series=3, goal=1000, subscriber_count=0 — but display gated by flag).
- Add SQL function `public.get_active_subscriber_count()` returning `count(*)` from `subscriptions` where `status='active'`. Grant execute to anon/authenticated.
- Add `src/config/siteConfig.ts` with `SHOW_SUBSCRIBER_COUNT`, `SHOW_ANNUAL_NUDGE`, `CAMPAIGN { name, goal, endsAt }`. Threshold rule: if real count < 50, hero falls back to "52 PAGES PUBLISHED · 3 SERIES LIVE · 5 NEW PAGES/WEEK" instead of showing a raw count.
- Add `src/hooks/useSubscriberCount.ts` — React Query (60s stale) over the new serverFn that wraps `get_active_subscriber_count` + `site_stats`. Returns `{ count, goal, pagesPublished, seriesLive }`.
- Update `src/routes/index.tsx` hero stat band and `src/components/milestone-strip.tsx` to read from this same hook. Progress bar = `count/goal` width.
- Acceptance: no screen shows `0 SUBSCRIBERS`; hero and campaign numbers are provably the same variable.

## 2. Rewrite pricing CTAs (Task 2)

- In `src/routes/pricing.tsx`: replace "Sign in to start" with `Start Reader · $4.99/mo`, `Start Initiate · $9.99/mo`, `Go Patron · $24.99/mo`. When the Yearly toggle is on, swap to annual-equivalent monthly (`~$4.16/mo · billed yearly`, etc.).
- Logged-out click → `/login?plan=<tier>&interval=<monthly|yearly>` (login page handles the plan param, then continues to checkout). Logged-in click → straight to existing checkout for that tier.
- Keep existing gradient button component; only labels + handler change.

## 3. Shared pricing config (foundation for tasks 4–6)

- New `src/config/pricingTiers.ts` — array of `{ id, name, priceMonthly, priceYearly, popular, timingLabel, valueCaption?, features[], ctaLabelMonthly, ctaLabelYearly, highlightAnnual }`. Single import for `/pricing` and the new homepage strip.
- Refactor `pricing.tsx` to read from this config (remove its inline tier array). No prices hardcoded anywhere else.

## 4. Closing conversion band on homepage (Task 3)

- New section component inserted in `src/routes/index.tsx` between the benefits grid and the footer.
- Eyebrow `START NOW · CANCEL ANYTIME`, headline `The next page is waiting.`, subhead, primary `Read the first act free` (same destination as hero free CTA), secondary `See all plans → /pricing`, inline price reminder line. Reuses hero button components. Responsive stacked on mobile.

## 5. Homepage pricing strip (Task 4)

- New compact 3-card strip placed after "The slate" and before "Why Subscribe." Reads from `pricingTiers.ts`. Each card: price, 1-line headline benefit, drop-time advantage badge, CTA from Task 2. `MOST POPULAR` ribbon on Initiate. `Compare all plans →` link to `/pricing`.

## 6. Reframe Reader tier (Task 5)

- `pricingTiers.ts`: Reader `timingLabel` = `Full access · every page, every series.` Initiate = `Pages drop 24h early` badge. Patron = `Pages drop 48h early` badge.
- Remove every `0h ahead` / `0 hours ahead` reference: `src/lib/i18n-dictionary.ts` lines 52 + 70, `src/routes/pricing.tsx` line 31. Replace dictionary strings with the new framing so existing components stay intact.

## 7. Value-ladder polish (Task 6)

- `pricingTiers.ts`: Initiate `highlightAnnual: true` — Yearly toggle shows "2 months free" prominently. Patron `valueCaption: "Physical print + cameo + Discord — the collector tier."` rendered under the price.
- Optional Initiate strip "Most readers save with annual" gated by `siteConfig.SHOW_ANNUAL_NUDGE` (default off).

## 8. Email-capture re-engagement wall (Task 7)

- Migration: `leads (id, email, source, series_slug, last_page, confirmed, confirm_token, unsub_token, created_at, unique(email, source))`. RLS: anon `INSERT` only; `SELECT/UPDATE` restricted to service role. GRANTs per project rules.
- ServerFn `submitLead({ email, source, series_slug?, last_page? })` in `src/lib/leads.functions.ts` — inserts row + triggers double-opt-in email.
- ServerFn / Edge fn `confirmLead(token)` and `unsubscribeLead(token)` — routes under `src/routes/api/public/leads/confirm.ts` and `.../unsubscribe.ts` for one-click links.
- Edge function `notify-on-drop` (cron-callable) queues drop-alert emails to confirmed leads for the relevant `series_slug`. Email provider key (Resend) stored in Supabase secrets — never in client. Will prompt user for `RESEND_API_KEY` at build time.
- Soft interstitial component on the **last free page** of `src/routes/reader.$series.$issue.tsx`: shown before the paywall. Single email field, primary `Notify me — it's free.`, microcopy, dismissible `No thanks, show me plans →` link to `/pricing`. Free first act stays fully ungated; this only appears at the act-end transition. Captures `source='free_act_wall'`, current `series_slug` and `last_page`.
- Wire `src/routes/raffle.free-entry.tsx` to also write to `leads` with `source='free_raffle'` (in addition to existing raffle_entries).
- Double opt-in confirmation email + unsubscribe footer link on every send.

## 9. Retention surfacing & honest cancel flow (Task 8)

- New "Your standing" widget on `src/routes/account.tsx`: tier, accumulated raffle entries this campaign (from `raffle_entries` table where `week_key` in current campaign), weeks active (derive from subscription `started_at`), open canon votes the user hasn't cast.
- Logged-in homepage banner (when an open canon vote exists for the user): `An open canon vote needs you →`.
- Cancellation interstitial in account/manage-subscription flow:
  - Honest loss copy: `Cancelling forfeits your N accumulated raffle entries for [Campaign] and removes your canon vote.`
  - Two retention options shown above the final `Cancel` button: **Downgrade to Reader** and **Pause for one cycle** (pause = set `status='paused'` in subscriptions; safe no-op flag for now if Stripe pause unavailable, with TODO).
  - Final `Cancel subscription` button remains visible, enabled, and one-click — no dark patterns.

## 10. Analytics events (Measurement)

Add a thin `track(event, props)` wrapper in `src/lib/analytics.ts` (uses existing analytics-tracker). Emit:
`hero_cta_click`, `closing_band_cta_click`, `home_pricing_strip_click{tier}`, `pricing_cta_click{tier,interval,logged_in}`, `lead_capture_shown/submitted/dismissed{source,series_slug}`, `cancel_flow_started`, `cancel_downgrade_chosen`, `cancel_confirmed`, `canon_vote_prompt_click`.

## Technical details

**New files**
- `supabase/migrations/<ts>_conversion_retention.sql` — `site_stats`, `leads`, `get_active_subscriber_count`, RLS + GRANTs, seed row.
- `src/config/pricingTiers.ts`, `src/config/siteConfig.ts`
- `src/hooks/useSubscriberCount.ts`
- `src/lib/leads.functions.ts`, `src/lib/site-stats.functions.ts`
- `src/lib/analytics.ts` (thin wrapper)
- `src/components/home/ClosingBand.tsx`, `src/components/home/PricingStrip.tsx`, `src/components/home/CanonVoteBanner.tsx`
- `src/components/reader/LeadCaptureInterstitial.tsx`
- `src/components/account/StandingWidget.tsx`, `src/components/account/CancelFlow.tsx`
- `src/routes/api/public/leads/confirm.ts`, `src/routes/api/public/leads/unsubscribe.ts`
- Edge function `supabase/functions/notify-on-drop/index.ts`

**Edited**
- `src/routes/index.tsx` — new sections, useSubscriberCount.
- `src/components/milestone-strip.tsx` — read from shared hook + computed bar.
- `src/routes/pricing.tsx` — consume `pricingTiers.ts`, new CTAs.
- `src/lib/i18n-dictionary.ts` — strip "0h ahead".
- `src/routes/reader.$series.$issue.tsx` — interstitial on act-end page.
- `src/routes/raffle.free-entry.tsx` — also write `leads`.
- `src/routes/account.tsx` — standing widget + cancel flow.
- `src/routes/login.tsx` — accept `plan`/`interval` query params, continue to checkout post-auth.

**Secrets needed**: `RESEND_API_KEY` (added via secrets tool before deploying `notify-on-drop`).

## Execution order

Task 1 → shared config + `useSubscriberCount` → Tasks 2 & 3 → Tasks 4/5/6 → Task 7 (largest lift) → Task 8. Acceptance verified after each.

## Open questions before I start

1. **Pause cycle** — should "Pause for one cycle" actually pause Stripe billing (requires Stripe pause-collection setup) or just defer renewal locally with a TODO? Default: local flag + Stripe TODO unless you say otherwise.
2. **Free-act boundary** — confirm the interstitial should appear on the final free page of each series' first issue (i.e. last page before paywall), not mid-issue.
3. **Email provider** — Resend OK, or do you prefer Postmark/SendGrid? Resend is the default and I'll request the API key via the secrets prompt.
