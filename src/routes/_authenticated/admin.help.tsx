import { createFileRoute, notFound } from "@tanstack/react-router";
import { HelpLayout } from "@/components/help/HelpLayout";
import { ArticleHubLanding } from "@/components/help/ArticleView";
import { adminHelp } from "@/content/help/admin";

export const Route = createFileRoute("/_authenticated/admin/help")({
  head: () => ({
    meta: [
      { title: "Admin Help Center" },
      { name: "description", content: "Operational guides for running Astralnaut Studios." },
      { property: "og:title", content: "Admin Help Center" },
      { property: "og:description", content: "Operational guides for running the platform." },
    ],
  }),
  component: AdminHelpHub,
  notFoundComponent: () => {
    throw notFound();
  },
});

function AdminHelpHub() {
  return (
    <HelpLayout track={adminHelp} coursePath="/admin/learn">
      <ArticleHubLanding track={adminHelp} />
    </HelpLayout>
  );
}
