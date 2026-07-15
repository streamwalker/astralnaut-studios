
## Goal

In the reader (`/reader/$series/$issue`), let the user scroll vertically within a page and zoom the page in/out without affecting the rest of the site layout.

## Current behavior

`src/routes/reader.$series.$issue.tsx` renders the page image inside a `.panel` with `overflow-hidden`, capped at `max-height: 85vh` with `object-fit: contain`. Click toggles a single `scale-150` zoom on the `<img>` itself. There is no internal scrolling, no pan, and no zoom controls — tall pages get letterboxed and detail is unreachable.

## Changes (reader route only)

1. **Contained, scrollable viewer**
   - Replace the current wrapper with a fixed-height viewport (`~85vh` desktop, `~75vh` mobile) that has `overflow: auto` so the page image scrolls vertically (and horizontally when zoomed) *inside* the viewer. Page-level scroll of the site is unaffected.
   - Image renders at natural width up to the viewer width; when zoomed beyond viewer bounds, scrollbars appear inside the viewer.

2. **Zoom controls**
   - Add a small control cluster above/overlaying the viewer: `−`, `Reset`, `+`, and a "Fit width / Actual size" toggle. Keyboard shortcuts: `+`, `-`, `0` (reset).
   - Zoom levels stepped (e.g., 0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×, 3×). Click on image continues to toggle between fit-width and last zoom-in level for quick access.
   - Ctrl/Cmd + wheel zooms; plain wheel/touch scroll pans as normal.
   - Zoom transform applied to the image only, inside the scroll container — no impact on header, nav, paywall, or surrounding layout.

3. **Preserve existing features**
   - Keep flash overlay, arrow-key page nav, paywall path, letters link, indicia, and access logging untouched.
   - Preserve `prefers-reduced-motion` handling (no zoom transition when reduced).

## Technical details

- Wrap the `<img>` in a `<div ref role="region" aria-label="Page viewer" tabIndex={0}>` with `overflow-auto`, fixed height via inline style, `overscroll-behavior: contain` so scroll doesn't chain to the page.
- Replace `scale-150`/click logic with a `zoom` numeric state; image style: `transform: scale(zoom); transform-origin: top left; width: 100%` (or `width: auto` at actual size). Wrap image in an inner sizer div whose `width`/`height` reflects `naturalSize * zoom` so the scrollbars track correctly.
- Reset zoom to fit-width whenever `page` changes.
- Applies to all issues via this shared route (Battlefield Atlantis included); no per-series branching.

## Out of scope

Pinch-zoom gestures on touch (native browser pinch still works on the image via CSS `touch-action: pinch-zoom` inside the viewer — I'll enable that), thumbnail navigator, and full-screen mode.
