
# Rebuild Real World Comics (Astralnaut Studios)

The JSON is a full spec for a 3‑series subscription comics platform. The current project already has Lovable Cloud + a `chapters`/`comics`/`characters` schema and one admin upload form. I'll rebuild on top of it (not throw it away) and align everything to the spec.

## Phase 1 — Design system + data model

**Design tokens (rewrite `src/styles.css`)** to the mission-control palette from the spec: bg `#02000c`, panel `#10102b`, ink `#e9eefb`, accents cyan `#22d3ff`, plasma `#a040ff`, gold `#f4c95d`, red `#ff3b4a`. Mono for stats/counters, system sans for body. Hero 54/900, section 34/900, eyebrow 12/800 uppercase 5px tracking. Card radius 8–14, hover lift `translateY(-6px)`.

**DB migration** — extend current schema:
- `series` (id, slug, name, genre, status, logline, cover_path, sort_order)
- `issues` (id, series_id, number, title, subtitle, free_pages, paid_pages, total_pages, release_status, cover_path, drop_cadence)
- `issue_drops` (issue_id, week, patron_date, reader_date, pages int[])
- `factions` (id, series_id, name, acro, summary, emblem_path)
- Repoint `chapters` → `issues` (keep `chapters` as legacy view OR migrate the existing COA rows into the new tables). Add `comics.is_free boolean`, `comics.locked_until timestamptz`.
- `subscribers`: add `tier` enum (`reader|initiate|patron`), `status`, `stripe_customer_id` (Stripe wiring is Phase 5).
- `milestones` (id, name, target, current, ends_at, rewards jsonb) seeded with "Atlantis Rising 624/1000".
- `raffle_entries` (subscriber_id, week_of, entries int).
- `forum_threads` + `forum_posts` + `canon_votes` (subscriber‑gated).
- RLS: public read on published series/issues/free pages; paid pages require an authenticated subscriber with active tier; admin full CRUD via `has_role`.

Seed the 3 series + COA Issue 1 + BA Issue 1 rows from the JSON.

## Phase 2 — Public pages (file routes)

```text
/                      home (hero, milestone strip, 3 series cards, pricing, leaderboard, footer)
/battlefield-atlantis  BA reader hub
/children-of-aquarius  COA reader hub
/darker-ages           Darker Ages teaser (Oct 2026 launch)
/pricing               3-tier card grid w/ tier perks
/industry              Hollywood press kit (separate tone, no consumer copy)
/reader/$series/$issue fullscreen reader (modal-style route)
/login, /signup        auth
/account               subscriber dashboard (tier, raffle entries, drop calendar)
```

Per-route `head()` metadata (title, description, og:title/description, og:image from cover). Single H1 per page. JSON-LD: `ComicSeries` / `ComicIssue` / `Organization` / `Person` / `Product` (tiers) / `FAQPage` / `BreadcrumbList`.

**Series hub layout** (BA + COA):
- Hero with cover, logline, "Read first 9.5 free" CTA
- Page grid: 20–24 tiles, free unlocked, paid locked with drop date pill
- Cast gallery → character lightbox modal (BA)
- Factions strip (NDF / TPC for BA)
- Synopsis + canon callouts

**Reader** (`/reader/$series/$issue?page=N`):
- Fullscreen page-by-page nav (arrows / keyboard / ESC)
- Continuous-scroll toggle (BA)
- Zoom
- Free-page badge
- Paywall card replaces image when page > free_pages and user lacks tier — shows drop date, 3-tier price stats, subscribe CTA
- BA pages 1–9.5: motion-comic CSS layer (Saantris explosion, lightning pulse, hologram glow, engine emission) implemented as per-page CSS classes over the static art

## Phase 3 — Admin Control Room

Replace the current `/admin` single-form with a tabbed dashboard at `/admin` (protected by `_authenticated` + `has_role('admin')`):

1. **Dashboard** — live counters (subs, free/paid pages, tiers), milestone progress, pending preview
2. **Edit Copy** — keyed find/replace on page strings stored in a `site_copy` table
3. **Issues & Series** — release paid pages (set `published_at`), schedule launch, add cover art, launch new issue
4. **Assets** — single + bulk upload to `comic-pages` / `characters` / `blog-covers` storage buckets
5. **Stats** — subscriber count, raffle entries, current giveaway
6. **Stage & Push** — review staged changes log (audit table)

Comic-page uploader (already exists) gets extended: multi-file drop, auto page-number sequencing, free/paid flag, drop-date picker, per-series chooser.

## Phase 4 — SEO + AEO

- `/sitemap.xml` (server route) generated from DB
- `/robots.txt` allowing GPTBot, ClaudeBot, Google-Extended, PerplexityBot, Applebot, Bingbot
- `/llms.txt` AI-readable site summary
- JSON-LD blocks per route via `head()`

## Phase 5 — Subscriptions (deferred, asks needed)

Stripe wiring for Reader $4.99 / Initiate $9.99 / Patron $24.99 monthly, webhook → updates `subscribers.tier`. Tier-staggered drop logic: a page is visible when `now() >= drop_date - tier_offset` (Patron −48h, Initiate −24h, Reader 0h).

## Phase 6 — Motion + community polish

CSS motion layer for BA pages, character lightbox, forum threads, canon voting, raffle entry tracker, top-reader leaderboard.

---

## Technical notes

- Stack stays TanStack Start v1 + Lovable Cloud (Supabase). No framework swap.
- All page art served from `comic-pages` public bucket via signed URL only for paid pages (free pages stay public). I'll add a server fn `getReaderPage({issueId, page})` that checks subscriber tier before issuing the signed URL.
- Brand/logo art and series covers go into `src/assets/` (small) or the `comic-pages` bucket (large CGI pages).
- The current COA Issue 1 rows in `chapters`/`comics` will be migrated into the new `series`/`issues` shape, not duplicated.
- The existing `/admin` upload route is preserved as the "Assets" tab inside the new Control Room.

---

## What I need from you before building

Assets aren't in the project yet — only the JSON spec and the Astralnaut logo. To make this pixel-faithful I need:

1. **Series logos** (BA Logo 1 + 2, COA, Darker Ages title card) — at least low-res PNGs
2. **Cover art** for BA Issue 1 (3 variants) and COA Issue 1 (main + variant A) — COA main is already uploaded? confirm
3. **Character portraits** (Zeus, Orion, Rhea, Astra, Prometheus) for BA cast gallery
4. **Faction emblems** (NDF, TPC)
5. **BA Issue 1 pages 1–9.5** (10 free pages) so the BA reader works on day one
6. Confirmation that I should: (a) **defer Stripe** until later, (b) build the **motion-comic CSS layer** now or in Phase 6, and (c) keep the **deployed admin** password-gated by login (Lovable auth, not the `alympia` access code).

Once you confirm scope + drop the assets, I'll execute Phases 1–4 in one pass.
