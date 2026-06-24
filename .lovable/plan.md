## Goal

Re-cut the Battlefield Atlantis title PNG against a clean transparent background. The current transparent version has fringe/halo artifacts from the AI background removal pass — that's what's reading as "horrible."

## Approach

Skip the generic background-removal route (which caused the halo) and instead use luminance-keying on the **original** logo PNG. The source has the wordmark on a near-black background, so we can drop the dark pixels directly with no AI re-generation involved — preserves every metallic edge and glow exactly as the source artwork intended.

### Steps

1. **Process the source PNG locally** (`src/assets/battlefield-atlantis-logo.png`) with Python/PIL in the sandbox:
   - Convert to RGBA.
   - For each pixel, set alpha proportional to its luminance (max(R,G,B)).
   - Apply a small floor (pixels darker than ~12/255 become fully transparent) and ceiling (pixels above ~180 stay fully opaque) so faint background noise drops out but edge anti-aliasing is preserved.
   - Auto-crop to the non-transparent bounding box so the asset has no dead space.
   - Save as `src/assets/battlefield-atlantis-logo-clean.png`.

2. **Swap the import** in `src/components/home/HeroRotator.tsx` to point at the clean PNG.

3. **Verify** with Playwright: load `/`, screenshot the BA hero slot, zoom into the logo edges to confirm no halo fringe.

## Why this works

Luminance-keyed alpha is the standard technique for compositing glowing artwork on dark plates over arbitrary backgrounds. It keeps the cyan glow and red highlights as semi-transparent pixels (so they blend over the video instead of cutting hard at an alpha mask edge), and it can't introduce the white/blue fringe artifacts AI removal produced.

## Out of scope

- No size, position, layout, or copy changes — same dimensions and placement as today.
- RWC logo stays as-is (you didn't flag it).
