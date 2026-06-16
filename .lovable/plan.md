## Copyright Rewrite — Real World Comics, LLC

Implements Phil's approved sheet. Branding label "Astralnaut Studios" stays visible; legal ownership shifts to Real World Comics, LLC. No publish — staged for Phil to review.

### Step 1 — Global string replacements

- `src/components/site-header.tsx`
  - Line 144: footer brand heading `Astralnaut Studios LLC` → `Astralnaut Studios`.
  - Line 167: replace inline © with translated `t("footer.copyright")` already used elsewhere (keeps i18n consistent), and update the dictionary string (next bullet).
- `src/lib/i18n-dictionary.ts` (12 locales) — replace each `footer.copyright` value with the localized form of:
  `© 2026 Real World Comics, LLC. All rights reserved. Astralnaut Studios and Real World Comics are imprints of Real World Comics, LLC.`
  Non-English locales: keep current localized "all rights reserved" phrasing and append the imprint sentence in English (safer than machine-translating legal text). Flagged so Phil can have translations reviewed.
- `src/routes/industry.tsx`
  - L8 meta description: `Sole rights holder: Astralnaut Studios LLC` → `Sole rights holder: Real World Comics, LLC`.
  - L32: `Astralnaut Studios LLC holds 100% of the rights` → `Real World Comics, LLC holds 100% of the rights`.
  - L58: `100% owned by Astralnaut Studios LLC` → `100% owned by Real World Comics, LLC`. Leave the "Trademarks pending" sentence untouched (Step 7 hold).
- `public/llms.txt` L3, L24: same entity swap.
- `src/routes/raffle.rules.tsx` L36: `Astralnaut Studios LLC ("Sponsor")` → `Real World Comics, LLC ("Sponsor")`. (Sponsor identity is a legal field; correcting now.)
- `src/routes/astralnaut-studios.tsx` L23 (JSON-LD `Organization.name`): keep `"Astralnaut Studios"` as the imprint brand; add `parentOrganization: { "@type": "Organization", "name": "Real World Comics, LLC" }`. Visible page copy untouched.
- `src/content/growth-playbook.ts` and `src/content/growth-strategy.ts`: internal strategy docs — leave the historical "Astralnaut Studios LLC" references as-is (these are dated documents, not legal notices). Flag for Phil only.

### Step 2 — Site-wide head meta

In `src/routes/__root.tsx` `head().meta`, add:
- `{ name: "copyright", content: "© 2026 Real World Comics, LLC. All rights reserved." }`
- `{ name: "rights", content: "© 2026 Real World Comics, LLC. Unauthorized reproduction or AI-training use prohibited." }`
- Replace existing `author` meta with: `Phil Russell — Real World Comics, LLC (Astralnaut Studios)`.

### Step 3 — Per-work Open Graph

Add to each of `children-of-aquarius.tsx`, `battlefield-atlantis.tsx`, `darker-ages.tsx` `head().meta`:
- `og:site_name` → `Real World Comics — Astralnaut Studios`
- `article:author` → `Phil Russell`
- `article:publisher` → `Real World Comics, LLC`
- `og:image:alt` → page-specific cover description (per sheet examples).

Same `og:image:alt` pattern on `reader.$series.$issue.tsx` using loader data.

### Step 4 — JSON-LD

Add `scripts: [{ type: "application/ld+json", children: JSON.stringify(...) }]` to:
- `children-of-aquarius.tsx` — `ComicIssue` block from sheet.
- `battlefield-atlantis.tsx` — `ComicIssue` block from sheet.
- `darker-ages.tsx` — `ComicSeries` block from sheet.

### Step 5 — Visible notice blocks

Add a small `<RightsNotice />` block (new file `src/components/rights-notice.tsx`) with variants: `series | reader | preview | shop | product | characters`. Renders the exact wording from the sheet, interpolating series/issue/title. Then insert:
- Near footer of `children-of-aquarius.tsx`, `battlefield-atlantis.tsx`, `darker-ages.tsx` (`variant="series"`; also `variant="characters"` under each character-profile section if present).
- Footer of `reader.$series.$issue.tsx` (`variant="reader"`).
- Adjacent to any "free pages" preview viewer on the series pages (`variant="preview"`).
- `shop.tsx` page footer and `product.$handle.tsx` product footer (`variant="shop"` / `variant="product"`).

### Step 6 — Image alt-text convention

Audit `<img>` / `<Image>` usages on the three series routes and the reader route. Where alt text describes a comic/character/cover, rewrite to `[Subject] — [Series] #[n] — © Real World Comics`. Non-content images (icons, decorative) left alone.

### Step 7 — Held items (no change)

- Leave "Trademarks pending" copy on `industry.tsx` as-is.
- Leave "Officially licensed tees" wording in `shop.tsx` as-is.
- Leave "Release the X-Files" product as-is.
These are noted in the verification message back to Phil so he can decide.

### Verification before handoff

After edits, I will: (a) build to confirm no TS/JSX errors, (b) grep to confirm zero remaining `Astralnaut Studios LLC` outside intended brand uses (`raffle.rules.tsx` Sponsor, internal growth docs left intentionally), (c) view the three series pages + reader page in the preview to confirm notices render and layout holds, (d) run JSON-LD through schema.org parse locally (JSON.parse round-trip). I will not publish; I'll surface the staged URL and the verification checklist for Phil to confirm.

### Out of scope

- Translating legal English to each locale (flagged for human review).
- Editing dated strategy docs in `src/content/*` beyond the flag.
- USPTO/trademark filings, attorney review, or any change to held items in Step 7.
