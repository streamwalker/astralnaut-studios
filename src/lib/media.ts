/**
 * External media that cannot ship inside the Worker bundle.
 *
 * Cloudflare Workers static assets are capped at **25 MiB per file**
 * (https://developers.cloudflare.com/workers/platform/limits/). The Battlefield
 * Atlantis teaser is 48.8 MiB, so it can never be served from `.output/public`
 * — `wrangler deploy` rejects the file outright. It therefore lives in Supabase
 * Storage, next to the comic pages that are already served from there.
 *
 * Everything else recovered from the old Lovable CDN is well under the cap and
 * is committed to `src/assets/` as a normal Vite asset import.
 */

/**
 * Site-relative path of the committed hero background loop.
 *
 * The 48.8 MiB master could never ship this way. This is a re-encode of the
 * teaser sized for a background that is permanently behind a darkening gradient
 * and a logo lockup: 1440x602, h264 high, CRF 29, **no audio track at all**
 * (the element is `muted`, so the audio was dead weight), `+faststart` so the
 * moov atom is at the head and playback can begin on the first range request.
 * That lands at ~5.1 MiB — a fifth of the 25 MiB per-file Workers cap, so it
 * ships as an ordinary static asset and is served from Cloudflare's edge.
 *
 * Kept in `public/` rather than imported from `src/assets/` for the same reason
 * as `DARKER_AGES_COVER` below: a stable, unhashed URL. That matters here
 * because the same path is the thing you would swap for a Supabase Storage URL
 * via `VITE_HERO_VIDEO_URL` without touching code.
 */
const HERO_VIDEO_LOCAL = "/hero/battlefield-atlantis-teaser.mp4";

/**
 * URL of the hero background video.
 *
 * `VITE_HERO_VIDEO_URL` wins when set, so the loop can be moved to Supabase
 * Storage (or any CDN) later by setting one env var — no code change, no
 * rebuild of the component. Unset, it resolves to the committed asset above.
 *
 * `HeroRotator` still treats a falsy value as "no video" and renders the
 * committed poster still instead of mounting a `<video>`. That branch is now
 * reached only by reduced-motion and save-data users, which is exactly what it
 * was written for.
 */
export const HERO_VIDEO_URL: string | undefined =
  import.meta.env.VITE_HERO_VIDEO_URL || HERO_VIDEO_LOCAL;

/**
 * Site-relative path of the Darker Ages Issue #1 cover.
 *
 * This one asset is served from `public/` rather than imported from
 * `src/assets/` because a row in the `carousel_slides` table stores the path as
 * data (`pageUrl()` in `src/lib/storage.ts` passes any leading-slash value
 * through verbatim). A Vite asset import would be content-hashed at build time,
 * so the database and the bundle would drift apart on the next build. Keeping
 * it in `public/` gives code and data one stable URL to share.
 */
export const DARKER_AGES_COVER = "/darker-ages-issue-1-cover.png";
