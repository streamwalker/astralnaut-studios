import { SITE_URL } from "@/lib/seo";

/** Public, versioned assets; served directly by the existing static asset host. */
export const COA_SHARE = {
  url: `${SITE_URL}/children-of-aquarius`,
  title: "Children of Aquarius — Fiction. Informed by experience.",
  description:
    "A thriller by former U.S. Air Force intelligence operator Phil Russell, who held Top Secret/SCI clearance for over three decades. UAP crash-retrieval claims remain unconfirmed.",
  image: `${SITE_URL}/share/v1/children-of-aquarius-share-v1.jpg`,
  imageAlt:
    "Children of Aquarius's existing metallic title above its fictional cast, with the line: A thriller by former U.S. Air Force intelligence operator Phil Russell. Fiction. Informed by experience.",
  video: `${SITE_URL}/share/v1/children-of-aquarius-preview-v1.mp4`,
};

export const coaShareMeta = [
  { name: "description", content: COA_SHARE.description },
  { property: "og:title", content: COA_SHARE.title },
  { property: "og:description", content: COA_SHARE.description },
  { property: "og:type", content: "website" },
  { property: "og:url", content: COA_SHARE.url },
  { property: "og:site_name", content: "Astralnaut Studios" },
  { property: "og:image", content: COA_SHARE.image },
  { property: "og:image:secure_url", content: COA_SHARE.image },
  { property: "og:image:type", content: "image/jpeg" },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { property: "og:image:alt", content: COA_SHARE.imageAlt },
  { property: "og:video", content: COA_SHARE.video },
  { property: "og:video:secure_url", content: COA_SHARE.video },
  { property: "og:video:type", content: "video/mp4" },
  { property: "og:video:width", content: "1200" },
  { property: "og:video:height", content: "630" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: COA_SHARE.title },
  { name: "twitter:description", content: COA_SHARE.description },
  { name: "twitter:image", content: COA_SHARE.image },
  { name: "twitter:image:alt", content: COA_SHARE.imageAlt },
];
