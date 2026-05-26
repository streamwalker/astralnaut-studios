## Goal

Redesign `/battlefield-atlantis` to match the screenshots — a comic-book-styled hero, a richer "Issue #1" details section, an "All 20 pages" grid with FREE/LOCKED states + drop dates, and a polished cast strip.

## Sections to build (top → bottom)

### 1. Hero (comic-book cover treatment)
Two-column layout (cover left, copy right).

**Left — cover plate:**
- Cover image inside a thin glowing border.
- Top-left **"$1.00 / ISSUE #1"** comic price-box badge.
- Top-right **"9.5 PAGES · FREE"** neon-mint pill.
- Left edge **"1ST EXPLOSIVE ISSUE"** yellow burst sticker stacked with 3 character mini-portraits.
- Bottom-left **"WAR OF THE WORLDS BEGINS!"** red starburst.
- Bottom overlay gradient + centered **"▶ READ 9.5 PAGES FREE"** gradient button.
- Caption strip under cover: `FULL FIRST ACT + TITLE PAGE · FREE · PAGES 10–20 SUBSCRIBE`.

**Right — copy:**
- Eyebrow: `⚡ ASTRALNAUT STUDIOS PRESENTS` (gold).
- BA logo inside dark framed plate with subtle glow.
- Italic gold tagline: *"Only one will rule."*
- Logline paragraph with bolded terms (Tri-Planetary Coalition, Poseidon King of Alympia, Zeus).
- 4-column KPI row: **9.5** pages free, **11** subscriber pages, **3 wks** to complete, **20** total pages.
- Two CTAs: gradient `▶ Read 9.5 pages free` + gold `Subscribe from $4.99`.
- Two info lines below: `📺 TV-STYLE STRUCTURE: …` and `⚡ EARLY ACCESS: …`.

### 2. Issue #1 — "Only One Will Rule"
Two-column layout.

**Left:**
- Large heading `Issue #1 — "Only One Will Rule"` + subtitle `The cold open. The council. The ultimatum. The team that should not exist.`
- Green-bordered callout box: `📺 STRUCTURED LIKE TV · 9.5 FREE PAGES` + paragraph.
- Three story-beat paragraphs with colored inline labels:
  - `FIRST ACT · PAGES 1–9.` (green)
  - `TITLE PAGE · PAGE 9.5.` (gold)
  - `EPISODE BODY · PAGES 10–20.` (blue)

**Right — ISSUE DETAILS card:**
- Rows: Series, Issue, Title, Writer, Studio, Total pages, Pages 1-9 (green "FREE · the full first act"), Page 9.5 (gold "FREE · title page"), Pages 10-20 (blue "Subscribers").
- Embedded **NEXT DROP · PAGES 10–13** sub-card with Patron / Initiate / Reader date rows.
- Footer rows: Issue completes, Variant covers.

### 3. All 20 pages grid
- Heading `All 20 pages` + subtitle `Click any unlocked page to jump straight to it. Locked pages drop weekly on Thursdays.`
- 5-column responsive grid (2 on mobile, 3 on sm, 5 on lg).
- Free pages (1–9): real page thumbnail, green `FREE · PAGE N` badge top-left.
- Page 9.5: title-page thumbnail, gold `TITLE · 9.5` badge.
- Locked pages (10–20): dark card with 🔒 emoji centered + gold `PATRON TUE · {date}` footer strip.
- Free pages link to the reader; locked are non-interactive.

### 4. Meet the cast
Keep the existing characters loader data; restyle to match screenshot:
- Heading `Meet the cast` + subtitle.
- Horizontal scroll/grid of cards with light-grey gradient background, name plate at top of card (uppercase), full-body portrait, footer with cyan eyebrow `FACTION · ROLE`, bold name, one-line role descriptor.
- Keep click-to-expand dialog behavior already implemented.

## Technical notes

- All work confined to `src/routes/battlefield-atlantis.tsx`. No backend / loader changes — data already available from `getSeriesBundle` + `getIssueBundle`.
- Drop dates for locked pages: hard-code the schedule shown in screenshots (May 12 / May 19 / May 26 Patron Tue), since this is presentation-only. (If you'd rather drive these from the DB, say so and I'll wire a `release_at` column instead.)
- Mini-portrait thumbs on the cover sticker and the price-box `$1.00` badge are pure decorative chrome — rendered with characters[0..2] portrait_path when available.
- Use existing design tokens (`--neon`, `--gold`, `--ink`, `--bg2`, `--mute`) plus a few inline gradient styles for the comic stickers (red starburst, yellow burst). No new global CSS files.
- No changes to header/footer, routing, or other pages.

## Out of scope

- Editing the reader, /children-of-aquarius, or homepage.
- Real "release_at" scheduling in the DB.
- Variant cover gallery (just shows the "3 available" count for now).