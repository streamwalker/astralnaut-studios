## Goal
Wire the uploaded NDF and TPC brand sheets onto the two faction cards on the Battlefield Atlantis page and make each card open an expandable modal with the full emblem, motto values, and lore.

## What ships

### 1. Logo uploads (Storage)
Upload both brand sheets to the existing public `characters` bucket under a `battlefield-atlantis/factions/` prefix:
- `ndf.png` ← `user-uploads://NDF_Logo_Option_1.png`
- `tpc.png` ← `user-uploads://TPC_Logo.png`

(`pageUrl()` already routes the `characters` bucket; the same helper used for portraits handles these.)

### 2. Schema — add `bio` column to `factions`
`factions` currently only has `name / slug / acro / summary / emblem_path`. Add a nullable `text` column `bio` (migration) so the modal can show long-form lore without overloading `summary`. Admin already manages factions — no admin UI change needed beyond the new field appearing.

### 3. Seed data (insert/update)
- `factions.emblem_path` = `characters/battlefield-atlantis/factions/{slug}.png` for both rows
- `factions.bio` populated for both with 2–3 short paragraphs derived from the uploaded brand sheets and existing site lore:
  - **NDF (Nerrian Defense Force)** — Earth's first transmedium service, founded in the wake of the Atlantis incident. Values from the brand sheet: Protection, Vigilance, Courage, Discipline, Guardianship.
  - **TPC (Tri-Planetary Coalition)** — Governing accord between Earth, Mars, and a third world. Values: Unity, Diplomacy, Commerce. Three worlds, one coalition.

### 4. UI — expandable faction cards
In `src/routes/battlefield-atlantis.tsx`, the existing Factions section renders static `<div>` cards. Change to mirror the new character-modal pattern:

- Each faction card becomes a `<Dialog>` trigger `<button>` with `aria-label="View {name} details"`.
- Card preview: small square emblem thumbnail (object-contain on `var(--bg2)`) + acro eyebrow + name + short `summary` + subtle "Click to expand" affordance on hover.
- Dialog content (`max-w-3xl`, 2-column on md): large emblem on the left, right side shows acro tagline → name (h3) → summary → motto chips (split `acro` on `·` → small uppercase pills) → full `bio` paragraphs.

No changes to `series-card.tsx`, no new route. `getSeriesBundle` already returns `factions` with all columns.

## Out of scope
- No changes to Children of Aquarius / Darker Ages factions.
- No new admin form fields beyond the auto-added `bio`.
- Logo cropping — the uploaded brand sheets are used as-is; modal shows them full-bleed, card shows a contained thumbnail.
