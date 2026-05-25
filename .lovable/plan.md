## Add Ryoko Tsurayaba to Children of Aquarius Cast

**Assets**
- Copy `user-uploads://Ryoko_Tsuryaba_-_Phase_One.png` → `src/assets/coa-cast/ryoko-phase-one.png`
- Copy `user-uploads://Ryoko_Tsuryaba._-_Tatical_Ops.png` → `src/assets/coa-cast/ryoko-tactical-ops.png`

**File: `src/routes/children-of-aquarius.tsx`**
- Add two imports for the new images.
- Append two entries to the `CAST` array (12th and 13th cards):
  1. **Ryoko Tsurayaba — "The Head of Christ" (Phase One)** — psionic adolescent; telekinesis, psychometry, past/future glimpses. Origin: Japan, age 13.
  2. **Ryoko Tsurayaba — "The Head of Christ" (Tactical Ops)** — older tactical-ops incarnation; disciplined focus, precision force manipulation, levitation; calm under pressure.
- Keep the existing `sm:grid-cols-2 xl:grid-cols-3` grid (13 cards flow naturally; last row will have 1 card on xl, which is fine and matches current layout behavior).

**Out of scope:** no other cards, sections, styles, or backend changes.
