# Children of Aquarius website share kit

Created September 16, 2026 for the existing public series page:
https://astralnautstudios.com/children-of-aquarius

## Brand and provenance

- Artwork: existing `src/assets/coa-issue-1-cover.png` from this repository.
- Title: existing `src/assets/children-of-aquarius-logo.png`, preserved intact.
- The dark background, metallic title, cyan accents, and Inter typography follow the live Astralnaut Studios site. No generated characters, aircraft, government insignia, or supposed documentary evidence were added.
- The editable `astralnaut-mark-v1.svg` simplifies the pointed A and cyan star in the existing `src/assets/astralnaut-studios-logo.png`. Original logo and prior icon files remain available.
- Inter font: https://github.com/google/fonts/tree/main/ofl/inter; bundled with its SIL Open Font License (`Inter-OFL.txt`).
- Author background and clearance duration come from the user's supplied marketing brief; they were not independently verified. The page calls crash-retrieval/recovery efforts alleged and claims unconfirmed. Fiction is clearly identified; neither the imagery nor copy claims government endorsement or proves a program exists.

## Exports and integration

`public/share/v1/` contains a 1200×630 JPEG, an 8-second silent H.264/yuv420p MP4 at 24fps with fast-start metadata, editable SVG icon, ICO with 16/32/48 sizes, and PNG icons at 16/32/48/180/192/512 pixels. Combined primary image/video/touch icon transfer is approximately 0.7 MB.

`src/lib/coa-share.ts` owns the campaign metadata. The existing TanStack route emits it in initial HTML, overrides generic Twitter title/description, and preserves the ComicIssue schema. The author-positioning inset uses the page's existing design tokens. Root icon references and the existing manifest use the coordinated studio icon family. Homepage social positioning remains studio-wide.

The existing public static-assets delivery serves the media. No authentication, database, reader/paywall, checkout, or server-routing changes are required.

## Reproduce or revise

From repository root, create a Python virtual environment and install the packages in `requirements.txt`, then run:

```sh
python scripts/build-coa-share-kit.py
```

The script is the editable composition and animation source. It uses the repository artwork plus bundled Inter font and SVG geometry; it requires no generative service or paid credits. FFmpeg comes from imageio-ffmpeg. Versioned names preserve existing public assets; use a new version for subsequent published revisions.

`review.html` can be opened locally alongside this checkout. It uses relative asset paths and requires deliberate playback. `review-contact-sheet.jpg` shows phone and square crops and icons at real pixel sizes. The five `motion-*.jpg` images document loop timing.

## Verification

- Production build, TypeScript check, banned-terms prebuild check, and Cloudflare deployment dry run passed.
- Full Children of Aquarius page rendered with existing content using the established local server credential; no credential was copied into the checkout or public artifacts.
- Unauthenticated local HTTP request with Twitterbot user agent returned HTTP 200, author copy in initial HTML, one canonical link, and exactly one of each of the 21 campaign social tags.
- All 10 public assets returned matching SHA-256 hashes and appropriate MIME types. See `verification.json`.
- Video fully decoded to 192 frames, 1200×630, 8 seconds, H.264/yuv420p with no audio. The `moov` atom precedes `mdat`.
- Local video request `Range: bytes=0-1` returned HTTP 206 and exactly two bytes.
- Native Chrome playback verified. First, intermediate, and last frames and phone/square crops visually reviewed.

## Release boundary

Integrated and verified locally; not published by this task. Existing repository workflow deploys on merge/push to main. After release, fetch the public series HTML and each versioned public asset without cookies, compare hashes with `verification.json`, and repeat the range request against the production hostname.

Real recipient iMessage/Messenger animation has not been tested. Keep the JPEG fallback: client settings and link caches control presentation. Apple describes downloadable `og:video` media and a combined 10 MB limit here:
https://developer.apple.com/videos/play/tech-talks/205/
Open Graph structured properties: https://ogp.me/
