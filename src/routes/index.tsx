import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { SeriesCard } from "@/components/series-card";
import { MilestoneStrip } from "@/components/milestone-strip";
import { ClosingBand } from "@/components/home/ClosingBand";
import { HeroRotator } from "@/components/home/HeroRotator";
import { HomePricingStrip } from "@/components/home/PricingStrip";
import { listSeries, getMilestone, getSiteCopy } from "@/lib/public.functions";
import { useSubscriberCount } from "@/hooks/useSubscriberCount";
import { useInView } from "@/hooks/useInView";
import { CoverFan } from "@/components/cover-fan";
import { CountUp } from "@/components/count-up";
import { track } from "@/lib/analytics";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Real World Comics — The next page only drops here" },
      { name: "description", content: "Three serialized comic properties from Astralnaut Studios. Motion-enhanced art, weekly drops, subscriber-only canon voting, real prizes." },
      { property: "og:title", content: "Real World Comics — Astralnaut Studios" },
      { property: "og:description", content: "The next page only drops here. Five new pages a week. Built for readers, not pirates." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Astralnaut Studios",
        url: "/",
        sameAs: [],
        founder: { "@type": "Person", name: "Phil" },
      }),
    }],
  }),
  component: Home,
});

function Home() {
  const seriesFn = useServerFn(listSeries);
  const milestoneFn = useServerFn(getMilestone);
  const copyFn = useServerFn(getSiteCopy);
  const { data: series = [] } = useQuery({ queryKey: ["series"], queryFn: () => seriesFn({}) });
  const { data: milestone } = useQuery({ queryKey: ["milestone"], queryFn: () => milestoneFn({}) });
  const { data: copy = {} } = useQuery({ queryKey: ["copy"], queryFn: () => copyFn({}) });
  const { displayCount, pagesPublished, seriesLive } = useSubscriberCount();

  return (
    <>
      <SiteHeader />
      <main>


        {/* Cinematic hero rotator — Marvel.com pattern. Slot 1 carries the BA teaser video. */}
        <HeroRotator />

        {/* Stat band + ambient CoverFan — used to live in the hero, now a chapter break under it. */}
        <RevealSection className="relative" innerClassName="mx-auto max-w-7xl px-6 py-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="eyebrow flex items-center gap-2">
                <span aria-hidden>⚡</span>
                {copy["home.hero.eyebrow"] ?? "New episodes every week · Netflix for comics"}
              </div>
              <h2 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
                {copy["home.hero.title"] ?? "The next page only drops here."}
              </h2>
              <p className="mt-5 max-w-xl text-lg text-[var(--ink2)]">
                Five new pages a week. Motion-enhanced art. Creator commentary. Subscriber-only votes that change the canon. Real prizes for real readers —{" "}
                <span style={{ color: "var(--gold)" }} className="font-semibold">PlayStation 5 unlocks at 1,000 subscribers.</span>
              </p>

              <div
                className="mt-7 inline-flex max-w-xl items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "rgba(34,211,255,0.06)", border: "1px solid rgba(34,211,255,0.3)" }}
              >
                <span className="text-2xl" aria-hidden>📺</span>
                <div>
                  <div className="text-xs font-black uppercase tracking-[3px]" style={{ color: "var(--neon)" }}>
                    9.5 pages of every issue · free
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--ink2)]">
                    The full first act + title page · free for everyone · no signup required.
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/pricing"
                  className="btn-cta"
                  onClick={() => track("hero_cta_click", { target: "pricing" })}
                >
                  {copy["home.cta.secondary"] ?? "See pricing"}
                </Link>
                <a
                  href="#slate"
                  className="btn-ghost"
                  onClick={() => track("hero_cta_click", { target: "browse_slate" })}
                >
                  Browse the slate
                </a>
              </div>

              <div className="mt-10 grid max-w-md grid-cols-3 gap-8">
                {displayCount !== null ? (
                  <>
                    <Stat label="Subscribers" value={<CountUp value={displayCount} />} />
                    <Stat label="Series live" value={String(seriesLive)} />
                    <Stat label="Pages so far" value={String(pagesPublished)} />
                  </>
                ) : (
                  <>
                    <Stat label="Pages published" value={String(pagesPublished)} />
                    <Stat label="Series live" value={String(seriesLive)} />
                    <Stat label="New pages / week" value="5" />
                  </>
                )}
              </div>
            </div>

            <div className="relative">
              <CoverFan />
            </div>
          </div>
        </RevealSection>

        {/* Milestone */}
        {milestone && (
          <MilestoneStrip
            name={milestone.name}
            ends_at={milestone.ends_at}
            rewards={(milestone.rewards as { at: number; reward: string }[]) ?? []}
          />
        )}

        {/* Series shelf — banded section. */}
        <section
          id="slate"
          className="relative scroll-mt-24"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, rgba(34,211,255,0.08), transparent 55%), radial-gradient(120% 80% at 100% 100%, rgba(160,64,255,0.08), transparent 55%)",
            borderTop: "1px solid var(--border-line)",
            borderBottom: "1px solid var(--border-line)",
          }}
        >
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-black md:text-4xl">The slate</h2>
              <div className="eyebrow">Three properties · One disclosure-era universe</div>
            </div>
            <div className="mt-8 flex flex-col gap-6">
              {series.map((s) => <SeriesCard key={s.id} {...s} />)}
            </div>
          </div>
        </section>

        {/* Pricing strip */}
        <HomePricingStrip interval="monthly" />

        {/* Why subscribe — banded section. */}
        <section
          className="relative"
          style={{
            background:
              "radial-gradient(120% 80% at 100% 0%, rgba(244,201,93,0.08), transparent 55%), linear-gradient(180deg, transparent, rgba(0,0,0,0.25))",
            borderTop: "1px solid var(--border-line)",
          }}
        >
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="eyebrow">Why subscribe</div>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">Pirated PNGs can't give you this.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <Pillar title="Motion + sound" body="Per-page CSS animations layered onto the static art. Lightning pulses, hologram glow, debris fields." />
              <Pillar title="Tier-staggered drops" body="Patron Tuesday. Initiate Wednesday. Reader Thursday. Always 48 hours ahead at the top tier." />
              <Pillar title="Canon voting" body="Subscribers vote on canon-altering decisions. Your read literally changes the story." />
              <Pillar title="Raffles + cameos" body="Active subscription weeks = raffle entries. Patron tier unlocks cameo eligibility." />
            </div>
          </div>
        </section>

        {/* Closing conversion band */}
        <ClosingBand />
      </main>
      <SiteFooter />
    </>
  );
}

function RevealSection({
  className = "",
  innerClassName = "",
  children,
}: {
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <section ref={ref} className={`${className} reveal ${inView ? "is-visible" : ""}`}>
      <div className={innerClassName}>{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-3xl font-black" style={{ color: "var(--gold)" }}>{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[3px] text-[var(--mute)]">{label}</div>
    </div>
  );
}
function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="card-rwc p-5 transition-transform duration-300 hover:-translate-y-1">
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm text-[var(--ink2)]">{body}</p>
    </div>
  );
}
