## Goal

Both brand logos (Real World Comics, Battlefield Atlantis title treatment) currently sit on visible rectangular "cards" because their source PNGs have baked-in dark backgrounds. Strip the boxes, generate true transparent versions, and move RWC up into the header next to the Astralnaut Studios wordmark.

## Changes

### 1. Generate transparent-background versions of both logos

Use `imagegen--edit_image` on the existing PNGs with `transparent_background: true` to cut out the dark navy field around each lockup. Save as new assets:

- `src/assets/real-world-comics-logo-transparent.png` (from `real-world-comics-logo.png`)
- `src/assets/battlefield-atlantis-logo-transparent.png` (from the current BA title PNG referenced as `baLogo` in `HeroRotator.tsx`)

Both will render with no rectangle, no halo card — only the metallic wordmark.

### 2. Site header (`src/components/site-header.tsx`)

Place the RWC mark inline with the Astralnaut Studios logo so the two imprints read as one lockup in the menu bar:

```text
[Astralnaut Studios logo]  |  [Real World Comics logo]     Library  Reader  Shop  ...
```

- Add the RWC transparent logo as a second `<img>` inside the existing left cluster (`<div className="flex items-center gap-4">`).
- Separate the two with a thin vertical divider (`border-l border-white/15 h-7`) so the relationship is "studio under imprint" without a card.
- Size: `h-7 md:h-8 w-auto` for RWC (slightly smaller than the Astralnaut mark since it's a wordmark). Same subtle cyan drop-shadow for visual parity.
- Both wrapped in a single `Link to="/"` so the whole lockup is the home affordance.

### 3. Home route (`src/routes/index.tsx`)

- **Delete** the entire standalone RWC block (lines 58–83) — the halo div + the `<img>` with `mixBlendMode: screen`. The hero rotator becomes the first thing under the header.
- Remove the now-unused `rwcLogo` import.

### 4. Hero rotator (`src/components/home/HeroRotator.tsx`)

- Swap the `baLogo` import to point at the new transparent BA title PNG so the dark rectangle stops covering the video.
- No blend-mode hack needed — the transparent asset sits cleanly over any video frame.

## Out of scope

- No copy, layout, animation, or button changes.
- No changes to the Darker Ages / Children of Aquarius / PS5 Milestone title treatments (those PNGs already read fine; revisit only if the user flags them).
- No backend changes.

## Verification

After the edits: load `/` in Playwright headless, screenshot the header (RWC + Astralnaut lockup, no boxes) and the BA hero slot (title floats over the video with no black rectangle), and confirm.
