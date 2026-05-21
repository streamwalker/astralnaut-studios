## 4-cover rotating fan above the fold

**Assets**
- Copy `user-uploads://0002._Battlefield_Atlantis_Issue_1_Variant_Cover.png` → `src/assets/ba-issue-1-variant-2.png`
- Copy `user-uploads://Children_of_Aquarius_Issue_1_Variant_Cover_A.png` → `src/assets/coa-issue-1-variant-a.png`

**`src/components/cover-fan.tsx` (rewrite)**

Replace the static 3-cover layout with a 4-cover rotating fan.

Covers array (order fixed):
1. Battlefield Atlantis Issue 1 (`ba-issue-1-variant.png` — existing)
2. Battlefield Atlantis Variant 2 (`ba-issue-1-variant-2.png` — NEW, replaces the duplicated `baCoverM` storage URL)
3. Children of Aquarius Issue 1 (`coa-issue-1-cover.png` — existing)
4. Children of Aquarius Variant A (`coa-issue-1-variant-a.png` — NEW)

Four fixed slot positions around the fan:
- `front-center` — z 40, scale 1.00, rotate 2°, centered
- `back-right`  — z 30, scale 0.88, rotate 8°, offset right
- `far-back`    — z 20, scale 0.78, rotate 14°, offset right+up
- `back-left`   — z 10, scale 0.86, rotate -10°, offset left

Rotation logic:
- `useState<number>(0)` for `activeIndex`
- `useEffect` runs `setInterval(() => setActive(i => (i + 1) % 4), 4000)`; cleared on unmount
- Pause on hover (`onMouseEnter` clears, `onMouseLeave` restarts)
- Respect `prefers-reduced-motion` — skip the interval entirely
- For each cover at index `i`, its current slot = `slots[(i - activeIndex + 4) % 4]`
- Apply slot via inline `style` (transform + zIndex) with a wrapper transition `transition: transform 900ms cubic-bezier(0.4,0,0.2,1), z-index 0ms` so position/scale/rotation tween while stacking swaps cleanly

Visual preservation:
- Keep the existing `aspect-[5/6] w-full max-w-[560px]` container
- Keep the current cover shadow/glow style (neon + violet)
- Each cover keeps `overflow-hidden rounded-xl`

**Out of scope**
- No changes to hero copy, stats, milestone strip, or other sections
- No DB / server changes
- The `baCoverM` Supabase storage URL reference is dropped; both new covers ship as bundled assets

**Files touched**
- `src/assets/ba-issue-1-variant-2.png` (new)
- `src/assets/coa-issue-1-variant-a.png` (new)
- `src/components/cover-fan.tsx` (rewrite)
