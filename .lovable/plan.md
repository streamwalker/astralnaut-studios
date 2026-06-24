# Adopt Marvel.com's Engagement Pattern

## What Marvel.com does (the moves worth stealing)

Marvel's homepage is engineered around **one giant rotating hero** that does the heavy lifting. The moves:

1. **Full-bleed cinematic hero** — Each slot is dominated by a single key art image bleeding to the page edges, with a transparent PNG **title-treatment logo** layered over it (not body text styled as a heading). One short tagline. One red angled CTA button ("Watch Trailer" / "Read Now").
2. **Slotted hero rotator with named tabs** — Below the hero sits a row of clickable labels ("X-Men '97", "Avengers: Armageddon", "MARVEL Cosmic Invasion", "This Week's New Comics", "Infinity Comic"). The active tab gets a red underline. Clicking swaps the hero. It also auto-advances.
3. **Persistent thin top promo bar** — A black strip above the nav with a single high-priority message ("STREAM DAREDEVIL: BORN AGAIN…"). Always visible, sitewide.
4. **Sticky nav with single-word categories** — NEWS · COMICS · CHARACTERS · GAMES · MOVIES · TV SHOWS · VIDEOS · MORE. Uppercase, tight, tracked-out.
5. **Red angled-corner buttons** — Marvel's signature button shape: solid red, sharp angled bottom-left corner cut, white uppercase bold label. High-recognition CTA.
6. **Section bands with their own background art** — Each downstream section is its own full-width band with its own gradient/parallax background, not flat cards on a plain page.
7. **Scroll engagement** — Subtle reveal-on-scroll, hover lift on cards, image-led grids over text-led grids.

## What we already have vs. what's missing

We already have: full-width hero (now with the BA teaser video background), CoverFan visual, stat band, series shelf, pricing strip, pillars, ClosingBand, milestone strip, sticky-ish header.

Missing the four high-impact Marvel moves: **(a) rotating hero with named tabs, (b) thin sitewide promo bar, (c) angled-corner red CTA button style, (d) full-bleed banded sections with their own art.**

## Plan (landing page + global chrome only — no business logic changes)

### 1. New: sitewide top promo bar
- New component `src/components/promo-bar.tsx`. Single line, centered, black bg, small uppercase text, optional inline logo image, optional link.
- Content sourced from existing `getSiteCopy` keys (add `promo.bar.text`, `promo.bar.href`, `promo.bar.image`) with sensible defaults if unset, so copy edits don't need code changes.
- Mounted in `src/components/site-header.tsx` directly above the top nav row. Dismissible per-session via `sessionStorage`.

### 2. New: hero rotator (`HeroRotator`)
- New component `src/components/home/HeroRotator.tsx`. Wraps the existing hero block so the current BA teaser-video hero becomes **Slot 1** of the rotator instead of being replaced.
- 3–5 slots, each = `{ eyebrow, titleImage (transparent PNG) OR titleText, tagline, primaryCta, secondaryCta?, background (video OR image), backgroundPosition }`.
- Initial slots (driven from a typed `HERO_SLOTS` const in the same file):
  1. **Battlefield Atlantis #1 is live** — bg: the existing BA teaser video — CTA "Read the first act free" → `/reader/battlefield-atlantis/1`.
  2. **Darker Ages** — bg: DA cover — CTA "Enter the series" → `/darker-ages`.
  3. **Children of Aquarius** — bg: COA cover — CTA "Meet the cast" → `/children-of-aquarius`.
  4. **PS5 unlocks at 1,000 subscribers** — bg: starfield/milestone art — CTA "See the milestone" → `#milestone` or `/pricing`.
- Full-bleed (escapes `max-w-7xl`), min-height ~78vh desktop, 70vh mobile (matches current hero). Layered gradient overlay on the left for legibility.
- **Named-tab strip** at the bottom: short labels, active gets a red top-border underline. Click jumps slots; auto-advance every 7s, pauses on hover/focus/tab-hidden. Arrow keys + swipe on touch.
- Slot transition: fade + subtle bg drift via Tailwind utilities (`animate-fade-in`). No new animation library.
- Each CTA fires `track("hero_cta_click", { slot, target })` and each view fires `track("hero_slot_view", { slot })`.

### 3. New: red angled-corner CTA button variant
- Add `.btn-marvel` in `src/styles.css` alongside `.btn-cta`: solid red (new `--marvel-red` token if red isn't already in the palette), white uppercase 800-weight tracked text, **angled bottom-left corner via `clip-path: polygon(0 0, 100% 0, 100% 100%, 24px 100%, 0 calc(100% - 24px))`**, hover brighten + slight scale, `:focus-visible` ring.
- Used by the hero rotator's primary CTA and the ClosingBand primary CTA. Existing `.btn-cta` / `.btn-ghost` stay in place everywhere else.

### 4. Re-band the downstream landing sections
- Wrap "The slate", pricing strip, "Why subscribe / Pillars", and ClosingBand in full-bleed `<section>` containers each with their own background treatment (gradient or low-opacity art tile). Inner content stays constrained to `max-w-7xl`.
- Add `animate-fade-in` on intersection for each section title via a small `useInView` hook (new `src/hooks/useInView.ts`, ~20 lines, no dependency).

### 5. Card hover lift + image-first series cards
- Touch `src/components/series-card.tsx` only to add `hover:-translate-y-1 hover:shadow-2xl transition` and ensure the cover image dominates. No data changes.

### 6. CoverFan placement
- Move `<CoverFan />` into a new "The slate" intro position (above SeriesCards) so it isn't lost. The video background carries the hero alone.

## Out of scope
- No changes to pricing, auth, reader, server functions, DB schema, or i18n dictionary copy beyond optional new `promo.bar.*` keys.
- No new dependencies (no Framer Motion, no Embla — the rotator uses state + CSS).
- No nav restructuring (Marvel's category nav is a separate decision; possible follow-up).
- No changes to subpages.

## Technical notes
- **New:** `src/components/promo-bar.tsx`, `src/components/home/HeroRotator.tsx`, `src/hooks/useInView.ts`.
- **Edited:** `src/routes/index.tsx` (wrap hero in rotator, re-band sections, move CoverFan), `src/components/site-header.tsx` (mount PromoBar), `src/styles.css` (add `.btn-marvel`, optional `--marvel-red`), `src/components/series-card.tsx` (hover lift only).
- Accessibility: rotator tabs use `role="tablist"`/`role="tab"`/`aria-selected`; auto-advance respects `prefers-reduced-motion`. Promo bar is `role="region" aria-label="Site announcement"` with a close button.
- Performance: only Slot 1's background is eager; the rest are lazy and preloaded on tab hover/focus. The BA teaser video stays scoped to Slot 1 only.
- Analytics: new events `promo_bar_click`, `promo_bar_dismiss`, `hero_slot_view`, plus the existing `hero_cta_click` extended with a `slot` field.

## Risk
Low. Visual + layout changes scoped to the landing page and global header chrome. No data, auth, or payments touched. Easy to revert.

## Open question (one)
Do you have transparent-PNG title treatments for **Battlefield Atlantis**, **Darker Ages**, and **Children of Aquarius** (logo-style title art, the way Marvel uses the "X-MEN '97" logo)? If yes, wire them as `titleImage`. If not, I'll render the series name in display type as `titleText` and we can swap to PNGs later without code changes.
