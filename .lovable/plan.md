
## Goal

Make every page load faster and feel smoother on mobile, tablet, and desktop by removing dead code, shrinking oversized assets, and fixing a few targeted perf issues. No visual rewrite — only responsive polish and faster paint.

## What I found

### Bloat
- **Assets weigh ~61 MB** in `src/assets/`. Several files are unused: `battlefield-atlantis-logo-transparent.png` (1.1 MB), `src/assets/tees/*.png` (~5 files, multi-MB each).
- **The header logo `astralnaut-studios-logo.png` is 2.1 MB**, served on every page — it dominates LCP for non-hero routes.
- Series logos (BA, DA, CoA) and issue covers are 1–3 MB PNGs at full resolution even when displayed at ≤720 px.
- **27 unused shadcn UI components** sit in `src/components/ui/` (accordion, carousel, chart, sidebar, calendar, menubar, navigation-menu, drawer, command, form, table, popover, progress, scroll-area, slider, etc.). All confirmed zero references outside their own folder.
- **22 unused npm dependencies** correspond to those components (`embla-carousel-react`, `recharts`, `react-resizable-panels`, `vaul`, `react-day-picker`, `input-otp`, `cmdk`, `date-fns`, and 14 unused `@radix-ui/*` packages).

### Perf gaps
- No `<link rel="preload">` for the hero LCP poster/image.
- `HeroRotator` renders all 4 background images at once, even off-screen ones, and uses `min-h-[560px]` on mobile which forces wasted space.
- Below-fold images (CoverFan, Pillars, ClosingBand) don't all set `loading="lazy"` / `decoding="async"`.
- Hero section content uses `pb-20 pt-10` on mobile — taller than needed; combined with the tab strip it overflows on small phones.

### Won't touch
- Business logic, Supabase server functions, routes structure, content/copy, copyright blocks, hero rotator behavior/timing.
- Any auth / payment / admin code paths.
- Hero video playback rules and `HeroRotator` 15 s autoplay.

## Changes

### 1. Delete unused files (no code edits needed)
Files removed:

```text
src/components/ui/
  accordion.tsx       alert.tsx           aspect-ratio.tsx
  avatar.tsx          breadcrumb.tsx      calendar.tsx
  card.tsx            carousel.tsx        chart.tsx
  collapsible.tsx     command.tsx         context-menu.tsx
  drawer.tsx          form.tsx            input-otp.tsx
  menubar.tsx         navigation-menu.tsx pagination.tsx
  popover.tsx         progress.tsx        radio-group.tsx
  resizable.tsx       scroll-area.tsx     sidebar.tsx
  slider.tsx          table.tsx           toggle-group.tsx

src/assets/
  battlefield-atlantis-logo-transparent.png
  tees/  (entire folder)
```

### 2. Uninstall unused packages
```text
embla-carousel-react   recharts                react-resizable-panels
vaul                   react-day-picker        input-otp
cmdk                   date-fns
@radix-ui/react-accordion, -aspect-ratio, -avatar, -collapsible,
-context-menu, -hover-card, -menubar, -navigation-menu,
-popover, -progress, -radio-group, -scroll-area, -slider,
-toggle-group
```

### 3. Compress oversized PNGs (in place, keep transparency)
Use Python/Pillow to downscale + re-encode with optimization:

```text
Header / brand
  astralnaut-studios-logo.png         -> 480 px wide  (~2.1 MB → ~120 KB)
  real-world-comics-logo.png           -> 480 px wide  (~1.3 MB → ~80 KB)
  real-world-comics-logo-transparent.png -> 480 px wide (~935 KB → ~70 KB)
Series logos (hero + subpage)
  battlefield-atlantis-logo*.png       -> 720 px wide
  darker-ages-logo*.png                -> 720 px wide
  children-of-aquarius-logo*.png       -> 720 px wide
Covers
  coa-issue-1-cover.png                -> 1400 px wide
  ba-issue-1-variant*.png, coa-variant*.png, ryuken-crew -> 1200 px wide
```

Estimated total `src/assets/` reduction: **~30 MB → ~10 MB**.

### 4. Perf wiring on the landing route
`src/routes/index.tsx`:
- Add `<link rel="preload" as="image" href={posterUrl} fetchpriority="high">` in `head().links` for the BA hero poster (the actual LCP image).

`src/components/home/HeroRotator.tsx`:
- Only render the background `<img>` for the active slot + the next slot; lazy-load the rest. Keep poster preload for slot 1.
- Drop mobile `min-h-[560px]` to `min-h-[480px]`; tighten mobile padding `pt-10 pb-20` → `pt-8 pb-16`.
- Add `decoding="async"` to all background `<img>`.

`src/components/cover-fan.tsx`, `src/components/home/PricingStrip.tsx`, `src/components/home/ClosingBand.tsx`:
- Add `loading="lazy"` + `decoding="async"` to every `<img>` not already eager.

### 5. Responsive polish
- `site-header.tsx`: shrink mobile logo from `h-10` to `h-8`, tighten gap; the CTA "Start reading →" only shows on `sm:` and up to stop it from wrapping into the logo on phones.
- `HeroRotator` tab strip: switch `px-3 py-2` to `px-2 py-1.5` on mobile so all four tabs fit without horizontal scroll on a 360 px viewport.
- `index.tsx`: hero copy column drops `py-16` to `py-12` on mobile.

### 6. Verification
- Run `bun run build` to confirm no broken imports after deletions/removals.
- Drive Playwright at 390 px, 820 px, and 1440 px viewports; capture screenshots of `/`, `/shop`, `/pricing`, `/battlefield-atlantis`, `/darker-ages`; check no layout regression.
- Confirm preload tag and lazy `<img>` attributes show up in rendered HTML.

## Expected impact

- ~20–25 MB shaved off `src/assets/` (faster bundle/CDN cold cache and faster first paint on every page that ships those files).
- ~22 fewer npm packages → smaller `node_modules`, faster cold builds, smaller transitive client surface.
- Hero LCP image preloaded → measurably faster LCP on `/`.
- Mobile hero ~80 px shorter, tab strip no longer scrolls on small phones.
- No visual or behavioral changes outside the responsive tweaks listed above.
