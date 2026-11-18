# Astralnaut continuous space journey

Implemented in the existing TanStack Start + Cloudflare app. The HTML, subscriptions, protected comic library, and account backend remain the source of truth. The WebGL scene is a progressive decorative layer, not a replacement router.

## Run / build

`npm ci && npm run dev` serves port 8080. Public content server functions require the existing server environment for full data. Do not put service-role credentials in VITE variables. `npm run build` emits `.output/public` and `.output/server`; deploy the complete Worker with the repository's established deployment workflow. A standalone static replacement would break the existing membership/reader functionality.

The repository uses a sparse working checkout in some local copies. For a full build, include `private-content/gridiron-zero/library-v7.enc` and `private-content/gridiron-zero/comics-v12/` (encrypted files only). CI checks out the complete repository.

## Art and scene

- `build_assets.py`: reproducible Blender generation of 12 transparent volume renders, ring station, starship, seven asteroids, UV planet, cloud shell, and baked terrain.
- `refine_asteroids.py`: run after the generator for subdivision, surface displacement, and baked regolith.
- Editable `station.blend`, `starship.blend`, `asteroids.blend`, `planet.blend` stay here. `station-reference.png` is an inspection render.
- Web assets are in `public/space-journey`. Geometry uses Draco; decoder files are reused from the existing Battlefield cinematic assets.
- `src/components/space-journey/beats`: star layers/shooting stars, layered nebula shaders, and station/asteroid/planet/ship loading.
- `flight.ts`: camera and look-at Catmull-Rom splines, ordered to match the five chapter IDs. Edit corresponding points together. The runtime interpolates by section position, not a hardcoded page height.
- `JourneyHome.tsx`: semantic headings, chapter copy, slate, and calls to action. Series and stats remain connected to their existing server functions. Prices remain in `src/config/pricingTiers.ts`.
- `SpaceExperience.tsx`: route-aware scene lifecycle, reduced-motion fallback, loading progress, navigation and subpage arrivals.
- `journey.css`: layout, typography, readable overlays, mobile layout, and fallback presentation.

To swap gas sprites, retain `nebula-00.png` through `nebula-11.png`, alpha transparency, and comparable dimensions. The loader counts actual completed texture requests. Later GLBs are requested after departure; failure leaves all DOM content accessible. Capture a matching hero canvas to replace `journey-fallback.png` after an art change.

## Interaction and accessibility

Wheel/trackpad scrolling travels the camera continuously. Pointer movement adds restrained parallax; touch movement provides the same offset without capturing vertical scrolling or pinch zoom. The panels tilt on fine-pointer hover. Chapter links and normal page links work with the keyboard. The full menu uses the existing accessible dialog/focus management.

Ambient animation has a pause control. Reduced motion uses the rendered fallback with normal document scrolling. A WebGL failure also leaves the static background and all content available. The canvas does not contain text or actions. Mobile/coarse-pointer or limited GPU devices reduce particles and resolution and omit bloom. Sustained slow frames disable bloom and reduce resolution on desktop. Rendering is suspended while hidden and resources/listeners are disposed on navigation.

## Page coverage

Home: full five-stage flight. Studio, three series, pricing, perks, shop, industry, help and training: shared arrival composition and subtle route-aware scroll movement. Legal and policy pages: the shared background and typography with readable document surfaces. Reader, sign-in, checkout, archive and admin: shared navigation and colors, with no decorative WebGL obscuring their existing functionality. The already-published Battlefield Kickstarter cinematic keeps its independent scene.

All original public footer destinations, subscription prices and checkout parameters remain. The original trailer rotator is accessible in “Watch the transmissions.” The first-visit homepage tour is now opt-in via `/?tour=1`; help and training remain in navigation. No checkout, email, admin, or subscriber mutations are needed to inspect the redesign.

## Verification

Run `PLAYWRIGHT_MODULE=/path/to/playwright node scripts/verify-space-journey.cjs [base-url]` with Chrome installed. The script only navigates/reads and exercises local browser state: it does not submit checkout, inquiries, invitations, or project changes. Screenshots and JSON go to `/tmp/astralnaut-space-qa` (override `SPACE_QA_DIR`). Checks cover five camera waypoints, desktop and touch input, cancellation, pause, menu keyboard behavior, live reduced-motion changes, three device widths, missing assets, missing WebGL and disabled JavaScript.

Initial textures plus fallback are approximately 3.8 MB; the four later-loaded GLBs total approximately 0.56 MB. A local Chrome desktop sample returned a 16.7 ms median and 16.7 ms p95 animation interval (roughly 60 fps) in the tested scene. This is a local-machine measurement, not a guarantee for other hardware. Phone tests are emulated; no physical iPhone result is claimed.
