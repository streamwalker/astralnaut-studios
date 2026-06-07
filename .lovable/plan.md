# Redesign /account to match the README/account.html mockup

The uploaded `account.html` + `README.md` describe a richer subscriber landing page for Real World Comics. The current `src/routes/account.tsx` is a minimal subscription panel. I'll rebuild it as a full subscriber dashboard styled to the mockup, but driven by **real auth + Stripe data** (not URL params).

## Scope

Rebuild only `src/routes/account.tsx`. No backend / schema / business logic changes. All existing functionality (auth gate, Stripe portal, shipping form, sign out, `?checkout=success` banner) is preserved.

## Sections (mapped from README → live data)

1. **Hero** — Real World Comics logo, "The next page only drops here" headline, greeting uses `user.email` (or name from profile if available) instead of `?name=`. CTA → `/reader/...`.
2. **Account status card** — tier badge color-themed by real `price_id` (Reader=cyan, Initiate=violet, Patron=amber). Shows member-since (`auth.users.created_at`), next billing (`current_period_end`), raffle entries/week derived from tier (1/3/10).
3. **Tier-staggered drops strip** — Patron Tue / Initiate Wed / Reader Thu, with the user's actual tier highlighted "YOU".
4. **The slate** — three series cards (Battlefield: Atlantis, Children of Aquarius live; Darker Ages Oct 2026) using existing logo imports from `@/assets/*-logo.png`.
5. **Platform perks** — four pillars (Motion + sound, Tier-staggered drops, Canon voting, Raffles + cameos).
6. **Raffle / community CTA** — gradient panel highlighting PS5 unlock at 1,000 subs + free-entry link to `/raffle/free-entry`.
7. **Subscription management** — keeps existing "Manage subscription" button → `createPortalSession`, the Patron shipping form, change-tier explainer, sign out, `?checkout=success` confirmation banner.
8. **Footer** — existing `<SiteFooter />`.

Skipping from the mockup (would require new data/assets not in scope):
- Cast grid (12 character portraits) — assets not in project
- Faction emblems (NDF / TPC) — uploaded as reference images only, not wired as app assets
- Studio dispatches — no CMS/data source

I can add these in a follow-up if you want — say the word and I'll wire the faction logos + cast grid as Lovable Assets.

## Styling

Reuse existing design tokens in `src/styles.css` (`--bg`, `--bg2`, `--neon`, `--gold`, `--ink`, `--ink2`, `card-rwc`, `btn-cta`, `eyebrow`) so the redesign matches the rest of the site. The mockup's cyan/amber/violet tier accents map to existing tokens (neon ≈ cyan, gold ≈ amber) with one new inline violet accent for Initiate.

## Tier derivation

```ts
const tierKey = sub?.price_id?.split("_")[0]; // "reader" | "initiate" | "patron"
const tierMeta = {
  reader:   { label: "Reader",   day: "Thursday", entries: 1,  color: "var(--neon)" },
  initiate: { label: "Initiate", day: "Wednesday", entries: 3,  color: "#C4A0FF" },
  patron:   { label: "Patron",   day: "Tuesday",  entries: 10, color: "var(--gold)" },
};
```

## Files touched

- `src/routes/account.tsx` — full rewrite of `AccountPage` component; `Route` config, `beforeLoad`, `ShippingForm`, and server-fn wiring kept intact.

No other files change.
