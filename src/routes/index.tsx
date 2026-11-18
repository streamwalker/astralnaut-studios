import { createFileRoute } from "@tanstack/react-router";
import { JourneyHome } from "@/components/space-journey/JourneyHome";
import {
  OG_DEFAULT_IMAGE,
  OG_DEFAULT_ALT,
  OG_DEFAULT_WIDTH,
  OG_DEFAULT_HEIGHT,
  SITE_URL,
} from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Astralnaut Studios — The next page only drops here" },
      {
        name: "description",
        content:
          "Three serialized comic properties from Astralnaut Studios. Motion-enhanced art, weekly drops, subscriber-only canon voting, real prizes.",
      },
      { property: "og:title", content: "Astralnaut Studios" },
      {
        property: "og:description",
        content:
          "Astralnaut Studios and Real World Comics are imprints of Streamwalkers Corporation",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: OG_DEFAULT_IMAGE },
      { property: "og:image:width", content: OG_DEFAULT_WIDTH },
      { property: "og:image:height", content: OG_DEFAULT_HEIGHT },
      { property: "og:image:alt", content: OG_DEFAULT_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_DEFAULT_IMAGE },
      { name: "twitter:image:alt", content: OG_DEFAULT_ALT },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Astralnaut Studios",
          url: SITE_URL,
          sameAs: [],
          founder: { "@type": "Person", name: "Phil" },
        }),
      },
    ],
  }),
  component: JourneyHome,
});
