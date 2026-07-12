import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { OG_DEFAULT_IMAGE, OG_DEFAULT_ALT, OG_DEFAULT_WIDTH, OG_DEFAULT_HEIGHT, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/sweepstakes/free-entry")({
  head: () => ({
    meta: [
      { title: "Milestone Sweepstakes — Free Entry · Real World Comics" },
      {
        name: "description",
        content:
          "The Milestone Sweepstakes is not currently open. When it opens, free entry (AMOE) will be available here on equal-odds terms.",
      },
      { property: "og:title", content: "Milestone Sweepstakes — Free Entry" },
      { property: "og:description", content: "Not currently open. Free entry (AMOE) will be available here when the promotion begins." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/sweepstakes/free-entry` },
      { property: "og:image", content: OG_DEFAULT_IMAGE },
      { property: "og:image:width", content: OG_DEFAULT_WIDTH },
      { property: "og:image:height", content: OG_DEFAULT_HEIGHT },
      { property: "og:image:alt", content: OG_DEFAULT_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_DEFAULT_IMAGE },
      { name: "twitter:image:alt", content: OG_DEFAULT_ALT },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/sweepstakes/free-entry` }],
  }),
  component: FreeEntryPage,
});

function FreeEntryPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-24">
        <div className="eyebrow">Milestone Sweepstakes</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Free entry</h1>

        <div className="mt-8 rounded-lg border border-[var(--border-line)] bg-black/30 p-6 text-[var(--ink2)]">
          <p className="text-lg font-semibold text-[var(--ink)]">
            The Milestone Sweepstakes is not currently open.
          </p>
          <p className="mt-3 text-sm">
            Free entry (AMOE) will be available here on equal-odds terms when the promotion
            begins. See the{" "}
            <Link to="/sweepstakes/rules" className="underline hover:text-[var(--neon)]">
              Official Rules
            </Link>{" "}
            page for updates.
          </p>
        </div>

        <p className="mt-8 text-xs text-[var(--mute)]">
          NO PURCHASE NECESSARY. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING. Open to legal
          residents of the 50 United States and District of Columbia who are 18 or older. Void where
          prohibited. See Official Rules.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
