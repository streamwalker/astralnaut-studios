## Goal
Per-series glow controls (color, intensity, spread, on/off) for hero logos on the landing page, editable from the Admin portal and persisted in the database.

## Data model
New table `public.hero_logo_glow`:
- `series_slug text primary key` (`battlefield-atlantis` | `darker-ages` | `children-of-aquarius`)
- `enabled boolean not null default true`
- `color text not null default '#ffffff'` (hex)
- `intensity int not null default 55` (0–100)
- `spread int not null default 42` (px, blur radius of outer halo)
- `updated_at timestamptz`

RLS + grants:
- `GRANT SELECT ... TO anon, authenticated` (public read — needed so the landing page can render without auth)
- `GRANT ALL TO service_role`
- Policies: SELECT for anon/authenticated; INSERT/UPDATE only when `has_role(auth.uid(),'admin')`
- Seed one row per current hero slot with today's BA values as defaults.

## Frontend
1. `src/lib/hero-glow.functions.ts` — `listHeroGlow` (public, `TO anon`, no bearer) and `upsertHeroGlow` (`requireSupabaseAuth` + admin check).
2. `HeroRotator.tsx`
   - Fetch glow rows via `ensureQueryData` + `useSuspenseQuery` in the component (already client-only rotator).
   - Replace the hard-coded BA-only `filter` with a helper `buildGlowFilter({color, intensity, spread, enabled})` producing two `drop-shadow()` halos scaled by intensity, plus the existing base dark drop-shadow. `enabled=false` → base shadow only.
   - Apply per slot by `slot.id`.
3. Admin UI at `/admin/media` — new "Logo Glow" tab (`src/components/admin/media/glow-panel.tsx`):
   - Row per series: `Switch` (enabled), color picker (`<input type="color">` + hex text), intensity slider 0–100, spread slider 0–120.
   - Live preview: renders the current logo with the in-progress filter side-by-side.
   - Save button calls `upsertHeroGlow`; on success invalidate the `hero-glow` query so landing page reflects the change without redeploy.

## Technical details
- Filter math:
  `drop-shadow(0 0 ${spread*0.4}px ${colorAt(intensity*0.9)}) drop-shadow(0 0 ${spread}px ${colorAt(intensity*0.55)}) drop-shadow(0 8px 30px rgba(0,0,0,0.7))`
  where `colorAt(a)` = `rgba(r,g,b,a/100)` derived from hex.
- Keep BA defaults matching current look so nothing changes visually until an admin edits.
- No changes to routes/series pages; scope is landing hero only.
- Admin gate reuses existing `has_role` pattern already used by `/admin/media`.

## Out of scope
- Glow on series pages, cards, reader header.
- Motion/animation of the glow.
