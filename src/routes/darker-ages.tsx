import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { RightsNotice } from "@/components/rights-notice";
import daLogo from "@/assets/darker-ages-logo.png";

export const Route = createFileRoute("/darker-ages")({
  head: () => ({
    meta: [
      { title: "Darker Ages — Coming October 2026 · Real World Comics" },
      { name: "description", content: "Dark medieval fantasy from the Astralnaut Studios imprint of Real World Comics, LLC. After the protective magic of the old age has died, what was held back is loose. Launches October 2026." },
      { property: "og:title", content: "Darker Ages — Coming October 2026" },
      { property: "og:description", content: "Dark medieval fantasy. Launches October 2026." },
      { property: "og:url", content: "/darker-ages" },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: "Real World Comics — Astralnaut Studios" },
      { property: "article:author", content: "Phil Russell" },
      { property: "article:publisher", content: "Real World Comics, LLC" },
      { property: "og:image:alt", content: "Darker Ages — Real World Comics" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/darker-ages" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ComicSeries",
        name: "Darker Ages",
        author: { "@type": "Person", name: "Phil Russell" },
        publisher: { "@type": "Organization", name: "Real World Comics, LLC" },
        copyrightHolder: { "@type": "Organization", name: "Real World Comics, LLC" },
        copyrightYear: 2026,
        copyrightNotice: "© 2026 Real World Comics, LLC. All rights reserved.",
        genre: "Dark fantasy",
        creativeWorkStatus: "Pre-launch — launches October 2026",
        url: "https://astralnautstudios.com/darker-ages",
      }),
    }],
  }),
  component: DarkerAges,
});

function DarkerAges() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-20 text-center">
        <Link to="/" className="text-xs text-[var(--mute)] hover:text-[var(--neon)]">← Back to slate</Link>
        <div className="mt-12 eyebrow">October 2026 · Issue 1</div>
        <img src={daLogo} alt="Darker Ages" className="mx-auto mt-6 max-h-48 w-auto" />
        <h1 className="sr-only">Darker Ages</h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-[var(--ink2)]">After the protective magic of the old age has died, what was held back is loose.</p>
        <div className="mx-auto mt-10 max-w-md card-rwc p-8">
          <div className="eyebrow">Pre-launch</div>
          <p className="mt-3 text-[var(--ink2)]">First-act pages drop October 2026. Subscribers get day-one access on the tier-staggered schedule.</p>
          <Link to="/pricing" className="btn-cta mt-6 inline-flex">Reserve your tier</Link>
        </div>
        <div className="mx-auto mt-10 max-w-2xl text-left">
          <RightsNotice variant="series" title="Darker Ages" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
