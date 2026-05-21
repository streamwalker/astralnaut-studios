import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { SeriesCard } from "@/components/series-card";
import { MilestoneStrip } from "@/components/milestone-strip";
import { listSeries, getMilestone, getSiteCopy } from "@/lib/public.functions";
import { Link } from "@tanstack/react-router";
import { CoverFan } from "@/components/cover-fan";


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

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="eyebrow flex items-center gap-2"><span style={{ color: "var(--neon)" }}>◉</span> {copy["home.hero.eyebrow"] ?? "Netflix for comics"}</div>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
            {copy["home.hero.title"] ?? "The next page only drops here."}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--ink2)]">
            {copy["home.hero.sub"] ?? "Five new pages a week. Motion-enhanced art. Creator commentary. Subscriber-only votes that change the canon."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/battlefield-atlantis" className="btn-cta">▶ {copy["home.cta.primary"] ?? "Read the first act free"}</Link>
            <Link to="/pricing" className="btn-ghost">{copy["home.cta.secondary"] ?? "See pricing"}</Link>
          </div>
          <div className="mt-12 grid max-w-2xl grid-cols-3 gap-8">
            <Stat label="Series live" value="3" />
            <Stat label="Free pages" value="18.5" />
            <Stat label="Subscribers" value={milestone?.current_count?.toLocaleString() ?? "—"} />
          </div>
        </section>

        {/* Milestone */}
        {milestone && (
          <MilestoneStrip
            name={milestone.name}
            current_count={milestone.current_count}
            target_count={milestone.target_count}
            ends_at={milestone.ends_at}
            rewards={(milestone.rewards as { at: number; reward: string }[]) ?? []}
          />
        )}

        {/* Series shelf */}
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-black md:text-4xl">The slate</h2>
            <div className="eyebrow">Three properties · One disclosure-era universe</div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {series.map((s) => <SeriesCard key={s.id} {...s} />)}
          </div>
        </section>

        {/* What piracy can't give */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="eyebrow">Why subscribe</div>
          <h2 className="mt-3 text-3xl font-black md:text-4xl">Pirated PNGs can't give you this.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Pillar title="Motion + sound" body="Per-page CSS animations layered onto the static art. Lightning pulses, hologram glow, debris fields." />
            <Pillar title="Tier-staggered drops" body="Patron Tuesday. Initiate Wednesday. Reader Thursday. Always 48 hours ahead at the top tier." />
            <Pillar title="Canon voting" body="Subscribers vote on canon-altering decisions. Your read literally changes the story." />
            <Pillar title="Raffles + cameos" body="Active subscription weeks = raffle entries. Patron tier unlocks cameo eligibility." />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-3xl font-black" style={{ color: "var(--gold)" }}>{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[3px] text-[var(--mute)]">{label}</div>
    </div>
  );
}
function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="card-rwc p-5">
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm text-[var(--ink2)]">{body}</p>
    </div>
  );
}
