import { SITE_URL } from "@/lib/seo";

/** Public, versioned assets; served directly by the existing static asset host. */
export const BA_SHARE = {
  url: `${SITE_URL}/battlefield-atlantis`,
  title: "Battlefield Atlantis — Only One Will Rule",
  description:
    "A science-fiction epic by former U.S. Air Force intelligence operator Phil Russell, who held Top Secret/SCI clearance for over three decades. UAP crash-retrieval claims remain unconfirmed.",
  image: `${SITE_URL}/share/v1/battlefield-atlantis-share-v1.jpg`,
  imageAlt:
    "Battlefield Atlantis's red metallic logo above three fictional heroes from its existing cover, with the lines: Only One Will Rule. From former U.S. Air Force intelligence operator Phil Russell. Fiction. Informed by experience.",
  video: `${SITE_URL}/share/v1/battlefield-atlantis-preview-v1.mp4`,
};

export const baShareMeta = [
  { name: "description", content: BA_SHARE.description },
  { property: "og:title", content: BA_SHARE.title },
  { property: "og:description", content: BA_SHARE.description },
  { property: "og:type", content: "website" },
  { property: "og:url", content: BA_SHARE.url },
  { property: "og:site_name", content: "Astralnaut Studios" },
  { property: "og:image", content: BA_SHARE.image },
  { property: "og:image:secure_url", content: BA_SHARE.image },
  { property: "og:image:type", content: "image/jpeg" },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { property: "og:image:alt", content: BA_SHARE.imageAlt },
  { property: "og:video", content: BA_SHARE.video },
  { property: "og:video:secure_url", content: BA_SHARE.video },
  { property: "og:video:type", content: "video/mp4" },
  { property: "og:video:width", content: "1200" },
  { property: "og:video:height", content: "630" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: BA_SHARE.title },
  { name: "twitter:description", content: BA_SHARE.description },
  { name: "twitter:image", content: BA_SHARE.image },
  { name: "twitter:image:alt", content: BA_SHARE.imageAlt },
];
