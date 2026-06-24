## Goal
Use the uploaded "Darker Ages Issue One Cover Art 3" as the official cover for Darker Ages Issue #1, both on the Darker Ages series page and in the landing-page hero carousel (currently using a Battlefield Atlantis variant as a placeholder).

## Steps

1. **Upload the cover as a CDN asset**
   - Run `lovable-assets create --file /mnt/user-uploads/Darker_Ages_Issue_One_Cover_Art_3.png --filename darker-ages-issue-1-cover.png` and write the pointer to `src/assets/darker-ages-issue-1-cover.png.asset.json`.

2. **Landing page carousel (`src/components/home/HeroRotator.tsx`)**
   - Replace the placeholder `daVariant` import (`ba-issue-1-variant.png`) with the new cover asset.
   - Use it as the `backgroundImage` for the `darker-ages` slot. Keep the existing dark overlay so the title logo/CTAs stay readable.

3. **Darker Ages page (`src/routes/darker-ages.tsx`)**
   - Add the cover image below the eyebrow/logo block as the prominent Issue #1 cover (responsive, max-width ~420px, rounded with subtle shadow, alt text "Darker Ages Issue #1 — The Astral Temptation cover").
   - Add `og:image` / `twitter:image` pointing to the new asset URL so social shares use the cover.

## Notes
- The page-content image stays a real `<img>` (not a background) for SEO and sharing.
- No business-logic changes; presentation only.
