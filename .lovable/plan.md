## Goal

Make every shareable page render a correct, image-rich preview on Facebook, LinkedIn, iMessage, Slack, Discord, X/Twitter, etc.

## Current state

- `__root.tsx` already sets sitewide `og:site_name`, `og:title/description/type`, `twitter:card=summary_large_image`, `twitter:title/description`, and an `og:image` pointing at a temporary upload URL.
- Most leaf routes set `og:title`, `og:description`, and many set `og:url` + canonical, but those URLs are relative (`/darker-ages`) — social crawlers require absolute URLs.
- Series leaves (`darker-ages`, `battlefield-atlantis`, `children-of-aquarius`) already have per-page `og:image`. Other routes inherit only the root image.
- Missing routes (no per-page `og:image` or absolute URL): `index`, `shop`, `pricing`, `perks`, `learn`, `learn.$moduleId`, `industry`, `astralnaut-studios`, `help`, `help.$slug`, `raffle.rules`, `raffle.free-entry`, `product.$handle`.

## Changes

### 1. Default brand social image (1200×630)
Generate one premium-quality `og-default.jpg` (Astralnaut Studios brand, dark cosmic backdrop, "Real World Comics" wordmark, legible at preview size), upload via `lovable-assets`, and store the asset JSON at `src/assets/og-default.jpg.asset.json`.

### 2. `src/routes/__root.tsx`
- Remove `og:image` and `twitter:image` from the root `head()` (per project guidance — root meta concatenates into every match and can stomp leaf images).
- Keep all other sitewide tags.

### 3. Per-route fixes
For every route's `head()`:
- Rewrite `og:url` and `<link rel="canonical">` to absolute `https://astralnautstudios.com/<path>` (fix existing relative ones; add where missing on shareable pages).
- Add `og:image` + `twitter:image` (absolute URL) and `og:image:alt` / `twitter:image:alt`. Use the per-page hero/cover where one exists; otherwise the new brand `og-default.jpg`.
- Add `og:image:width=1200`, `og:image:height=630` on routes using the default image.
- Add `og:type` (`website` for marketing pages, `article` for help/learn detail, `product` for `product.$handle`).
- Add `twitter:site` / `twitter:creator` (use `@AstralnautStu` placeholder — will confirm handle with user before publishing if not already known).

Routes touched: `index.tsx`, `shop.tsx`, `pricing.tsx`, `perks.tsx`, `learn.tsx`, `learn.$moduleId.tsx`, `industry.tsx`, `astralnaut-studios.tsx`, `help.tsx`, `help.$slug.tsx`, `raffle.rules.tsx`, `raffle.free-entry.tsx`, `product.$handle.tsx`, `darker-ages.tsx`, `battlefield-atlantis.tsx`, `children-of-aquarius.tsx`.

### 4. Note to user
Crawlers cache previews — existing shared links won't update until Facebook/X/LinkedIn debuggers are re-scraped.

## Out of scope
- Sitemap, robots, structured data (already present where needed).
- No backend/data changes.

## Open question
Do you have official X/Twitter and Facebook handles to wire into `twitter:site`, `twitter:creator`, and `article:publisher`? If not, I'll omit them rather than guess.
