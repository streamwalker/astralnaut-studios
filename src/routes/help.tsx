import { createFileRoute, notFound } from "@tanstack/react-router";
import { HelpLayout } from "@/components/help/HelpLayout";
import { ArticleHubLanding } from "@/components/help/ArticleView";
import { readerHelp } from "@/content/help/reader";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — Astralnaut Studios" },
      {
        name: "description",
        content:
          "Searchable guides for readers: account, subscriptions, raffles, patron perks, and more.",
      },
      { property: "og:title", content: "Help Center — Astralnaut Studios" },
      {
        property: "og:description",
        content: "Browse reader guides or take the 5-module training course.",
      },
    ],
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
