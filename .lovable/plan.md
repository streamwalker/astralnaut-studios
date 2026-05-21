## Landing hero + sitewide style refresh

### 1. Assets
- Copy `user-uploads://Children_of_Aquarius_Issue_One_-_Main_Cover.png` → `src/assets/coa-issue-1-cover.png`. Also overwrite storage `comic-pages/children-of-aquarius/issue-1/main-cover.png` and update COA Issue 1 `cover_path` so the series hub uses the new main cover.
- Copy `user-uploads://01._Battlefield_Atlantis_Issue_One_Variant_Cover_FINAL_CUT.png` → `src/assets/ba-issue-1-variant.png` and overwrite storage `comic-pages/battlefield-atlantis/issue-1/variant-cover-m.png` so the BA hero uses the FINAL CUT.

### 2. Typography (sitewide)
- In `src/routes/__root.tsx` `head().links`: add Google Fonts `<link rel="preconnect">` to fonts.googleapis/gstatic and a stylesheet link for **Inter** weights 400, 500, 700, 800, 900.
- In `src/styles.css`: change `body` font-family to `"Inter", system-ui, -apple-system, sans-serif`. Headings stay `font-black` (Inter 900) with `letter-spacing: -0.02em` to match the sample's tight geometric sans. Bump `.eyebrow` letter-spacing to 6px and switch default color to `var(--neon)` (keep gold as opt-in via inline style for stat numbers).

### 3. Header — option B (`src/components/site-header.tsx`)
Replace nav array with:
```
Library      → /
Characters   → /battlefield-atlantis  (closest existing — character grid lives there)
Reader       → /reader/battlefield-atlantis/1
Community    → /pricing               (placeholder until built)
Rewards      → /pricing
Pricing      → /pricing
For Industry → /industry              (gold accent)
```
- Logo block: framed BA series logo tile (rounded, cyan border glow) + `ASTRALNAUT STUDIOS` wordmark in Inter 800, 3px tracking. Use `seriesLogos["battlefield-atlantis"]` since BA is the flagship.
- Right side: `Sign in` text link + `Start reading →` cyan→blue gradient pill linking to `/reader/battlefield-atlantis/1`.
- Active nav item: gold (`var(--gold)`) via `activeProps`.

### 4. New `CoverFan` component (`src/components/cover-fan.tsx`)
- Receives no props. Imports `baLogo` not needed — uses 3 cover images: `coaCover`, `baVariant`, and existing `baCoverM` (the older BA variant from storage, re-imported as asset).
- Renders a relative container, each cover absolutely positioned with `rotate-[-8deg]`, `rotate-[3deg]`, `rotate-[9deg]`, staggered translate-x/y, `drop-shadow-[0_25px_60px_rgba(34,211,255,0.25)]`, hover lift.
- Mobile: stack as a single centered cover (`md:` reveals the fan).

### 5. Landing hero rewrite (`src/routes/index.tsx`)
Replace current hero section with a two-column `md:grid-cols-2 md:items-center` block:

Left column:
- Eyebrow: `⚡ NEW EPISODES EVERY WEEK · NETFLIX FOR COMICS` in cyan.
- H1: "The next page only drops here." — `text-6xl md:text-7xl font-black tracking-tight leading-[1.02]`.
- Sub: existing copy with `<span style="color:var(--gold)">PlayStation 5 unlocks at 1,000 subscribers.</span>` inline.
- Info pill card: dark panel, cyan border, 📺 emoji + `9.5 PAGES OF EVERY ISSUE · FREE` (cyan eyebrow) + `The full first act + title page · free for everyone · no signup required.` (muted body).
- Buttons: `▶ Read the first act free` (`btn-cta`, links to `/reader/battlefield-atlantis/1`) + `See pricing` (`btn-ghost`).
- Stat row of 3: gold numerals (`text-3xl font-black mono`) with tiny uppercase labels — `Subscribers` (from `milestone.current_count`), `Series live` (`3`), `Pages so far` (computed from `getSiteCopy` key `home.stats.pages` with fallback `52`).

Right column: `<CoverFan />`.

The rest of the homepage (milestone strip, slate, "why subscribe" pillars) stays as-is.

### 6. SEO
- Update root `head()` title to `Real World Comics — The next page only drops here` and description to the new hero sub copy.

### Technical notes
- No DB migration. Storage uploads are two `supabase--storage_upload` overwrites; COA `cover_path` update is one row update via migration (small).
- No new dependencies — Inter ships via Google Fonts link.
- `CoverFan` is presentation-only; covers imported as ES6 assets so Vite hashes them.

### Files touched
- new: `src/assets/coa-issue-1-cover.png`, `src/assets/ba-issue-1-variant.png`, `src/components/cover-fan.tsx`
- edited: `src/routes/__root.tsx`, `src/styles.css`, `src/components/site-header.tsx`, `src/routes/index.tsx`
- storage: 2 overwrites; 1 migration row update for COA cover_path
