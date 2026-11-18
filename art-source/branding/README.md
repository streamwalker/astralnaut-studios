# Astralnaut Studios transparent V3 logo

Uses the user's supplied `Astralnaut Studios Logo V3.png`: white custom wordmark and blue four-point star. Background extraction was performed using the built-in image-generation/editing tool, with transparent_background=true. The selected result is preserved as `astralnaut-studios-v3-transparent.png` (2172×724 RGBA). The site's `src/assets/astralnaut-studios-logo-v3-transparent.webp` is a lossless, exact-alpha WebP encoding made with cwebp; it is displayed at260px desktop and220px tablet/mobile.

Selected edit prompt:

> Use case: background-extraction. Edit only the supplied Astralnaut Studios logo for use as the website header asset. Remove the black background to true transparent alpha, including negative spaces inside and between every letter and around the blue star. Preserve the EXACT existing logo artwork: same custom white ASTRALNAUT lettering contours, the same extended triangular A and the same tail on R, exactly spaced STUDIOS below, the exact blue four-point star and its gradient shading. Do not redesign, redraw, restyle, add glow, add shadows, recolor, change letter shapes, or change the layout. Clean antialiased edges, no black fringe, no background rectangle. Preserve the white textured lettering and the blue star. Tight transparent bounding box around the entire complete mark with only a small safe margin, wide horizontal logo.

Two extraction outputs were inspected. The tightly framed first output was selected after real browser compositing verified the low-alpha edge pixels remain transparent over the site background. The second output was not deployed. The source logo in iCloud was not modified.

The shared site header and loading screen use this asset. At widths up to760px, the header places the enlarged logo on its own centered row and retains its controls beneath it. Safe-area padding, home-link behavior, navigation, language, cart and account access are preserved.
