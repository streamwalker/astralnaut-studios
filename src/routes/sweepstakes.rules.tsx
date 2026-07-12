import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { OG_DEFAULT_IMAGE, OG_DEFAULT_ALT, OG_DEFAULT_WIDTH, OG_DEFAULT_HEIGHT, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/raffle/rules")({
  head: () => ({
    meta: [
      { title: "Official sweepstakes rules — Real World Comics" },
      {
        name: "description",
        content:
          "Official rules for the Real World Comics weekly subscriber sweepstakes, including the no-purchase-necessary free entry method.",
      },
      { property: "og:title", content: "Official sweepstakes rules — Real World Comics" },
      { property: "og:description", content: "Weekly subscriber sweepstakes — official rules and free entry method." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/sweepstakes/rules` },
      { property: "og:image", content: OG_DEFAULT_IMAGE },
      { property: "og:image:width", content: OG_DEFAULT_WIDTH },
      { property: "og:image:height", content: OG_DEFAULT_HEIGHT },
      { property: "og:image:alt", content: OG_DEFAULT_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_DEFAULT_IMAGE },
      { name: "twitter:image:alt", content: OG_DEFAULT_ALT },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/sweepstakes/rules` }],
  }),
  component: RulesPage,
});

function RulesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="eyebrow">Sweepstakes</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Official sweepstakes rules</h1>
        <p className="mt-2 text-sm text-[var(--mute)]">
          Placeholder draft. Replace with your reviewed legal copy before launch.
        </p>

        <div className="prose prose-invert mt-8 max-w-none text-[var(--ink2)]">
          <p><strong>NO PURCHASE NECESSARY TO ENTER OR WIN. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING.</strong></p>

          <h2 className="mt-8 text-xl font-bold text-[var(--ink)]">1. Sponsor</h2>
          <p>Streamwalkers Corporation ("Sponsor"). Operated under the Astralnaut Studios imprint.</p>

          <h2 className="mt-6 text-xl font-bold text-[var(--ink)]">2. Eligibility</h2>
          <p>Open to legal residents of the United States who are 18 years of age or older at the time of entry. Void where prohibited by law. Subject to all applicable federal, state, and local laws and regulations.</p>

          <h2 className="mt-6 text-xl font-bold text-[var(--ink)]">3. Entry period</h2>
          <p>Entries are accepted on a rolling weekly basis. Each entry period runs Monday 00:00 through Sunday 23:59 Pacific Time.</p>

          <h2 className="mt-6 text-xl font-bold text-[var(--ink)]">4. How to enter</h2>
          <ul className="list-disc pl-6">
            <li><strong>Free method (AMOE):</strong> Visit <Link to="/sweepstakes/free-entry" className="underline">/sweepstakes/free-entry</Link> and submit one entry per email address per week.</li>
            <li><strong>Subscriber method:</strong> Active paid subscribers receive automatic weekly entries: Reader tier 1 entry, Initiate tier 3 entries, Patron tier 10 entries.</li>
          </ul>
          <p>Both methods have equal odds of winning per individual entry.</p>

          <h2 className="mt-6 text-xl font-bold text-[var(--ink)]">5. Prize</h2>
          <p>Prize varies by week. Approximate retail value disclosed at the time of each drawing. No cash equivalent. Non-transferable.</p>

          <h2 className="mt-6 text-xl font-bold text-[var(--ink)]">6. Drawing</h2>
          <p>One winner per weekly entry period selected at random from all eligible entries. Winner notified via email within 7 days.</p>

          <h2 className="mt-6 text-xl font-bold text-[var(--ink)]">7. Privacy</h2>
          <p>Entry information is collected and used only to administer the sweepstakes. See our privacy policy.</p>

          <h2 className="mt-6 text-xl font-bold text-[var(--ink)]">8. Disclaimer</h2>
          <p>This is a placeholder document. Final official rules must be reviewed by qualified counsel before any prize is awarded.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
