## Interactive cover fan

Add prev/next controls and a click-to-expand lightbox to the above-the-fold rotating cover fan (`src/components/cover-fan.tsx`).

### Behavior

**Prev / Next**
- Two circular arrow buttons overlaid on the fan (left = prev, right = next), styled to match the existing neon/violet glow.
- Clicking advances or rewinds `active` immediately (the existing 900ms slot transition handles the motion).
- Manual interaction resets the 4s auto-rotate timer so the next auto-advance happens 4s after the click (no jitter).
- Keyboard: `ArrowLeft` / `ArrowRight` on the focused fan do the same.

**Click to expand**
- Clicking the front-center cover (or any cover already in the front slot) opens a fullscreen lightbox overlay showing that cover large.
- Clicking a non-front cover rotates it to the front instead of opening the lightbox (one click = bring forward, second click on the now-front cover = expand). This keeps the rotation interaction intact.
- Lightbox: dark backdrop (`rgba(0,0,0,0.85)`), centered image at up to `90vh` / `min(560px, 90vw)`, close on backdrop click, close button (×) top-right, and `Escape` key. Auto-rotate pauses while open.
- Lightbox includes the same prev/next arrows so users can flip through covers at full size.

### Technical details

- All changes confined to `src/components/cover-fan.tsx`. No new dependencies, no route or backend changes.
- New state: `lightboxOpen: boolean`. Reuse existing `active` index.
- Replace the `setInterval` pattern with a `useEffect` that depends on a `tickKey` counter; bump `tickKey` whenever the user clicks prev/next so the interval restarts cleanly.
- Each cover `<div>` becomes a `<button>` (or gets `role="button"` + `onClick`) with `aria-label` describing the cover. Front-slot click → open lightbox; non-front click → `setActive(i)`.
- Lightbox rendered inline (no portal needed) as a `position: fixed inset-0 z-50` overlay; respects `prefers-reduced-motion` for fade-in.
- Keep existing slot transform math, aspect ratio, and shadow styling untouched.