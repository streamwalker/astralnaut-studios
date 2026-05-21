
# Integrate uploaded brand assets

You uploaded 4 images. Here's how I'll wire each one in.

## Assets in this batch

1. `Battlefield_Atlantis_Logo_1.png` — BA wordmark (chrome + red A)
2. `Children_of_Aquarius_Logo_2.png` — COA wordmark (circuit-blue)
3. `Darker_Ages_Close.png` — Darker Ages wordmark (ember/stone)
4. `Battlefield_Atlantis_Issue_One_Variant_Cover_M.png` — BA Issue 1 variant cover ("War of the Worlds Begins")

## Where they go

**Logos → `src/assets/`** (imported as ES6 modules for bundling)
- `astralnaut-logo.png` is already in `src/assets/`; the three series logos join it there.
- Update each series row in DB so `series.logo_path` points to the bundled asset URL (store the resolved URL string, or a sentinel like `local:ba-logo` that the frontend maps). Simpler: skip DB for logos and hard-map slug → imported asset inside `series-card.tsx` and the series hub heroes. Logos are brand chrome, not editor-managed content.

**BA variant cover → `comic-pages` bucket** via `supabase--storage_upload` to `battlefield-atlantis/issue-1/variant-cover-m.png`, then:
- Set `issues.cover_path = 'battlefield-atlantis/issue-1/variant-cover-m.png'` for BA Issue 1 (creates the issue row first if it doesn't exist — current DB only has COA Issue 1).
- Also append to `issues.variant_cover_paths` so the hub can show variant strip later.

## Page changes

1. **`src/components/series-card.tsx`** — replace the gradient placeholder block with the imported series logo when the slug matches `battlefield-atlantis | children-of-aquarius | darker-ages`. Keep gradient fallback.
2. **`src/routes/battlefield-atlantis.tsx`** — hero now shows the uploaded variant cover (via `pageUrl(issue.cover_path)`) and the BA logo above the H1 (H1 stays as visually-hidden text for SEO + screen readers; logo gets descriptive alt).
3. **`src/routes/children-of-aquarius.tsx`** — same treatment with COA logo (cover already exists from earlier upload).
4. **`src/routes/darker-ages.tsx`** — replace the giant text title with the Darker Ages logo image; keep H1 as sr-only.
5. **`src/routes/index.tsx`** — series slate cards use the logos automatically via SeriesCard change. Hero stays text.
6. **`src/components/site-header.tsx`** — Astralnaut logo is already there; no change.

## SEO

- Add `og:image` (and `twitter:image`) to each leaf series route pointing at the cover (BA variant cover, COA cover). Darker Ages gets the logo as og:image since no cover exists yet.
- Alt text: "Battlefield Atlantis logo", "Children of Aquarius logo", "Darker Ages logo", "Battlefield Atlantis Issue 1 variant cover — The War of the Worlds Begins".

## Migration / data changes (one combined migration + one storage upload + one insert)

```sql
-- Ensure BA series + Issue 1 row exist (idempotent upserts by slug)
INSERT INTO series (slug, name, genre, logline, sort_order, launch_label)
VALUES ('battlefield-atlantis', 'Battlefield Atlantis', 'Hard sci-fi space opera',
        '25,000 years before the present, Saantris Station is destroyed and the Tri-Planetary Coalition splits.', 1, 'Issue 1 live')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, genre = EXCLUDED.genre, logline = EXCLUDED.logline;

INSERT INTO issues (series_id, issue_number, title, subtitle, slug, free_pages, paid_pages, total_pages,
                    release_status, cover_path, drop_cadence)
SELECT id, 1, 'Only One Will Rule', 'The War of the Worlds Begins',
       'battlefield-atlantis-issue-1', 9.5, 11, 20, 'live',
       'battlefield-atlantis/issue-1/variant-cover-m.png', '4/wk'
FROM series WHERE slug = 'battlefield-atlantis'
ON CONFLICT (slug) DO UPDATE SET cover_path = EXCLUDED.cover_path;
```

Plus: upload variant cover to `comic-pages/battlefield-atlantis/issue-1/variant-cover-m.png`.

## What I still need from you (not blocking this batch)

- BA pages 1–9.5 (the 10 free pages) so the BA reader actually shows art
- Character portraits (Zeus, Orion, Rhea, Astra, Prometheus)
- Faction emblems (NDF, TPC)
- COA pages 1–9 (currently only the 5 you uploaded earlier are in storage; confirm pages 6–9 exist or send them)

Approve and I'll wire all four assets in one pass.
