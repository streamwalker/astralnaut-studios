const base = import.meta.env.VITE_SUPABASE_URL as string;

export function pageUrl(image_path: string | null | undefined): string | null {
  if (!image_path) return null;
  // Already a full URL
  if (/^https?:\/\//.test(image_path)) return image_path;
  // Bucket-qualified path "bucket/foo.png"
  if (image_path.includes("/")) {
    const [bucket, ...rest] = image_path.split("/");
    if (["comic-pages", "characters", "blog-covers"].includes(bucket)) {
      return `${base}/storage/v1/object/public/${bucket}/${rest.map(encodeURIComponent).join("/")}`;
    }
  }
  // Default to comic-pages bucket
  return `${base}/storage/v1/object/public/comic-pages/${image_path.split("/").map(encodeURIComponent).join("/")}`;
}
