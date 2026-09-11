export function publicPreviewPage<T extends { is_free: boolean | null; published_at: string | null; image_path: string | null }>(page: T, now = Date.now()): T {
  return page.is_free && page.published_at && Date.parse(page.published_at) <= now ? page : { ...page, image_path: "" };
}
