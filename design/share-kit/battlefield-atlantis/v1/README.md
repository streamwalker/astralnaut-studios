# Battlefield Atlantis website share kit

Target: https://astralnautstudios.com/battlefield-atlantis

## Brand and source artwork

The composition preserves the site's red metallic Battlefield Atlantis logo (`src/assets/battlefield-atlantis-logo.png`) and uses the exact primary cover displayed on the public series page when this kit was made. Its unmodified source is `primary-cover-source.png`, retrieved from:
https://scjatmhkwcrqwssyypkd.supabase.co/storage/v1/object/public/comic-pages/battlefield-atlantis-issue-1/covers/Battlefield-Atlantis-Issue-1-Primary-Cover-A-1784275305605.png

The original “Only One Will Rule” tagline is retained. A crop isolates the cover's main heroes and excludes the printed price, old title treatment, and promotional bursts. No characters, dialogue, aircraft, uniforms, insignia, or purported documentary evidence were generated or changed. The motion is a subtle periodic camera push and lighting pulse over the same artwork.

Author background and clearance duration come from the user's approved marketing brief, not independent credential verification. The page identifies UAP crash-retrieval/recovery references as alleged and claims as unconfirmed. The story is explicitly fiction and makes no government-endorsement claim.

## Assets and integration

- `public/share/v1/battlefield-atlantis-share-v1.jpg`: 1200×630 static social card.
- `public/share/v1/battlefield-atlantis-preview-v1.mp4`: 8-second silent H.264/yuv420p, 24fps, 1200×630, fast-start MP4 (approximately 607 KiB).
- The already-published Astralnaut A-star SVG/ICO/PNG/touch icons and app manifest are reused unchanged.
- `src/lib/ba-share.ts` defines the complete campaign metadata, emitted in initial HTML by the existing TanStack route. Twitter has its own correct campaign title and description, and the still remains the fallback.
- The author inset uses the existing page's cyan styling. Existing canon copy, reading, subscription, and account behavior are preserved. No backend, authentication, database, or hosting configuration changed.

## Reproduce

Use the packages pinned in `design/share-kit/v1/requirements.txt`, then run:

```sh
python scripts/build-ba-share-kit.py
```

The script is the editable composition/timeline source. It uses the bundled Inter font and its license in `design/share-kit/v1/`, existing logo, and saved cover source. It requires no generative service or credits. `review.html` opens the still, video, and shared icons from relative local paths. `review-contact-sheet.jpg` shows phone/square crops and real-size icons; `motion-*.jpg` captures five points in the loop.

## Verification and release

Local build, typecheck, banned-terms prebuild check, and Cloudflare deployment dry run passed. Initial HTML contains the new author copy, one canonical URL, and exactly one of each of the 21 required social tags. The media decoded to 192 frames over 8 seconds, and native Chrome playback was checked. All ten new/shared assets matched local hashes and MIME types; the local byte-range request returned HTTP 206. The existing Children of Aquarius campaign was also checked for isolation. See `verification.json` for the pre-release HTTP results.

Publish through the established main-branch deployment workflow. After deployment, independently fetch the live page, verify all asset hashes, inspect native browser playback/range delivery, and confirm the original campaign still has its own metadata. Recipient iMessage/Messenger animation remains untested; the still fallback and client preferences control presentation.

Metadata references: https://ogp.me/ and https://developer.apple.com/videos/play/tech-talks/205/
