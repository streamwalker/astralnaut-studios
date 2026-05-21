# Batch upload mode for comic pages

Add a second mode to the existing admin upload card so you can upload an entire issue's pages in one go.

## UX

At the top of the upload card, add a tab switcher:
- **Single page** (current form, unchanged)
- **Batch upload** (new)

### Batch upload form
- **Series** dropdown (loaded from `series` table)
- **Issue** dropdown (filtered by series, plus an inline "+ New issue…" option that reveals number/title/slug fields)
- **Starting page #** (default `1`)
- **Free pages** count (default from issue, used to mark first N pages `is_free = true`)
- **Files** — multi-file input + drag-and-drop zone (accepts images)
- **File queue table** — one row per file:
  - thumbnail preview, filename, editable page #, editable title, status badge (queued / uploading / done / error), remove button
  - rows are sortable by drag handle
  - files are natural-sorted on add (`page-1, page-2, …, page-10`) and numbered sequentially from "Starting page #"
- **Upload button** with running progress `X / N` and a per-row status

### Behavior
- Files upload **sequentially** to avoid storage rate limits.
- Storage path: `comic-pages/{series-slug}/issue-{n}/page-{NNN}.{ext}` with `upsert: true`.
- DB insert into `comics`: `issue_id`, `slug = ${issue-slug}-p${NNN}`, `page_number`, `title`, `image_path`, `is_free` (true if page# ≤ free pages), `published_at = now()`.
- Errors on individual files are non-blocking — failed rows stay in the queue marked `error` so you can retry.
- On success the row clears after a moment; toast summarises `X uploaded, Y failed`.

## Technical details

**Files**
- `src/routes/_authenticated/admin.tsx` — extract the current form into `<SinglePageForm />`, add `<BatchUploadForm />`, add a `<Tabs>` switcher at the top of the upload card.
- New helpers (inline in admin.tsx or `src/lib/batch-upload.ts`):
  - `naturalSort(a, b)` — numeric-aware filename comparator
  - `inferPageFromFilename(name)` — extracts trailing digit run, falls back to index
  - reuse existing `slugify`

**Data**
- New issue creation uses existing `issues` insert path (series_id, issue_number, title, slug, free_pages).
- No schema changes. No new storage buckets. No new dependencies (drag-and-drop uses native HTML5 DnD; sortable rows use simple up/down handlers — no `dnd-kit` needed).

## Out of scope
- Zip / folder upload
- Server-side thumbnail generation
- Bulk edit of already-uploaded pages
- Variant cover uploads (kept in single-page form)
