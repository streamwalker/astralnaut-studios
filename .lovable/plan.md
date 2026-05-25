## Rebrand tweak — widen the Real World Comics logo

The Real World Comics logo on the landing page currently sits at `max-w-[720px]` inside a padded container. The request is to widen it so it sits roughly **1 inch from each side of the page** while keeping the image undistorted.

### What will change
- **File:** `src/routes/index.tsx`
- **Logo container:** remove `px-6` padding from the brand-mark `<div>` so the logo can use the full `max-w-7xl` width.
- **Logo image:** replace `max-w-[720px]` with `max-w-[1100px]` (plus `w-full h-auto` to preserve aspect ratio). On a `max-w-7xl` viewport this leaves ~90 px on each side — about 1 inch at standard 96 px/in CSS resolution.
- Keep the neon drop-shadow and the "A subsidiary of Astralnaut Studios" caption as-is.

### Out of scope
- No other pages or components.
- No changes to the logo asset file itself.
- No changes to text, copy, or hero layout below the logo.