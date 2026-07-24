## Goal
On viewports ≤640px, render the hero logo glow stronger so it stays legible over the video background, without changing desktop/tablet output or any other element.

## Change
`src/components/home/HeroRotator.tsx` — `SlotContent`:
1. Add a tiny `useIsMobile()` hook (local, reusing `window.matchMedia("(max-width: 640px)")` with a listener; falls back to `false` for SSR).
2. Derive a mobile-boosted glow before passing to `buildGlowFilter`:
   - `intensity` → `Math.min(100, Math.round(base.intensity * 1.6 + 10))`
   - `spread`    → `Math.min(200, Math.round(base.spread    * 1.35 + 6))`
   - `enabled`   → force `true` on mobile if the logo is present (so the readability boost still applies even when an admin disables the glow globally); color unchanged.
3. Pass the boosted object to `buildGlowFilter(...)`. Non-mobile passes the original `glow` unchanged.

## Scope guard
- No changes to `buildGlowFilter`, admin panel, DB schema, other slots' backgrounds, tab strip, or any non-hero component.
- Only the `<img>` filter for the currently active hero slot is affected.
- SSR-safe: hook returns `false` during first render, upgrades on mount — no layout shift (only filter changes).

## Out of scope
- Persisting a separate mobile setting in the DB (kept as a derived multiplier for now).
- Adjusting the video overlay opacity.
