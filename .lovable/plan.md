On `src/routes/index.tsx` (the homepage):
1. Remove the outer `<div className="mx-auto max-w-7xl px-6 pt-10 pb-2 text-center">` wrapper around the logo so it flows inline with the page instead of sitting on a card-like block.
2. Reduce the logo's `max-w-[720px]` to `max-w-[360px]` (50% smaller).
3. Delete the "A subsidiary of Astralnaut Studios" subtitle line entirely.
4. Adjust top/bottom spacing (e.g. `pt-6 pb-4`) so the reduced logo sits naturally between the site header and the hero section headline. Keep the neon drop-shadow filter.