-- Repoint the Darker Ages carousel slide off the Lovable CDN.
--
-- One row in `carousel_slides` still stores a `/__l5e/assets-v1/...` path left
-- over from Lovable's asset pipeline. `pageUrl()` (src/lib/storage.ts) passes
-- any leading-slash value straight through, so that path is emitted verbatim
-- into the cover fan. Once the site is served from its own origin the Lovable
-- CDN no longer answers, and the slide 404s.
--
-- The image itself was never in Supabase Storage — it existed only on Lovable's
-- CDN. It has now been recovered and committed to `public/`, which keeps the URL
-- stable across builds (a Vite `src/assets/` import would be content-hashed, and
-- the hash would drift away from whatever this row stores).
--
-- Matched on the old path rather than the row id so the statement is idempotent
-- and safe to re-run: after the first apply it simply affects zero rows.

update public.carousel_slides
set image_path = '/darker-ages-issue-1-cover.png'
where image_path like '/__l5e/%darker-ages-issue-1-cover.png';
