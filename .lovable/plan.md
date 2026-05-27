## Goal

Stop pulsing the whole cover/hero and instead pulse the actual decorative elements on the page, each in its own color. Match each effect to the element it's on.

## What's wrong with the current pass

- `ba-cover-glow` pulses a cyan→purple halo around the entire cover frame. Too broad, doesn't match anything specific on screen.
- `ba-cover-fx` (sparks + embers) overlays generic blue/orange gradients on top of the cover art, which already has lightning and embers baked in. Adds noise, not signal.
- `ba-hero-aurora` smears violet/cyan behind the whole hero — same "ambient" problem.
- `ba-logo-glow` actually does match (cyan↔purple = the logo plate gradient). Keep it.
- Page-grid hover sweeps are tied to real interaction. Keep them.

## What changes

### 1. Remove the broad ambient layers
- Drop `.ba-cover-glow` from the cover wrapper. Restore the static `boxShadow: var(--shadow-hero)`.
- Remove the `.ba-cover-fx` overlay block (sparks + embers) from the JSX.
- Drop `.ba-hero-aurora` from the hero section.
- Delete the now-unused CSS rules (`ba-cover-glow`, `ba-cover-fx*`, `ba-hero-aurora`, `ba-aurora-a/b`, `ba-sparks`, `ba-embers`) to keep the stylesheet tidy.

### 2. Localized pulses, color-matched to each element

Each new effect uses tokens drawn from the element it lives on — no foreign colors.

| Element | Effect | Color |
|---|---|---|
| Yellow "1ST EXPLOSIVE ISSUE!" starburst sticker | Slow scale + glow pulse, subtle rotation wobble | Yellow/gold (`#facc15` halo) — matches its own radial-gradient fill |
| Red "WAR OF THE WORLDS BEGINS!" starburst | Heartbeat pulse (scale + red halo) | Red (`#dc2626` halo) — matches its own fill |
| Cyan "9.5 PAGES · FREE" pill | Soft glow breathe | Emerald/cyan halo matching the pill's `from-emerald-300 to-cyan-300` gradient |
| "▶ READ 9.5 PAGES FREE" CTA (bottom-of-cover + the duplicate in the copy column) | Slow gradient-glow pulse | Cyan→blue→purple halo matching the button's existing gradient |
| BA logo plate | Keep `ba-logo-glow` as-is | Cyan↔purple — already matches |

All effects:
- Use `box-shadow` + `transform` (no overlay layers), so they affect only the element.
- `will-change: transform, box-shadow` and respect `prefers-reduced-motion` (animation disabled, base styling preserved).
- Tuned to gentle amplitudes / 2.5–4s loops so they read as accent, not jitter.

### 3. Resulting feel
- The cover image stays untouched and clean — its own lightning art reads as intended.
- The comic-book stickers and the primary CTA "breathe" in their own colors, drawing the eye like a real comic cover would.
- The BA logo continues its subtle cyan/purple breathing.
- No competing ambient haze around the hero.

## Technical notes

- All work in `src/routes/battlefield-atlantis.tsx` (remove 3 wrapper classes, add 4 element-level classes) and `src/styles.css` (drop 5 keyframe blocks, add 4 smaller ones).
- No JS, no new deps, no layout changes.
- The earlier hydration warning was SSR/client drift from the prior edit pass and clears on the next clean build; this pass also simplifies the JSX so it won't recur.

## Out of scope

- Reader, COA, layout, copy, data.
- Page-card hover FX (already localized — kept as-is).
