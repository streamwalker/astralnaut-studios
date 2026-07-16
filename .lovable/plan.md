
## 1. Replace the Battlefield Atlantis Issue 1 main cover

Upload the attached "Battlefield Atlantis Issue 1 Primary Cover A" to Supabase Storage in the `comic-pages` bucket at `battlefield-atlantis/issue-1/primary-cover-a.png`, then update `issues.cover_path` for BA #1 to that path. This is what the BA series page (`src/routes/battlefield-atlantis.tsx`) already reads via `getSeriesBundle` → `issue.cover_path`.

Also refresh the two hard-coded references so previews/social match:
- OG/Twitter/JSON-LD image URLs at the top of `src/routes/battlefield-atlantis.tsx` (currently pointing at `variant-cover-m.png`).
- The landing-page carousel entry in `src/components/cover-fan.tsx` for BA #1 (currently imports `ba-issue-1-variant.png`) — replaced by the new asset (see §2 for how carousel becomes admin-managed).

## 2. Admin: Book Covers manager

Add a "Covers" section under the existing Admin page (`/admin`) that lists all issues (series + issue number + current cover thumbnail) and lets the admin:
- Upload a new cover image (drag-drop or file picker) → uploads into `comic-pages/<series-slug>/issue-<n>/cover-<timestamp>.<ext>` and updates `issues.cover_path`.
- Or paste an existing storage path.
- Preview + Save + Revert.

Backed by a new authenticated server function `updateIssueCover` (admin-only via `has_role`) that writes to `issues` and invalidates the series bundle cache.

## 3. Admin: Landing carousel manager

The landing-page "cover fan" is currently a hard-coded array in `src/components/cover-fan.tsx`. Move it to a new DB table `carousel_slides` (id, image_path, alt, sort_order, is_published) with RLS: public SELECT for published, admin write. Grants: `anon`/`authenticated` SELECT, `service_role` ALL.

- Seed the table with the current 7 covers so behavior is unchanged.
- `cover-fan.tsx` fetches from the table via a new public server fn `listCarouselSlides` and falls back to the current static list if the fetch fails (safety during rollout).
- Admin "Carousel" panel: list slides with thumbnails, reorder (up/down), toggle published, edit alt text, upload/replace image, delete. Uses same storage upload helper as §2.

## 4. Admin: Meet-the-Cast manager

Two data sources today:
- **Battlefield Atlantis** cast already lives in the `characters` table (`portrait_path`, `sort_order`, `is_published`).
- **Children of Aquarius** cast is hard-coded in `src/routes/children-of-aquarius.tsx`.

Steps:
- Seed the COA characters into the `characters` table (portrait_path pointing at existing `coa-cast/*` files uploaded to the `characters` bucket) and refactor `children-of-aquarius.tsx` to read from `getSeriesBundle` like BA does. Keeps current UI identical.
- Add an admin "Cast" panel: pick a series → list characters → edit name/role/faction/blurb/bio, upload/replace portrait, toggle published, reorder, add/remove. Backed by `upsertCharacter` / `deleteCharacter` / `reorderCharacters` server functions (admin-only).

## 5. Shared plumbing

- New helper `src/lib/admin-media.functions.ts` for admin-gated image uploads to a given bucket + path, returning the stored path.
- New reusable `<AdminImageUploader />` component (drag-drop, preview, replace) used by all three panels.
- Invalidate `["series-bundle", slug]` and `["carousel-slides"]` React Query caches after any mutation.

## Technical notes

- Storage buckets used: `comic-pages` (issue covers, carousel), `characters` (portraits). Both already exist.
- New migration: `carousel_slides` table + RLS + grants; seed rows for the 7 current covers; seed rows for COA characters.
- No breaking changes to public routes — they keep rendering the same content, just sourced from DB.
- Admin gating: every new server fn uses `requireSupabaseAuth` + `has_role(user, 'admin')` check.

