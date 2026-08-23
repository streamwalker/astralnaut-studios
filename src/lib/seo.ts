import ogDefaultImage from "@/assets/og-astralnaut-studios.jpg";

export const SITE_URL = "https://astralnautstudios.com";

/** Default share title/description used across the site. */
export const OG_DEFAULT_TITLE = "Astralnaut Studios";
export const OG_DEFAULT_DESCRIPTION =
  "Astralnaut Studios and Real World Comics are imprints of Streamwalkers Corporation";

/** Absolute URL for the default brand share image (1200x630). */
export const OG_DEFAULT_IMAGE = `${SITE_URL}${ogDefaultImage}`;
export const OG_DEFAULT_WIDTH = "1200";
export const OG_DEFAULT_HEIGHT = "630";
export const OG_DEFAULT_ALT = "Astralnaut Studios — Real World Comics";

/** Build an absolute URL from a site-relative path. */
export const absUrl = (path: string) =>
  path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
