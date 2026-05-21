import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/industry")({
  head: () => ({
    meta: [
      { title: "Adaptation Rights — Astralnaut Studios" },
      { name: "description", content: "Three independently-owned IP properties available for film, TV, and game adaptation. Sole rights holder: Astralnaut Studios LLC. NDA-ready." },
      { property: "og:title", content: "Astralnaut Studios — Adaptation Rights" },
      { property: "og:description", content: "Three-property slate. UAP disclosure-era narratives. 100% owned. NDA-ready." },
      { property: "og:url", content: "/industry" },
    ],
    links: [{ rel: "canonical", href: "/industry" }],
  }),
  component: Industry,
});

const properties = [
  { name: "Battlefield Atlantis", genre: "Hard sci-fi space opera", comps: "Battlestar Galactica · Stargate · Foundation · Dune", lanes: "Live-action film/TV · prestige limited series · AAA game" },
  { name: "Children of Aquarius", genre: "Esoteric thriller / religious mysticism", comps: "The Da Vinci Code · Project Hail Mary · Legion", lanes: "Premium streaming drama · feature trilogy" },
  { name: "Darker Ages", genre: "Dark medieval fantasy", comps: "The Witcher · Berserk · The Last Kingdom", lanes: "Animated series · live-action drama · interactive fiction" },
];

export default function Industry() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="eyebrow">Adaptation rights · NDA-ready</div>
        <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">Three properties.<br />One disclosure-era slate.</h1>
        <p className="mt-6 max-w-3xl text-lg text-[var(--ink2)]">
          Astralnaut Studios LLC holds 100% of the rights to three serialized IP properties developed before — and now positioned alongside — the post-2023 UAP disclosure cultural moment. The work was built to anticipate the moment, not exploit it.
        </p>

        <section className="mt-16">
          <div className="eyebrow">The slate</div>
          <div className="mt-6 space-y-4">
            {properties.map((p) => (
              <div key={p.name} className="card-rwc p-7">
                <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                  <div>
                    <h2 className="text-2xl font-black">{p.name}</h2>
                    <div className="mt-1 font-mono text-xs text-[var(--mute)]">{p.genre}</div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div><span className="eyebrow" style={{ color: "var(--gold)" }}>Comp titles</span><div className="mt-1 text-[var(--ink2)]">{p.comps}</div></div>
                    <div><span className="eyebrow" style={{ color: "var(--neon)" }}>Adaptation lanes</span><div className="mt-1 text-[var(--ink2)]">{p.lanes}</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 panel p-8">
          <div className="eyebrow">IP rights statement</div>
          <h2 className="mt-3 text-2xl font-black">Sole rights holder. Open to option / acquisition.</h2>
          <p className="mt-3 text-[var(--ink2)]">All three properties — Battlefield Atlantis, Children of Aquarius, Darker Ages — are 100% owned by Astralnaut Studios LLC. Trademarks pending. Available for film, television, animation, streaming, video game, and audio drama adaptation. Discussions welcome under NDA.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="mailto:streamwalkersceo@gmail.com?subject=%5BINDUSTRY%20%C2%B7%20ASTRALNAUT%5D%20Adaptation%20inquiry" className="btn-cta">Contact for option/acquisition</a>
            <Link to="/" className="btn-ghost">View consumer platform</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
