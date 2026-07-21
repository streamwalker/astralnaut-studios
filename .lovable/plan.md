## Lean & Mean Audit — Findings

A full read-only audit ran across `src/`, `package.json`, and `src/styles.css`. Headline: this codebase is already unusually clean. No commented-out legacy blocks, no unused imports, no dead branches, no duplicated wrappers in hot files (`routes/index.tsx`, `__root.tsx`, `HeroRotator`, `site-header`, `reader.$series.$issue`, `admin.media`). Removals below are all high-confidence and evidence-backed (0 importers / 0 usages).

## What I'll remove

### Dependencies (2)
- `react-hook-form` — 0 hits in `src/` (the one form, `dmca-form.tsx`, uses `useState`)
- `@hookform/resolvers` — 0 hits, only exists to pair with the above

### Orphaned files (6)
- `src/lib/canon.functions.ts` — no callers
- `src/lib/community-ack.ts` — no callers
- `src/lib/legal-meta.ts` — stale duplicate of `src/config/legal.ts` (which is the one actually used)
- `src/hooks/use-mobile.tsx` — shadcn boilerplate, never wired
- `src/components/report-button.tsx` — no importers
- `src/components/home/HeroVideoBackground.tsx` — `HeroRotator` inlines its own video

### Style bloat in `src/styles.css` (3 utilities)
- `@utility container-page` — 0 hits (only `container-wide` is used)
- `@utility measure-wide` — 0 hits
- `@utility table-scroll-inner` — 0 hits

Estimated removal: ~350–450 LOC + 2 deps + ~20 CSS lines.

## What I'm NOT touching (flagged, needs your call)

1. **`src/components/reader/PhotosensitivityWarning.tsx`** — 0 imports, so technically dead. BUT `admin.compliance-changelog.tsx` claims this interstitial is active as a compliance feature. Deleting it silently would make that legal claim false. Options: (a) wire it into the reader for flagged issues, (b) delete it AND update the compliance changelog. Tell me which.
2. **`.page-flash--*` CSS classes** — look unused via static grep, but `reader.$series.$issue.tsx:564` builds them dynamically (`` `page-flash--${flashVariant}` ``). Keeping.
3. Build-infra deps (`@cloudflare/vite-plugin`, `@tailwindcss/vite`, `@tanstack/router-plugin`, `vite-tsconfig-paths`, `nitro`) — 0 hits in `src/` but consumed transitively by `@lovable.dev/vite-tanstack-config`. Keeping.

## Execution plan

1. `bun remove react-hook-form @hookform/resolvers`
2. `rm` the 6 orphaned files listed above
3. Delete the 3 unused `@utility` blocks in `src/styles.css`
4. Verify:
   - Build + typecheck (harness runs automatically)
   - Playwright smoke: `/`, `/archive`, `/battlefield-atlantis`, `/reader/battlefield-atlantis/1`, `/admin/media` (as authenticated admin). Screenshot each; confirm no visual/console regression.

## Technical notes

- All 6 files are ES module leafs — no re-exports, no dynamic import strings referencing them (grepped).
- `legal-meta.ts` vs `config/legal.ts`: confirmed distinct constants; only `config/legal.ts` has importers.
- No route files touched (every `src/routes/*` file is a live route via file-based routing).
- No server functions or migrations touched.

## Answer needed before I proceed

**PhotosensitivityWarning**: wire it in, or delete + update compliance doc?