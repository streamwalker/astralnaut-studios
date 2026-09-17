# Battlefield Atlantis motion v2

A 12-second silent sharing loop using the user's attached trailer. The existing studio logo, author positioning, fictional framing, still-image fallback and icons are preserved. Only Battlefield Atlantis's `og:video` URLs change, to a versioned v2 asset. The previous v1 movie remains public.

## Sequence

- 0–1.5 s: existing cover composition.
- 1.5–3.25 s: fleet above the planet.
- 3.25–5 s: spacecraft flyby.
- 5–8 s: ocean figure and rising wave.
- 8–9.5 s: violet energy action.
- 9.5–12 s: return to cover; identical first and final frame for looping.

Branding stays fixed while short dips separate the shots. Footage runs forward at its original speed. No synthesized character motion, replacement dialogue or audio was added. The supplied MOV's exact filename, SHA-256 and selected source intervals are recorded in provenance.json. Only selected, silent, metadata-stripped source clips are retained here; the full personal attachment is not published.

## Reproduce

Install `pillow`, `numpy`, and `imageio-ffmpeg`, then run `python scripts/build-ba-motion-v2.py` from the repository. Source excerpts and the existing artwork/font are the editable inputs. Open review.html through a local server to review the movie.

## Verification

The 1200×630 H.264/yuv420p MP4 contains 288 frames at 24 fps and no audio. Fast-start is enabled; full decode and browser playback passed. The first and last review frames match. File size is 1,632,177 bytes. Build, typecheck and deployment dry run passed. See verification.json and the motion contact sheet.

Live publication requires a successful production workflow, checking the page's initial metadata and comparing public movie bytes with this export. Recipient behavior in iMessage/Messenger has not been tested and is controlled by those apps.
