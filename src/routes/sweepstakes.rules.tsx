import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { OG_DEFAULT_IMAGE, OG_DEFAULT_ALT, OG_DEFAULT_WIDTH, OG_DEFAULT_HEIGHT, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/sweepstakes/rules")({
  head: () => ({
    meta: [
      { title: "Milestone Sweepstakes — Official Rules · Real World Comics" },
      {
        name: "description",
        content:
          "Official Rules for the Real World Comics Milestone Sweepstakes. Not currently open.",
      },
      { property: "og:title", content: "Milestone Sweepstakes — Official Rules" },
      { property: "og:description", content: "The Milestone Sweepstakes is not currently open. Official Rules will be posted here before any promotion begins." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/sweepstakes/rules` },
      { property: "og:image", content: OG_DEFAULT_IMAGE },
      { property: "og:image:width", content: OG_DEFAULT_WIDTH },
      { property: "og:image:height", content: OG_DEFAULT_HEIGHT },
      { property: "og:image:alt", content: OG_DEFAULT_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_DEFAULT_IMAGE },
      { name: "twitter:image:alt", content: OG_DEFAULT_ALT },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/sweepstakes/rules` }],
  }),
  component: RulesPage,
});

function RulesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-24">
        <div className="eyebrow">Milestone Sweepstakes</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Official Rules</h1>

        <div className="mt-8 rounded-lg border border-[var(--border-line)] bg-black/30 p-6 text-[var(--ink2)]">
          <p className="text-lg font-semibold text-[var(--ink)]">
            The Milestone Sweepstakes is not currently open.
          </p>
          <p className="mt-3 text-sm">
            Official Rules will be posted here before any promotion begins. No sweepstakes
            entries are being accepted at this time.
          </p>
        </div>

        <p className="mt-8 text-xs text-[var(--mute)]">
          NO PURCHASE NECESSARY. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING. Open to legal
          residents of the 50 United States and District of Columbia who are 18 or older. Void where
          prohibited. See Official Rules when posted.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
