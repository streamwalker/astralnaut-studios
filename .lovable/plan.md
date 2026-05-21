## Problem

Astra and Poseidon were added using their full landscape "character profile" brand sheets as `portrait_path`. The expanded modal in `src/routes/battlefield-atlantis.tsx` renders that image inside a portrait-shaped (`aspect-[3/4]`) panel with `object-cover`, which crops the sheet to a vertical slice — the user only sees a sliver of the figure and none of the profile/powers/poses panels.

## Fix

Update only the character `DialogContent` in `src/routes/battlefield-atlantis.tsx` to display the brand sheet in full, mirroring the pattern already used by the faction modals:

1. Replace the fixed `aspect-[3/4]` image column with a flexible panel that lets landscape sheets breathe:
   - Container: `flex items-center justify-center bg-[var(--bg2)] p-4` with `max-h-[80vh]` on the image.
   - Image: `object-contain` (not `object-cover`) so nothing is cropped.
2. Widen the dialog so the sheet is legible:
   - `DialogContent` → `max-w-5xl overflow-hidden p-0`.
   - Grid columns → `md:grid-cols-[1.4fr_1fr]` (image gets more room).
3. Make the right-side text column scrollable on shorter viewports: `max-h-[80vh] overflow-y-auto`.
4. Leave the small card thumbnails in the cast grid unchanged (they stay as compact tiles); the "click to expand" affordance already invites users to open the full sheet.

No database, storage, or other route changes are needed — the uploaded images are already the full brand sheets.

## Files touched

- `src/routes/battlefield-atlantis.tsx` — character `Dialog` markup only.
