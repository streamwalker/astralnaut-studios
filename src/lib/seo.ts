import ogDefaultAsset from "@/assets/og-default.jpg.asset.json";

export const SITE_URL = "https://astralnautstudios.com";

/** Absolute URL for the default brand share image (1200x630). */
export const OG_DEFAULT_IMAGE = `${SITE_URL}${ogDefaultAsset.url}`;
export const OG_DEFAULT_WIDTH = "1200";
export const OG_DEFAULT_HEIGHT = "630";
export const OG_DEFAULT_ALT =
  "Real World Comics — Astralnaut Studios";

/** Build an absolute URL from a site-relative path. */
export const absUrl = (path: string) =>
  path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
