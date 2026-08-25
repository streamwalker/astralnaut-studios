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
 * Absolute URL of the hero background video, or `undefined` when unset.
 *
 * `HeroRotator` treats `undefined` as "no video": it renders the committed
 * poster still instead and never mounts a `<video>` element. That is a
 * deliberate, visible-but-correct fallback, not a broken state — it is the same
 * path already taken for reduced-motion and save-data users.
 *
 * To turn the video back on, upload the teaser to the public `site-media`
 * bucket and set `VITE_HERO_VIDEO_URL` in `.env.production`.
 */
export const HERO_VIDEO_URL: string | undefined =
  import.meta.env.VITE_HERO_VIDEO_URL || undefined;

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
