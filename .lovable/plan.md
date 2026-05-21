## Manage uploaded comic pages in admin

Today the admin "Recent uploads" panel is read-only — it shows the 30 newest pages with thumbnail, title, slug, page number, and publish state. There is no way to fix a wrong file, rename a page, change its order, or remove it. This plan adds full CRUD on uploaded pages.

### What changes

**1. Filter + group by issue**
Replace the flat "Recent uploads (last 30)" list with an issue picker at the top of the right-hand panel:
- Series → Issue dropdowns (reusing the same query the batch uploader already runs).
- Once an issue is selected, load **all** its pages (`comics` where `issue_id = …`, ordered by `page_number`) — not capped at 30.
- A "Recent uploads (all issues)" fallback view shows the 30 newest when no issue is selected, for quick access right after an upload.

**2. Per-page row actions**
Each page row gets a kebab menu (`DropdownMenu`) with:
- **Replace image** — opens a file picker; uploads the new file to `comic-pages` at a new path, updates `comics.image_path`, then deletes the old object from storage. Keeps page_number, title, publish state intact.
- **Edit details** — opens a dialog with: `title`, `page_number`, `alt_text`, `is_free` (switch), `published_at` (published / draft toggle that sets `now()` or `null`). Saves via `supabase.from("comics").update(...)`.
- **Delete** — `AlertDialog` confirm, then delete the storage object and the `comics` row.

**3. Reposition (reorder page numbers)**
Inside the issue view, add ↑ / ↓ buttons on each row that swap `page_number` with the neighbor (two updates in a small transaction-style sequence — update current to a temp negative value, neighbor to current, current to neighbor — to satisfy any future unique constraint on (issue_id, page_number)). For now, since there is no such constraint, a straightforward two-row update is enough.

Out of scope: drag-and-drop reordering (buttons are simpler and reliable). We can add dnd later if needed.

**4. Cache + UX**
- All mutations call `qc.invalidateQueries({ queryKey: ["admin-comics"] })` and a new `["admin-issue-pages", issueId]` key.
- Toasts via `sonner` for success/failure.
- Optimistic UI is not needed — these are admin-only, low-volume actions.

### Technical notes

- All writes go through the browser `supabase` client; existing RLS already restricts `comics` ALL to `has_role(auth.uid(), 'admin')`, and storage policies on `comic-pages` already allow admin writes (the batch uploader works).
- No DB migration required.
- Storage delete: `supabase.storage.from("comic-pages").remove([oldPath])`.
- Replace flow uses the same path convention as the existing batch upload (timestamp + filename) so we never overwrite by accident, then removes the old file after the DB row is updated.
- New file: `src/components/admin/page-row.tsx` to keep `admin.tsx` from ballooning. Edit dialog + replace + delete + reorder live there.

### Files touched

- `src/routes/_authenticated/admin.tsx` — add issue filter, swap the list for the new `PageRow`, add `admin-issue-pages` query.
- `src/components/admin/page-row.tsx` — new component with the kebab menu, edit dialog, replace input, delete confirm, reorder buttons.
