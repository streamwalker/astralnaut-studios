## Goal

The above-the-fold hero on `/` currently funnels everyone into Battlefield Atlantis Issue 1, which mis-frames the landing page as a single-title site. Remove that CTA from the hero so the homepage stays title-agnostic. The per-title "Read 9.5 pages free" CTA on the Battlefield Atlantis page already exists, so no new button needs to be added there.

## Changes

### 1. `src/routes/index.tsx` — hero CTA row
- Remove the `▶ Read the first act free` `<Link to="/reader/$series/$issue" …>` button (lines ~103–110).
- Promote `See pricing` to the primary CTA (swap `btn-ghost` → `btn-cta`) so the hero still has one strong action.
- Add a secondary ghost link `Browse the slate` that scrolls to the existing `#slate` series shelf section further down the page (anchor on the `<section>` containing "The slate"). This gives readers the "pick a title" path the user described, using the slate section as the on-page library since there is no dedicated library route.
- Remove the now-unused `track("hero_cta_click", { target: "free_read" })` call; keep the pricing tracking event and add one for `browse_slate`.

### 2. `src/routes/index.tsx` — slate section
- Add `id="slate"` to the existing "The slate" `<section>` so the new hero anchor link resolves.

### 3. `src/routes/battlefield-atlantis.tsx`
- No change. The page already renders `▶ Read 9.5 pages free` linking to `/reader/battlefield-atlantis/1` in two spots (the side rail and the main CTA row).

### 4. Out of scope (explicitly not changing)
- `ClosingBand` at the bottom of `/` still says "Read the first act free → Battlefield Atlantis #1". The user's request targeted the above-the-fold button specifically; the closing band is below the slate (so readers have already seen all three titles) and is a conversion-band pattern, not a hero. Leaving as-is unless you want it changed too.
- `src/routes/__root.tsx` meta description copy ("Read the first act free.") — global tagline, not a button. Leaving as-is.

## Risk

Low. Pure presentation change on the homepage hero; no data, routing, or auth changes. No new routes needed.

## Open question

Should the `ClosingBand` CTA at the bottom of `/` also stop pointing directly at Battlefield Atlantis #1 (e.g., re-point to `#slate` or `/pricing`), or leave it as the proven conversion path now that the hero no longer privileges one title?
