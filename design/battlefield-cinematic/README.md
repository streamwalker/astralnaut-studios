# Battlefield Atlantis cinematic campaign

The approved cover is preserved as the artwork on a lightweight, Blender-made book presentation. The model is a visual cover study; its dimensions, page block and back cover do not represent printing or binding specifications.

## Rebuild

Blender 5.2.1 LTS was used. From the repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python design/battlefield-cinematic/build_edition.py -- "$PWD/design/battlefield-cinematic"
cp design/battlefield-cinematic/battlefield-edition.glb public/battlefield-atlantis/cinematic/
cwebp -q 86 design/battlefield-cinematic/edition-reference.png -o public/battlefield-atlantis/cinematic/edition-fallback.webp
npm run dev -- --host 127.0.0.1 --port 8088
```

Open `/kickstarter/battlefield-atlantis`. The blend includes packed artwork; the source PNG is retained so regeneration does not depend on an external filesystem path. Draco decoder files are copied from the installed Three.js distribution's `examples/jsm/libs/draco/gltf` directory.

## Behavior and limits

- Fine-pointer desktop, at least 1024px wide, normal motion, no Save-Data, and at least 4 GB reported device memory: dynamically import Three.js, GSAP ScrollTrigger and Lenis.
- Hero: pointer parallax, restrained float, scroll rotation and camera dolly. Showcase: near-viewport lazy loading and a pinned full rotation with an ordinary skip link.
- Mobile/tablet, reduced motion, Save-Data and low-memory devices receive the static cover image and native scrolling. The motion switch also restores this presentation on desktop.
- Failed or slow model loading and WebGL context loss reveal the existing fallback. No content or navigation depends on the canvas.
- DPR capped at 1.5, one GSAP ticker, per-scene intersection checks, hidden-tab render suppression, and cleanup of observers, listeners, scroll triggers, textures, meshes, WebGL contexts and Draco workers.
- Existing armor selections, PDFs, campaign gallery, optional intro montage, series navigation, and Reddit links remain available.

## Verification (2026-11-17)

- TypeScript and production build passed. Carousel thumbnail URL, share-video range, private-library tests and Cloudflare deploy dry-run passed.
- Actual in-browser scene: 18 draw calls and 1,838 triangles. GLB is approximately 554 KiB, fallback 95 KiB. No FPS claim is made.
- Desktop browser checked at 1209x852 and 1440x1000: model loading, scroll pin/rotation, skip link, mouse movement, and keyboard-operated motion switch. Disabling motion removed both canvases and the pin spacer.
- Responsive browser checked at 390x844: no horizontal overflow, zero canvases, zero requests for the cinematic runtime, GLB or Draco. This is browser emulation, not a physical-device test.
- Reduced-motion emulation likewise made zero 3D requests. Blocking the GLB request preserved the visible fallback and all HTML content.
- Astra / Full Armor selection updated artwork, description and the PDF link. Intro overlay opened correctly.

No artwork was regenerated. The image-generation process and character canon are untouched.
