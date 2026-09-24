const PUBLIC_OBJECT_PREFIX = "/storage/v1/object/public/";
const THUMBNAIL_WIDTHS = [320, 480, 640, 768, 960] as const;

/** Only transform public images on our own Storage host; never rewrite signed URLs. */
export function carouselThumbnail(originalSrc: string, storageBase: string) {
  try {
    const original = new URL(originalSrc);
    const storage = new URL(storageBase);
    if (
      original.origin !== storage.origin ||
      !original.pathname.startsWith(PUBLIC_OBJECT_PREFIX)
    ) return null;

    const atWidth = (width: number) => {
      const url = new URL(original);
      url.pathname = url.pathname.replace(PUBLIC_OBJECT_PREFIX, "/storage/v1/render/image/public/");
      url.searchParams.delete("download");
      url.searchParams.delete("format");
      url.searchParams.delete("height");
      url.searchParams.set("width", String(width));
      url.searchParams.set("quality", "80");
      url.searchParams.set("resize", "contain");
      return url.href;
    };

    return {
      src: atWidth(480),
      srcSet: THUMBNAIL_WIDTHS.map((width) => `${atWidth(width)} ${width}w`).join(", "),
      // Reserve enough detail for the largest/front card, even while cards rotate.
      sizes: "(min-width: 1280px) 360px, (min-width: 768px) 29vw, 58vw",
    };
  } catch {
    return null;
  }
}
