
## Goal
Rebrand the public-facing site as "Real World Comics" (a subsidiary of Astralnaut Studios) and showcase the uploaded logo prominently on the landing page.

## Changes

### 1. Add the logo asset
- Copy `user-uploads://Real_World_Comics_Logo_V1.12.png` → `src/assets/real-world-comics-logo.png` so it can be imported and bundled.

### 2. Homepage hero (`src/routes/index.tsx`)
- Insert a new full-width, centered block directly below `<SiteHeader />` and above the existing hero `<section>`.
- Contents: the Real World Comics logo, max-width ~720px, centered, with generous top/bottom padding, subtle drop shadow / glow consistent with the neon theme. Use `alt="Real World Comics"` and mark it as the page's H1-adjacent brand mark (the existing H1 tagline stays).
- Small caption underneath in the existing eyebrow style: "A subsidiary of Astralnaut Studios".

### 3. Site-wide branding text
- `src/routes/__root.tsx` head meta: update title + og:title + twitter:title from "Real World Comics — The next page only drops here" (already says Real World Comics, keep) — no change needed unless we want to add "by Astralnaut Studios" suffix. Will leave as-is.
- `src/routes/index.tsx` route `head()`: same — already "Real World Comics —". No change.
- `src/components/site-header.tsx`: keep the small Astralnaut Studios wordmark in the top-left (it's the parent company). No change to header text so the new logo on the page below isn't redundant with the header brand.
- `SiteFooter` already shows "Astralnaut Studios LLC" — leave as the legal owner line.

### 4. Out of scope (not changing in this pass)
- Renaming routes, series pages, pricing copy, or the small header logo/wordmark.
- Favicon / social share image swap (can be a follow-up once we confirm logo sizing).
- Per-series logos in the carousel.

## Technical notes
- Import the PNG as an ES6 module: `import rwcLogo from "@/assets/real-world-comics-logo.png"`.
- Use a plain `<img>` with `loading="eager"` and width/height to avoid CLS.
- Wrap in a centered `<div className="mx-auto max-w-7xl px-6 pt-10 pb-4 text-center">` so the existing hero section's padding still feels balanced.
