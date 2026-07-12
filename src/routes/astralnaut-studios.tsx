import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSeries } from "@/lib/public.functions";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { SeriesCard } from "@/components/series-card";
import { OG_DEFAULT_IMAGE, OG_DEFAULT_ALT, OG_DEFAULT_WIDTH, OG_DEFAULT_HEIGHT, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/astralnaut-studios")({
  head: () => ({
    meta: [
      { title: "Astralnaut Studios — Independent Comics, Built for the Disclosure Era" },
      { name: "description", content: "Astralnaut Studios is the independent comics studio behind Battlefield Atlantis, Children of Aquarius, and Darker Ages. Serialized prestige comics. Adaptation-ready IP." },
      { property: "og:title", content: "Astralnaut Studios — Independent Comics, Built for the Disclosure Era" },
      { property: "og:description", content: "Three serialized properties. Weekly tier-staggered page drops. Adaptation-ready IP." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/astralnaut-studios` },
      { property: "og:image", content: OG_DEFAULT_IMAGE },
      { property: "og:image:width", content: OG_DEFAULT_WIDTH },
      { property: "og:image:height", content: OG_DEFAULT_HEIGHT },
      { property: "og:image:alt", content: OG_DEFAULT_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_DEFAULT_IMAGE },
      { name: "twitter:image:alt", content: OG_DEFAULT_ALT },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/astralnaut-studios` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Astralnaut Studios",
          alternateName: "Astralnaut Studios (imprint of Streamwalkers Corporation)",
          url: "https://astralnautstudios.com",
          sameAs: ["https://realworldcomics.com"],
          parentOrganization: {
            "@type": "Organization",
            name: "Streamwalkers Corporation",
          },
        }),
      },
    ],
  }),
  component: StudioPage,
});

const PILLARS = [
  { num: "01", title: "Cadence discipline", body: "Weekly tier-staggered page drops. Patrons Tuesday, Initiates Wednesday, Readers Thursday." },
  { num: "02", title: "Cultural alignment", body: "Developed before the 2023 UAP disclosure cultural moment. Battlefield Atlantis uses the Pentagon's official transmedium terminology." },
  { num: "03", title: "Adaptation-ready IP", body: "Every property is structured for film, television, animation, and games." },
];

const TIERS = [
  {
    day: "Tuesday Drop", tier: "Patron", price: "$24.99/mo",
    perks: [
      "Pages 48 hours before Reader tier",
      "Quarterly signed physical print",
      "Cameo eligibility",
      "Direct creator Discord channel",
      "10 raffle entries per week",
    ],
  },
  {
    day: "Wednesday Drop", tier: "Initiate", price: "$9.99/mo",
    perks: [
      "Pages 24 hours before Reader tier",
      "Numbered digital variant covers",
      "Behind-the-scenes process content",
      "3 raffle entries per week",
    ],
  },
  {
    day: "Thursday Drop", tier: "Reader", price: "$4.99/mo",
    perks: [
      "All series, all 20 pages of every issue",
      "Community forum + voting",
      "Motion-reader edition",
      "1 raffle entry per active reading week",
    ],
  },
];

function StudioPage() {
  const fetchSeries = useServerFn(listSeries);
  const { data: series } = useQuery({ queryKey: ["studio-series"], queryFn: () => fetchSeries() });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="inline-block rounded-full border border-[var(--gold)]/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
          Independent Comics · Built for the Disclosure Era
        </div>
        <h1 className="mt-6 text-5xl font-black leading-[1.05] md:text-6xl">
          Prestige comics, delivered like prestige TV.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--ink2)]">
          Three serialized properties. New pages every week. The first nine pages of every issue are free. The paywall sits on the cliffhanger.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/reader/$series/$issue" params={{ series: "battlefield-atlantis", issue: "1" }} className="btn-cta">Start Reading Free</Link>
          <Link to="/industry" className="rounded-md border border-white/15 px-5 py-3 text-sm font-semibold hover:border-[var(--neon)] hover:text-[var(--neon)]">For Industry</Link>
        </div>
      </section>

      {/* Thesis */}
      <section id="thesis" className="border-y border-white/10 bg-[var(--bg2)] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="eyebrow text-[var(--gold)]">The Studio</div>
          <h2 className="mt-2 text-3xl font-black md:text-4xl">An independent comics studio operating like a streamer.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.num} className="card-rwc p-6">
                <div className="text-3xl font-black text-[var(--neon)]">{p.num}</div>
                <div className="mt-2 text-lg font-bold">{p.title}</div>
                <p className="mt-2 text-sm text-[var(--ink2)]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Properties */}
      <section id="properties" className="mx-auto max-w-6xl px-6 py-16">
        <div className="eyebrow text-[var(--gold)]">The Catalog</div>
        <h2 className="mt-2 text-3xl font-black md:text-4xl">Three properties. Three genres. One canon-aligned moment.</h2>
        <div className="mt-10 flex flex-col gap-6">
          {(series ?? []).map((s) => (
            <SeriesCard key={s.id} {...s} />
          ))}
        </div>
      </section>

      {/* Cadence */}
      <section id="cadence" className="border-y border-white/10 bg-[var(--bg2)] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="eyebrow text-[var(--gold)]">How It Works</div>
          <h2 className="mt-2 text-3xl font-black md:text-4xl">The cold open is free. The cliffhanger is paywalled.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.tier} className="card-rwc flex flex-col p-6">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--mute)]">{t.day}</div>
                <div className="mt-1 text-2xl font-black">{t.tier}</div>
                <div className="mt-1 text-[var(--gold)]">{t.price}</div>
                <ul className="mt-5 space-y-2 text-sm text-[var(--ink2)]">
                  {t.perks.map((p) => <li key={p} className="flex gap-2"><span className="text-[var(--neon)]">▸</span>{p}</li>)}
                </ul>
                <Link to="/pricing" className="mt-auto pt-6 text-sm font-semibold text-[var(--neon)] hover:underline">Subscribe →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry CTA */}
      <section id="industry" className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-black md:text-4xl">Adaptation rights, options, and acquisitions.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-[var(--ink2)]">
          Every property is structured for film, television, animation, and games. Contact the studio for the slate deck.
        </p>
        <div className="mt-7">
          <Link to="/industry" className="btn-cta">For Industry →</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
