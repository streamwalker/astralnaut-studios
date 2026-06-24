## Goal

Same luminance-keyed transparency treatment that fixed Battlefield Atlantis, now applied to:

- `src/assets/darker-ages-logo.png` → `src/assets/darker-ages-logo-clean.png`
- `src/assets/children-of-aquarius-logo.png` → `src/assets/children-of-aquarius-logo-clean.png`

## Steps

1. **Children of Aquarius** — source has a dark navy plate with bright blue glow. Same script as BA (threshold floor ~12, ceiling ~180) drops the plate cleanly and preserves the electric-blue halo as natural semi-transparency.

2. **Darker Ages** — source has a bright orange/sunset sky baked in, not a dark plate. Pure luminance keying would leave the fire clouds as a glowing rectangle. So for DA, key on **chroma + darkness combined**:
   - Use the darker channel (`min(R,G,B)`) instead of `max` for the alpha ramp — the metallic lettering has dark interior shadow lines that the silvery clouds don't, so this preserves the letters while attenuating the clouds.
   - If the result still shows too much sky, fall back to AI re-cut with a strict prompt and edge feathering disabled. Decide after viewing the first attempt.
   - Auto-crop to non-transparent bbox either way.

3. **Wire up imports** in `src/components/home/HeroRotator.tsx` — swap `daLogo` and `coaLogo` to the `-clean` versions.

4. **Visually verify** each output via `code--view` on the PNG before declaring done; iterate the threshold if needed.

## Out of scope

- No size/position/layout changes.
- No copy changes.
- PS5 Milestone slot untouched.
