## Goal
Make the cover fan on the homepage 50% larger so it reads as a hero element, not a thumbnail.

## Change
In `src/components/cover-fan.tsx`, bump the carousel container's `max-w-[560px]` to `max-w-[840px]` (560 × 1.5). The covers are sized with percentage widths inside that container, so every cover — front and fanned — grows proportionally. No layout/slot math changes.

The hero row in `src/routes/index.tsx` is a two-column grid; the carousel column will simply fill more of its half on wide screens. On narrower viewports the container stays fluid (`w-full`) so it won't overflow.

## Out of scope
- Slot positions, rotation, z-order
- Lightbox sizing
- Hero text column