## Goal

Bring the live animation feel from `realworldcomics.com/battlefield-atlantis` into our `/battlefield-atlantis` page. Three coordinated layers of motion — cover, hero, and page grid — using CSS only (no new deps), tuned to the existing `--neon` / `--plasma` / `--gold` tokens and respecting `prefers-reduced-motion`.

Scope: BA only. COA stays as-is.

## What changes

### 1. Cover plate — animated lightning + glow pulse
On the left cover plate inside the hero (the `$1.00 / ISSUE #1` framed cover):

- Add an absolutely-positioned `.ba-cover-fx` overlay layer with two sublayers:
  - `.ba-cover-fx__sparks` — radial-gradient streaks anchored top-center and mid-left that fade in/out on a 2.6s loop, evoking the lightning baked into the reference cover art.
  - `.ba-cover-fx__embers` — small warm radial blooms bottom-right on a 3.4s offset loop (the explosion glow on the reference).
- Wrap the cover frame in a `.ba-cover-glow` shell whose `box-shadow` pulses between `rgba(34,211,255,0.18)` and `rgba(160,64,255,0.28)` on a 4s loop (matches existing `--shadow-hero` register).
- Overlays are `pointer-events: none` and `mix-blend-mode: screen` so the cover image and the existing `▶ READ 9.5 PAGES FREE` button stay clickable and visually unchanged.

### 2. Hero — logo plate glow + ambient background drift
Right column hero area:

- BA logo plate (`baLogo` image inside its framed plate) gets a `.ba-logo-glow` class: a soft `--neon`→`--plasma` halo behind the plate that breathes on a 5s ease-in-out loop, plus a one-shot subtle scale-in on mount.
- Add a `.ba-hero-aurora` background layer (absolute, behind hero content, `pointer-events:none`) inside the hero section only. Two large blurred radial blooms slowly drift on independent 18s / 24s loops, contained to the hero so it doesn't fight the global page background.

### 3. Page-grid hover FX
On the existing "All 20 pages" grid:

- Free pages (1–9) and page 9.5 thumbnails: on hover, a diagonal lightning sweep (`.ba-page-card--free::after` with a gradient + `transform: translateX` on a 0.9s transition) plus a brief border flash to `--neon`. Cursor stays pointer; click target unchanged.
- Locked pages (10–20): on hover, a slow gold shimmer sweep on the dark card surface and the 🔒 icon nudges up 2px with a soft `--gold` glow. Card remains non-interactive (no link change).
- Both effects are CSS-only, no JS state.

### 4. Reduced-motion guard
Wrap every new keyframe / loop in `@media (prefers-reduced-motion: reduce)` and either disable the animation (`animation: none`) or replace with a single static, low-contrast variant — same pattern already used for `.page-flash--*` overlays. The hover sweeps degrade to a plain border/color change.

## Technical notes

- All CSS lives in `src/styles.css` appended after the existing reader flash block. New class prefix `.ba-` to avoid collisions.
- All JSX changes confined to `src/routes/battlefield-atlantis.tsx`: add wrapper divs/classes on the cover plate, hero section, logo plate, and the two page-card variants. No prop/loader/data changes.
- No new packages, no Motion/GSAP, no new assets. Existing tokens only.
- Reader (`reader.$series.$issue.tsx`) and its per-page flash map are out of scope and untouched.

## Out of scope

- COA page (explicitly deferred).
- Any change to copy, layout, drop dates, cast section, or routing.
- Replacing the cover image with a video / Lottie.
