## What the archive contains

- **Logos (new):** `astralnaut-studios-logo.png`, `real-world-comics-logo.png`, `battlefield-atlantis-logo-alt.png` (red variant), and two faction emblems (`nerrian-defense-force-logo.png`, `tri-planetary-coalition-logo.png`).
- **`i18n.js` (123KB):** A 12-language translation module (en, es, fr, de, vi, yue, zh, ja, ar, hi, ko, tl) keyed off `data-i18n` / `data-i18n-html` attributes. Persists to localStorage. Arabic flips to RTL.
- **`account.html` + `README.md`:** The latest version of the mockup, now including a **Factions in motion** section and i18n attributes on every string.

The `/account` redesign from the previous turn already covers hero, status card, drops strip, slate, perks, raffle CTA, and subscription management. This archive adds what's still missing.

## Plan

### 1. Add new logo assets via Lovable Assets
Register 5 new files as CDN-backed pointers (so they don't bloat the repo):
- `src/assets/astralnaut-studios-logo.png.asset.json`
- `src/assets/real-world-comics-logo-v2.png.asset.json` (replaces the existing one if you prefer the archive version — confirm in Q1 below)
- `src/assets/battlefield-atlantis-logo-alt.png.asset.json`
- `src/assets/nerrian-defense-force-logo.png.asset.json`
- `src/assets/tri-planetary-coalition-logo.png.asset.json`

### 2. Add a "Factions in motion" section to `/account`
Between the slate and the platform perks, add a two-card section showing the NDF and TPC emblems with their taglines pulled from the README ("Vigilant · Protect · Prevail" and "Unity · Diplomacy · Commerce"). Cards use existing `card-rwc` styling.

### 3. Wire up the 12-language switcher
- Convert `i18n.js` (currently a `<script>`-tag module that mutates `window`) into a TypeScript module at `src/lib/i18n.ts` exporting `setLang(code)`, `getLang()`, `applyI18n(root)`, and the `LANGS`/`I18N` maps.
- Build a small `<LanguageSwitcher />` dropdown component (uses existing shadcn `DropdownMenu`) placed in the site header next to the existing nav.
- Add `data-i18n` attributes to the strings in `src/routes/account.tsx` that match the keys in the dictionary. A `useI18n()` hook applies translations on mount and on language change, and toggles `<html dir="rtl">` for Arabic.
- Persist choice to `localStorage` (key `rwc.lang`), default to browser language with English fallback.

### What I'm skipping (and why)

- **Cast grid (12 character portraits):** README points these at the live `astralnautstudios.com/assets/` CDN, but those URLs aren't guaranteed to resolve from this app and would create cross-origin image dependencies. I can add this in a follow-up if you upload the portraits or confirm the CDN is public.
- **Studio dispatches:** README explicitly calls these placeholder copy. Needs a content source (CMS table or hardcoded list) — happy to add a `dispatches` table + simple admin if you want it.
- **Alt BA logo:** Registered as an asset but not used anywhere yet (README calls it an optional "darker arc" cover treatment).

## Two quick decisions

**Q1 — Real World Comics logo:** The archive includes a new `real-world-comics-logo.png`. The app already has one at `src/assets/real-world-comics-logo.png`. Replace the existing one, or register the new one alongside as v2?

**Q2 — Scope of i18n:** Just translate `/account`, or also the homepage, pricing, perks, and series pages? Doing all of them is mostly a mechanical pass adding `data-i18n` attributes to existing strings — say the word and I'll expand the scope.

## Files touched

- New: 5 `*.asset.json` pointers, `src/lib/i18n.ts`, `src/lib/i18n-dictionary.ts` (split out the 100KB dictionary), `src/components/language-switcher.tsx`, `src/hooks/useI18n.tsx`
- Edited: `src/routes/account.tsx` (Factions section + `data-i18n` attributes), `src/components/site-header.tsx` (add switcher)
- No backend, schema, or auth changes.
