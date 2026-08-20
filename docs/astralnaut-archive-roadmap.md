# Astralnaut Archive — Companion Platform Roadmap

A parallel immersive experience at `/archive`, living alongside the existing marketing site. The current astralnautstudios.com landing stays intact; the Archive is opt-in.

**Clearance model:** XP + achievements (gamified). Subscription/Kickstarter status feed XP but do not directly grant ranks.

---

## Phase I — The Archive (current sprint)

Cinematic shell, renamed sections, clearance scaffold, comic reader re-skin.

**Routes (all under `/archive`):**
- `/archive` — boot sequence + terminal landing
- `/archive/briefings` — Intelligence Briefings (blog re-skin)
- `/archive/personnel` — Personnel Files (characters)
- `/archive/evidence` — Recovered Evidence (concept art / media)
- `/archive/documents` — Recovered Documents (comics index)
- `/archive/documents/$series/$issue` — classified-reader wrapper around existing reader
- `/archive/database` — Intelligence Database (FAQ + lore search)
- `/archive/timeline` — Chronological Records
- `/archive/quartermaster` — Quartermaster (store re-skin)
- `/archive/clearance` — user's current rank, XP, badges (authenticated)

**Components:**
- `BootSequence` — typed-text auth animation, plays once per session
- `ArchiveShell` — HUD chrome (scanlines, corner brackets, status bar, clearance pill)
- `ClassifiedCard`, `RedactedText`, `StampOverlay` — primitive lore atoms
- `ClearancePill` — shows current rank everywhere in the HUD

**Data (Phase I migrations):**
- `archive_profiles` (user_id, codename, current_rank, xp, joined_at)
- `archive_xp_events` (user_id, source, amount, metadata, created_at)
- `archive_ranks` enum: observer, researcher, field_agent, operative, director, founders_circle
- Public read-only views for leaderboards

---

## Phase II — Community

- Achievements + badges tables, mission completion ledger
- Founder Wall (public roster of top ranks / backers)
- Referral codes → XP
- Quartermaster integration with existing Shopify storefront (lore-wrapped product cards)
- Digital ID card generator (download as PNG)

---

## Phase III — The Living Universe

- ARG layer: hidden routes, QR/Morse/binary puzzles, redacted PDFs, countdown timers
- ARCHIVE AI terminal — LLM via Lovable AI Gateway, clearance-gated context retrieval over lore corpus
- Interactive globe (react-globe.gl) with artifact pins, clickable timeline events
- Recurring events / seasonal puzzles

---

## Phase IV — Astralnaut Nexus

- Mobile companion PWA with push notifications
- Kickstarter backer import → Founder's Circle clearance
- NFC unlocks (Web NFC where supported)
- Streaming media tie-ins, AR/VR placeholder routes

---

## Build order this turn (Phase I slice 1)

1. Roadmap doc (this file).
2. `/archive` boot-sequence landing + `ArchiveShell` chrome.
3. Renamed nav stubs for the 9 sub-routes (placeholder content, real wiring in subsequent turns).
4. `archive_profiles` + `archive_xp_events` migration deferred to the turn we wire authenticated XP earning — do not create tables that nothing writes to yet.
