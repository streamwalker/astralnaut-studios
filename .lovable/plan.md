## Replace header brand mark with new Astralnaut Studios logo

### What will change
- **Asset:** Copy `user-uploads://ChatGPT_Image_May_24_2026_at_09_19_30_PM.png` → `src/assets/astralnaut-studios-logo.png`
- **File:** `src/components/site-header.tsx`
  - Remove the 44×44 bordered/glowing square containing `baLogo` and the adjacent "Astralnaut Studios" text block
  - Replace with a single `<img>` of the new logo inside the existing `<Link to="/">`, sized `h-10 w-auto` (~40px tall, preserves aspect ratio)
  - Keep a soft neon drop-shadow for visual consistency with the rest of the site
  - Remove the now-unused `baLogo` import

### Out of scope
- Footer "Astralnaut Studios LLC" text
- Other pages / nav / CTA / Real World Comics landing logo
