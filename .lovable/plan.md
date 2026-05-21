
## Goal
Install every piece of `astralnaut-growth-package.lovable.json` into the site under the admin area, mirroring the spec's `/admin/growth-package` mount with all four deliverables wired up. No piece left as a placeholder.

## Deliverables (all four shipped)

### 1. Docs as real downloadable artifacts
Extract the embedded base64 `.docx` payloads from the JSON and write them to `public/growth-package/`:
- `1M-Subscriber-Strategy.docx`
- `1M-Subscriber-Tactical-Playbook.docx`

(Done at build/install time via a one-shot Node script run from `code--exec` that reads `user-uploads://astralnaut-growth-package.lovable.json`, decodes `deliverables[*].delivery.base64`, and writes the two files. Served directly by the static `public/` folder — no auth gate on the file itself, but the only link to it lives behind the admin section.)

### 2. Hub page — `/admin/growth-package` (auth-gated)
New route `src/routes/_authenticated/growth-package.tsx`. Page header + KPI strip (`Target: 1M subs · Horizon: 24 months · Channels: 7 · Tactics: 40`) and a 2-column card grid with the four cards from the spec:

| Card | Subtitle | Primary | Secondary |
|---|---|---|---|
| Master Strategy | 24-month roadmap · 21 tables · 4 phases | Download .docx | View summary inline (expands inline accordion of the 15 section titles) |
| Tactical Playbook | 40 tactics · phase-sequenced · executable | Download .docx | View phase breakdown (Ignition / Validation / Velocity / Inflection ranges) |
| Studio Brand Landing Page | Public · `/astralnaut-studios` | Preview (opens route) | Open in new tab |
| Growth Dashboard | Internal · `/admin/growth` · auth required | Open dashboard | Export KPI history (CSV) |

Footer strip with companion-site + contact links from the spec.

### 3. Public landing page — `/astralnaut-studios`
New route `src/routes/astralnaut-studios.tsx` (public, no auth). Rebuild the studio landing in React from the spec's `page_structure` (not a static HTML drop-in — keeps the site's styling system and SSR/SEO consistent). Sections, in order:
1. **Sticky nav** — links: Properties / How It Works / For Industry · CTA "Start Reading Free"
2. **Centered hero** — pill "Independent Comics · Built for the Disclosure Era", headline "Prestige comics, delivered like prestige TV.", lead, two CTAs (Start Reading Free → `/pricing`, For Industry → `/industry`)
3. **Studio thesis** — kicker "The Studio", 3 numbered pillars (Cadence discipline / Cultural alignment / Adaptation-ready IP) with exact copy from spec
4. **Properties** — pulls the three series from the existing `series` table via the existing `getHomeBundle` style server fn; reuses `series-card` so it stays in sync with the rest of the site
5. **Cadence** — 3-tier pricing grid (Patron $24.99 Tue / Initiate $9.99 Wed / Reader $4.99 Thu) with the full perks lists from the spec
6. **Industry CTA strip** — "Adaptation rights, options, and acquisitions." → `/industry`
7. **Footer** — reuses existing site footer

SEO: `head()` with exact title / description / canonical from spec + `Organization` JSON-LD (`Astralnaut Studios LLC`, `sameAs: [astralnautstudios.com]`).

### 4. Growth Dashboard — `/admin/_authenticated/growth`
New route `src/routes/_authenticated/growth.tsx` rendering all 6 panels from the spec, in order. Backed by Supabase instead of localStorage (the spec explicitly recommends this).

**Schema (migration):**

```
growth_kpis
  id uuid pk
  recorded_at timestamptz default now()  -- one row per snapshot
  subs int, emails int, ewr int, discord int, nps int
  cac numeric, churn numeric, mrr numeric
  notes text

growth_sprint_weeks
  id uuid pk
  week int unique
  dates text          -- "May 21–27"
  outcome text
  done boolean default false
  done_at timestamptz
```

RLS: `growth_kpis` and `growth_sprint_weeks` → public read **denied**; only admins (`has_role(auth.uid(),'admin')`) can `SELECT/INSERT/UPDATE/DELETE`. Seed `growth_sprint_weeks` with all 13 weeks from the spec.

**Panels:**

1. **Phased Roadmap rail** — 4 cells (Ignition 0→1K · Validation 1K→10K · Velocity 10K→100K · Inflection 100K→1M). Auto-highlights the active phase based on the latest `subs` value; per-cell progress bar.
2. **Live KPIs** — 8 editable tiles (subs, emails, ewr, cac, churn, discord, mrr, nps) with their formats from the spec (integer / usd / percent). "Save snapshot" button inserts a new `growth_kpis` row; tiles always show the latest row's values; delta vs. prior snapshot shown under each tile.
3. **Channel Allocation** — horizontal bar list, 7 channels with the spec's `share_pct` values (static reference data — TikTok 30%, YouTube 20%, Reddit 15%, Search 12%, Influencer 10%, Email+referral 8%, Press 5%).
4. **Subscriber Milestones** — 8-row table (100 → 1M) with status pills (Hit / Next / Upcoming) computed from current `subs`.
5. **Phase Targets vs Current** — comparison table, 7 metrics × 4 phases, status pill per cell using the spec's legend (green on/ahead, amber within 25%, red >25% behind). Honors `inverted: true` for CAC and churn (lower is better).
6. **90-Day Sprint Calendar** — 13-week checkable table (week / dates / outcome / done checkbox). Toggling a checkbox updates `growth_sprint_weeks.done` + `done_at`.

Header buttons: **Save Snapshot**, **Export KPI history (CSV)** (downloads all `growth_kpis` rows), **Open Hub** (back to `/admin/growth-package`).

All writes go through `createServerFn` handlers protected by `requireSupabaseAuth` (admin role check inside the handler). Reads use the same pattern so RLS applies.

## File map

```
public/growth-package/
  1M-Subscriber-Strategy.docx           ← decoded from JSON
  1M-Subscriber-Tactical-Playbook.docx  ← decoded from JSON

src/routes/
  astralnaut-studios.tsx                ← public studio landing
  _authenticated/
    growth-package.tsx                  ← hub (4 cards)
    growth.tsx                          ← dashboard (6 panels)

src/lib/
  growth.functions.ts                   ← server fns: list/save KPI snapshots, toggle sprint week, export CSV

supabase/migrations/
  <ts>_growth_dashboard.sql             ← growth_kpis + growth_sprint_weeks + RLS + seed 13 weeks
```

Also add a sidebar entry in the existing admin shell (`src/routes/_authenticated/admin.tsx`) linking to **Growth Package** so it's discoverable from the main admin page.

## Out of scope
- Cloudflare Access / basic-auth recommendation from the spec (project already uses Supabase admin role gating — that's the auth model).
- The spec's `lovable_dev_rebuild_instructions.do_not` list is honored (no inline static HTML drops; everything is real React + DB).
- Tactical playbook tactic list as structured data — the spec doesn't include the 40 tactics themselves, only the field schema and phase ranges, so the doc download is the source of truth (we surface the phase ranges and field list in the inline summary).
