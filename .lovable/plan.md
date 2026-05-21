## Goal
Populate the Battlefield Atlantis "Characters" section with the 7 uploaded portraits and make each card open a modal with a larger portrait, role, faction, and bio.

## What ships

### 1. Portrait uploads (Storage)
Copy each `user-uploads://*.png` into the existing public `characters` bucket under `battlefield-atlantis/`:

- `orion-the-hunter.png`
- `zeus.png`
- `astra.png`
- `prometheus.png`
- `captain-rhea.png`
- `commander-carlo.png`
- `ensign-benes.png`

`portrait_path` stored as `characters/battlefield-atlantis/{slug}.png` (the existing `pageUrl()` helper already routes the `characters` bucket correctly).

### 2. Character rows (DB seed via insert)
Insert 7 rows into `public.characters` with `series_id = (battlefield-atlantis).id`, `is_published = true`, role/faction inferred from the labels on the portraits and the existing site lore (Tri-Planetary Coalition, Saantris Station, NDF/Ryuken). Short stub bios — you can refine each through the existing admin page.

| # | name | role | faction | transmedium |
|---|---|---|---|---|
| 1 | Captain Rhea | Commanding Officer, NDF Ryuken | Naval Defense Force | false |
| 2 | Commander Carlo | First Officer, NDF Ryuken | Naval Defense Force | false |
| 3 | Ensign Benes | Operations Officer, NDF Ryuken | Naval Defense Force | false |
| 4 | Orion the Hunter | Hunter Pact Operative | Meridian Hunter Pact | true |
| 5 | Zeus | Transmedium Combat Specialist | Tri-Planetary Coalition | true |
| 6 | Astra | Transmedium Field Operator | Tri-Planetary Coalition | true |
| 7 | Prometheus | Heavy Armor Vanguard | Tri-Planetary Coalition | false |

`short_description` (1 line) + `bio` (2–3 sentences) seeded from the existing series logline so the modal isn't empty. All editable via `/admin`.

### 3. UI — click-to-expand modal
In `src/routes/battlefield-atlantis.tsx`, the existing Characters grid renders static `<div>` cards. Change to:

- Wrap each card in a shadcn `<Dialog>` trigger (button for a11y).
- Dialog content (`max-w-3xl`): large portrait left, details right — name (h3), eyebrow with role, faction badge, transmedium tag if true, `short_description`, then full `bio` paragraph.
- Grid card itself keeps its current portrait + name + role; add a subtle "Click to expand" affordance + `aria-label="View {name} details"`.

No changes to `series-card.tsx`, no new route, no schema changes (`characters` table already has every field needed: `bio`, `short_description`, `faction`, `role`, `transmedium`, `portrait_path`).

### 4. Data wiring
`getSeriesBundle` already returns `characters` with all columns (`select("*")`), so no server-function change needed.

## Out of scope
- Children of Aquarius / Darker Ages cast (no portraits uploaded).
- Faction emblem changes.
- New admin UI — existing admin already edits characters.
