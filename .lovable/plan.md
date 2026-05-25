The visible "card" is the dark rectangular background baked into the logo PNG itself. Two changes:

1. **Replace the logo asset** with the newly uploaded `user-uploads://Real_World_Comics_V3.png` → overwrite `src/assets/real-world-comics-logo.png`. Run it through background removal (`imagegen--edit_image` with `transparent_background: true`) so the metallic "Real World Comics" mark sits on transparency.

2. **Update `src/routes/index.tsx`** logo `<img>` block: keep the current size (`max-w-[360px]`) and spacing, but since the asset is now transparent it will blend directly into the page background — no card edge. Keep the cyan drop-shadow for the glow.

No other files change.