## Plan

Add the five uploaded character profiles to the existing **Cast** section on the **Children of Aquarius** page, keeping the current visual style and making sure the expanded roster still feels balanced on desktop and mobile.

## What I’ll change

1. **Import the new profile images** into the project as page assets.
2. **Extend the `CAST` data array** in `src/routes/children-of-aquarius.tsx` with:
   - Simon Olatunji
   - Stacey
   - Annie
   - Gil
   - Jeff
3. **Add concise role/character blurbs** for each new cast member so the cards match the current format.
4. **Adjust the Cast grid if needed** so a 10-character lineup remains readable and visually even across breakpoints.

## Result

The Children of Aquarius subpage will show a larger cast gallery with all current and newly uploaded character profiles in one consistent section.

## Technical details

- Update only the frontend page route: `src/routes/children-of-aquarius.tsx`
- Add the five uploaded images under `src/assets/coa-cast/`
- No backend, database, auth, or storage changes needed