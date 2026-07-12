import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { RightsNotice } from "@/components/rights-notice";
import daLogo from "@/assets/darker-ages-logo.png";
import daCoverAsset from "@/assets/darker-ages-issue-1-cover.png.asset.json";
import { SITE_URL, absUrl } from "@/lib/seo";

const DA_COVER_URL = absUrl(daCoverAsset.url);

export const Route = createFileRoute("/darker-ages")({
  head: () => ({
    meta: [
      { title: "Darker Ages — Coming October 2026 · Real World Comics" },
      { name: "description", content: "Dark medieval fantasy from the Astralnaut Studios imprint of Streamwalkers Corporation. After the protective magic of the old age has died, what was held back is loose. Launches October 2026." },
      { property: "og:title", content: "Darker Ages — Coming October 2026" },
      { property: "og:description", content: "Dark medieval fantasy. Launches October 2026." },
      { property: "og:url", content: `${SITE_URL}/darker-ages` },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: "Real World Comics — Astralnaut Studios" },
      { property: "og:image", content: DA_COVER_URL },
      { property: "og:image:alt", content: "Darker Ages Issue #1 — The Astral Temptation cover" },
      { property: "article:author", content: "Phil Russell" },
      { property: "article:publisher", content: "Streamwalkers Corporation" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: DA_COVER_URL },
      { name: "twitter:image:alt", content: "Darker Ages Issue #1 — The Astral Temptation cover" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/darker-ages` }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ComicSeries",
        name: "Darker Ages",
        author: { "@type": "Person", name: "Phil Russell" },
        publisher: { "@type": "Organization", name: "Streamwalkers Corporation" },
        copyrightHolder: { "@type": "Organization", name: "Streamwalkers Corporation" },
        copyrightYear: 2026,
        copyrightNotice: "© 2026 Streamwalkers Corporation. All rights reserved.",
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
        <figure className="mx-auto mt-12 max-w-[420px]">
          <img
            src={daCoverAsset.url}
            alt="Darker Ages Issue #1 — The Astral Temptation cover"
            className="w-full rounded-lg shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
            loading="eager"
          />
          <figcaption className="mt-3 text-sm text-[var(--mute)]">Issue #1 — “The Astral Temptation”</figcaption>
        </figure>
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
