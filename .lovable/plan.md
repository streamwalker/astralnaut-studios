You want the logo to be the hero of each project card. Right now the cards are tall vertical posters (cover-aspect 1054×1491) with the logo squeezed into a small area, then a text block underneath. Going horizontal flips the relationship: the logo gets a wide cinematic plate and the copy sits beside it.

Below are four layout directions. Pick one (or mix), then I'll generate three rendered design variants of the chosen layout and you choose the final look.

---

## Option A — Stacked horizontal bands (full-bleed)

Each card becomes a full-width row, stacked vertically down the page.

```text
┌──────────────────────────────────────────────────────────────┐
│  [ • READING NOW ]                                           │
│                                                              │
│     ┌────────────────────┐   HARD SCI-FI SPACE OPERA         │
│     │                    │   Battlefield Atlantis            │
│     │  BATTLEFIELD       │   25,000 years before the         │
│     │  ATLANTIS  logo    │   present, Saantris Station…      │
│     │                    │                                   │
│     └────────────────────┘   Read first act free →           │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  [ • READING NOW ]    Children of Aquarius logo │ copy …     │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  [ OCT 2026 ]         Darker Ages logo          │ copy …     │
└──────────────────────────────────────────────────────────────┘
```

- Logo plate ~60% width, copy ~40%.
- Plate uses a subtle per-series gradient pulled from the logo (blue glow for Atlantis, cyan crystal for Aquarius, ember for Darker Ages).
- Biggest "logo as hero" payoff. Slowest scroll — three big rows instead of a tight grid.
- Best when there are only 3–5 projects total.

## Option B — Stacked, alternating sides (zigzag)

Same stacked rows as A, but every other card mirrors: logo-left / copy-right, then logo-right / copy-left, then logo-left.

- More editorial, feels like a magazine spread.
- Still gives the logo a giant canvas.
- Slight risk of feeling busy on mobile — collapses to logo-on-top, copy-below on small screens.

## Option C — Horizontal "shelf" (side-by-side, scroll if needed)

Cards stay side-by-side like today, but each card itself becomes horizontal — wider than tall (roughly 3:2). All three fit in a single row on desktop; on tablet/mobile they stack.

```text
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ logo │ title     │ │ logo │ title     │ │ logo │ title     │
│      │ logline   │ │      │ logline   │ │      │ logline   │
│      │ CTA →     │ │      │ CTA →     │ │      │ CTA →     │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

- Logo still gets a wide plate (~55% of card width) but cards stay compact.
- Closest to current density; no extra scrolling.
- Logo plate is smaller than A/B but each card reads as a "ticket" or "playbill".

## Option D — Featured + secondaries

One large horizontal hero card on top (the active "Reading now" project, or whichever you flag), with the remaining projects as a horizontal row of smaller cards below.

```text
┌──────────────────────────────────────────────────────────────┐
│           BATTLEFIELD ATLANTIS  logo │  title  │  copy  →    │
└──────────────────────────────────────────────────────────────┘
┌────────────────────────┐ ┌────────────────────────┐
│ Aquarius  │  copy  →   │ │ Darker Ages │ copy  →  │
└────────────────────────┘ └────────────────────────┘
```

- Strongest hierarchy — guides reader straight to what you want them on.
- Requires picking a "featured" project (can be the most recently active).
- Mixes Option A (hero) with Option C (shelf) below.

---

## Technical notes

- File to update: `src/components/series-card.tsx` (single component drives the row on `/`, `/industry`, and elsewhere it's used).
- Aspect ratio change: drop `aspect-[1054/1491]` on the image well; switch to a wider plate (e.g. `aspect-[16/9]` for the logo zone in A/B, `aspect-[5/4]` for C).
- Logo source already exists via `logoFor(slug)` — no new assets needed.
- Per-series accent gradients can be defined as CSS tokens in `src/styles.css` so the plate background tints to match each logo's palette.
- Responsive: A/B/D collapse to single-column stacked layout under `md:`; C already stacks via the existing grid wrapper.
- Status badge (`Reading now` / `Oct 2026`) and CTA stay — just repositioned.

---

## What I need from you

1. Which layout direction — **A (stacked full bands)**, **B (zigzag stacked)**, **C (horizontal shelf)**, or **D (featured + secondaries)**?
2. Should the logo plate get a per-series colored gradient background, or stay on the current flat dark surface?

Once you pick, I'll generate three rendered variants of that direction (varying density, motion, and typographic emphasis) so you can pick the exact look before I build it.
