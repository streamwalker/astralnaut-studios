## Goal
Make the expanded character profile photo cards for Astra and Poseidon approximately 50% larger.

## Current State
- Modal max-width: `max-w-5xl` (~1024px)
- Grid split: `md:grid-cols-[1.4fr_1fr]`
- Image max-height: `max-h-[80vh]`

## Changes
1. **Widen modal** — change `max-w-5xl` to `max-w-7xl` (~1280px, ~25% wider).
2. **Give image more proportion** — change grid to `md:grid-cols-[2fr_1fr]` (image gets 67% width vs current 58%).
3. **Taller image** — increase `max-h-[80vh]` to `max-h-[90vh]` on the image and text columns.

Combined, these yield roughly 50% more visible image area without cropping.

## Affected File
- `src/routes/battlefield-atlantis.tsx` — lines 180-183 (character `DialogContent` and image panel).