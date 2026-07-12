import { createFileRoute, notFound } from "@tanstack/react-router";
import { HelpLayout } from "@/components/help/HelpLayout";
import { ArticleHubLanding } from "@/components/help/ArticleView";
import { readerHelp } from "@/content/help/reader";
import { OG_DEFAULT_IMAGE, OG_DEFAULT_ALT, OG_DEFAULT_WIDTH, OG_DEFAULT_HEIGHT, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — Astralnaut Studios" },
      {
        name: "description",
        content:
          "Searchable guides for readers: account, subscriptions, sweepstakes, patron perks, and more.",
      },
      { property: "og:title", content: "Help Center — Astralnaut Studios" },
      {
        property: "og:description",
        content: "Browse reader guides or take the 5-module training course.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/help` },
      { property: "og:image", content: OG_DEFAULT_IMAGE },
      { property: "og:image:width", content: OG_DEFAULT_WIDTH },
      { property: "og:image:height", content: OG_DEFAULT_HEIGHT },
      { property: "og:image:alt", content: OG_DEFAULT_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_DEFAULT_IMAGE },
      { name: "twitter:image:alt", content: OG_DEFAULT_ALT },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/help` }],
  }),
  component: HelpHub,
  notFoundComponent: () => {
    throw notFound();
  },
});

function HelpHub() {
  return (
    <HelpLayout track={readerHelp} coursePath="/learn">
      <ArticleHubLanding track={readerHelp} />
    </HelpLayout>
  );
}
