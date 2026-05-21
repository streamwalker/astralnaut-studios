## Problem
On the published site, the **Download .docx** buttons send the user to `/growth-package/1M-Subscriber-Strategy.docx` (and the playbook). The published `_authenticated` gate intercepts those URLs and bounces the visitor into a "log into Lovable" redirect loop instead of serving the static file. The Studio Brand Landing Page and Growth Dashboard links also break the in-page flow (open separate routes / require auth again).

## Fix
Replace the four "download / open elsewhere" cards on `/growth-package` with a single embedded reader experience. Everything lives inside the already-authenticated `_authenticated/growth-package` route — no static files, no extra navigation.

## Changes

### 1. Extract the two `.docx` files into typed in-app content (one-time)
- Run a small Node/Python script (not committed) to unzip the two existing `public/growth-package/*.docx`, walk the WordprocessingML, and emit structured JSON: `{ sections: [{ heading, level, paragraphs[], tables[] }] }`.
- Save as `src/content/growth-strategy.ts` and `src/content/growth-playbook.ts` (plain TS modules exporting typed arrays — no runtime fetch, no auth surface).
- Delete `public/growth-package/*.docx` once content is migrated.

### 2. Rebuild `/growth-package` as a 4-tab reader
File: `src/routes/_authenticated/growth-package.tsx`

Replace the current 4-card grid with a sticky tab bar + content panel:

```text
┌──────────────────────────────────────────────────┐
│  Astralnaut Studios — Growth Package             │
├──────────────────────────────────────────────────┤
│ [Strategy] [Playbook] [Studio Page] [Dashboard]  │
├──────────────────────────────────────────────────┤
│                                                  │
│   ← active panel renders here                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

- **Strategy tab** — renders `growth-strategy.ts` as a long-form document: section headings, body paragraphs, and tables styled with the existing `card-rwc` / `var(--gold)` / `var(--ink)` tokens. Sticky in-page TOC on the left at `md+`.
- **Playbook tab** — renders all 40 tactics as expandable cards grouped by the 4 phases. Each tactic shows the 8 fields (Phase, Channel, Cost, Cadence, Owner, Why, How, KPI).
- **Studio Page tab** — embeds the existing `/astralnaut-studios` route inside an `<iframe>` sized to viewport, with an "Open full page ↗" link in the corner. (Iframe avoids duplicating ~600 lines of marketing markup and stays in sync with the live page.)
- **Dashboard tab** — embeds `/growth` the same way. Because the parent page is already inside `_authenticated`, the iframe inherits the Supabase session via cookies/localStorage and renders the live dashboard.

Tab state is held in URL search (`?tab=strategy|playbook|studio|dashboard`) so deep links and refreshes work.

### 3. Optional fallback download
Keep a small "Print this view" button at the top-right of the Strategy and Playbook tabs that calls `window.print()` with a print stylesheet — gives the user a PDF-able artifact without any static-file hosting. **No `.docx` files referenced anywhere in the app.**

## Files touched
- **new** `src/content/growth-strategy.ts`
- **new** `src/content/growth-playbook.ts`
- **rewrite** `src/routes/_authenticated/growth-package.tsx`
- **delete** `public/growth-package/1M-Subscriber-Strategy.docx`
- **delete** `public/growth-package/1M-Subscriber-Tactical-Playbook.docx`

## Out of scope
- No changes to `/astralnaut-studios` or `/growth` themselves — they keep working standalone and are embedded read-only here.
- No auth/route changes.
