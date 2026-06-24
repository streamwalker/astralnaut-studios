# Battlefield Atlantis teaser as landing-page hero background

Use the uploaded clip (`Battlefield Atlantis Teaser Trailer clip 1.mp4`, 1920×1080, 15s, H.264+AAC, 49 MB) as a full-bleed autoplaying background behind the landing-page hero.

## Plan

1. **Upload the video to the Lovable CDN** with `lovable-assets create --file /mnt/user-uploads/Battlefield_Atlantis_Teaser_Trailer_clip_1.mp4 --filename battlefield-atlantis-teaser.mp4`, write the pointer to `src/assets/battlefield-atlantis-teaser.mp4.asset.json`. No binary lands in the repo.
2. **Generate a poster image** from frame ~1s with `ffmpeg` → upload as `battlefield-atlantis-teaser-poster.jpg` so the hero has something to paint before the video buffers (and as the fallback on iOS Low Power Mode where autoplay is blocked).
3. **New component `src/components/home/HeroVideoBackground.tsx`**:
   - `<video>` with `autoPlay muted loop playsInline preload="metadata"`, `poster={posterUrl}`, `aria-hidden="true"`, `tabIndex={-1}`.
   - `object-fit: cover`, absolutely positioned to fill the hero, `z-index: 0`.
   - Dark gradient overlay on top (`bg-gradient-to-r from-black/85 via-black/55 to-black/20`) so the existing hero copy stays legible.
   - Respects `prefers-reduced-motion`: when set, render the poster image instead of the video element.
   - On mount, attempt `video.play()` and swallow the rejection (some browsers reject the promise even with all four autoplay attributes); poster covers that case.
4. **Edit `src/routes/index.tsx`** hero section only:
   - Make the existing hero `<section>` `relative overflow-hidden` and bump it to roughly `min-h-[78vh]` on desktop / `min-h-[70vh]` on mobile so the video has room to breathe.
   - Mount `<HeroVideoBackground />` as the first child of the section.
   - Wrap the existing two-column grid in a `relative z-10` div so headline, CTAs, stat band, and CoverFan render over the video.
   - Slightly lighten the headline text shadow / keep `text-white`-equivalent tokens so contrast holds over moving imagery.
5. **No audio.** Muted is mandatory for autoplay; we leave it muted (no unmute control) since this is ambient background, not a player.
6. **Performance guardrails:**
   - `preload="metadata"` (not `auto`) so we don't force a 49 MB pull before paint.
   - Skip the video entirely on `navigator.connection.saveData === true` or `effectiveType` of `2g`/`slow-2g` — show poster only.
   - Poster is `<img loading="eager" fetchpriority="high">` so first paint is instant.
7. **Analytics:** fire `track("hero_video_played")` on the video's first `playing` event and `track("hero_video_blocked")` if the play promise rejects, so we can see how often autoplay actually fires in the wild.

## Files
- **New:** `src/components/home/HeroVideoBackground.tsx`, `src/assets/battlefield-atlantis-teaser.mp4.asset.json`, `src/assets/battlefield-atlantis-teaser-poster.jpg.asset.json`.
- **Edited:** `src/routes/index.tsx` (hero section only).

## Out of scope
- Not touching the slate, pricing strip, pillars, ClosingBand, header, footer, or any subpage.
- Not adding a video player UI, sound control, or pause button (this is decorative background).
- Not implementing the broader Marvel-style hero rotator from the previous plan — this is the smaller, focused "video background" ask. If you also want the rotator, say so and I'll layer the two (video becomes one slot's background).

## Risk
Low. Pure presentation change scoped to the landing-page hero. Worst case the video fails to autoplay on a given device and the user sees the poster image — still a better hero than today.

## Open question
Do you want the video to **replace** the current `<CoverFan />` right-column visual, or should CoverFan stay on top of the video on the right side? Default I'll ship: keep CoverFan in place over the video — the fan reads as foreground art, the teaser reads as ambient backdrop. Tell me "drop the cover fan" if you'd rather let the teaser carry the whole hero.
