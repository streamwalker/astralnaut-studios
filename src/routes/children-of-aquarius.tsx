import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { getSeriesBundle, getIssueBundle } from "@/lib/public.functions";
import { pageUrl } from "@/lib/storage";
import coaLogo from "@/assets/children-of-aquarius-logo.png";
import castMichael from "@/assets/coa-cast/michael.png";
import castLila from "@/assets/coa-cast/lila.png";
import castJon from "@/assets/coa-cast/jon-monarch.png";
import castBlaire from "@/assets/coa-cast/father-blaire.png";
import castBurke from "@/assets/coa-cast/edmund-burke.png";

const CAST = [
  { img: castMichael, name: "Michael", role: "Heart of Christ", blurb: "A thoughtful Brooklyn 15-year-old, fiercely loyal and driven by justice." },
  { img: castLila, name: "Lila", role: "Michael's Friend", blurb: "Sharp-witted voice of reason. Skeptical, ambitious, three steps ahead." },
  { img: castJon, name: "Jon Monarch", role: "Cybernetic Operative", blurb: "Resurrected after 25,000 years. Shifts timelines and realities at will." },
  { img: castBlaire, name: "Father Alistaire Blaire", role: "Protector of the Trinity", blurb: "Excommunicated immortal priest guarding the Christ Child across centuries." },
  { img: castBurke, name: "Edmund Burke", role: "Strategic Operative", blurb: "Tactical, composed, and lethal in a bespoke three-piece suit." },
];

export const Route = createFileRoute("/children-of-aquarius")({
  loader: async () => {
    const bundle = await getSeriesBundle({ data: { slug: "children-of-aquarius" } });
    if (!bundle) throw notFound();
    const firstIssue = bundle.issues[0];
    const issueBundle = firstIssue ? await getIssueBundle({ data: { slug: firstIssue.slug } }) : null;
    return { bundle, issueBundle };
  },
  head: () => ({
    meta: [
      { title: "Children of Aquarius — Issue 1 · Real World Comics" },
      { name: "description", content: "A priest gifts three young humans the powers of Christ to find and protect the Christ child of the Aquarian Age. First 9 pages free." },
      { property: "og:title", content: "Children of Aquarius — Issue 1" },
      { property: "og:description", content: "Esoteric thriller. The Age Begins · The Child Awakens." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/children-of-aquarius" },
      { property: "og:image", content: "https://xcznyhkaispxnjrvhdnc.supabase.co/storage/v1/object/public/comic-pages/children-of-aquarius/issue-1/page-0.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/children-of-aquarius" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Book",
        name: "Children of Aquarius",
        headline: "Children of Aquarius — Issue 1",
        bookFormat: "https://schema.org/EBook",
        genre: "Esoteric thriller",
        image: "https://xcznyhkaispxnjrvhdnc.supabase.co/storage/v1/object/public/comic-pages/children-of-aquarius/issue-1/page-0.png",
        author: { "@type": "Organization", name: "Astralnaut Studios" },
        publisher: { "@type": "Organization", name: "Astralnaut Studios" },
        url: "https://astralnautstudios.com/children-of-aquarius",
        description: "A priest gifts three young humans the powers of Christ to find and protect the Christ child of the Aquarian Age.",
      }),
    }],
  }),
  component: COAPage,
});

function COAPage() {
  const { bundle, issueBundle } = Route.useLoaderData();
  const issue = issueBundle?.issue;
  const pages = issueBundle?.pages ?? [];
  const drops = issueBundle?.drops ?? [];
  const cover = pageUrl(issue?.cover_path);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <Link to="/" className="text-xs text-[var(--mute)] hover:text-[var(--neon)]">← Back to slate</Link>

        <section className="mt-6 grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div className="aspect-[1054/1491] overflow-hidden rounded-2xl" style={{ boxShadow: "var(--shadow-hero)", background: "var(--gradient-panel)" }}>
            {cover ? <img src={cover} alt="Children of Aquarius cover" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center p-10 text-center"><div><div className="eyebrow">Cover forthcoming</div><div className="mt-3 text-3xl font-black">Children of Aquarius</div><div className="mt-1 text-[var(--ink2)]">Issue 1 · The Age Begins</div></div></div>}
          </div>
          <div>
            <div className="eyebrow">{bundle.series.genre}</div>
            <img src={coaLogo} alt="Children of Aquarius" className="mt-3 max-h-32 w-auto" />
            <h1 className="sr-only">Children of Aquarius</h1>
            <div className="mt-2 font-mono text-sm text-[var(--mute)]">ISSUE 1 · {issue?.subtitle ?? issue?.title}</div>
            <p className="mt-5 max-w-xl text-[var(--ink2)]">{bundle.series.logline}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {issue && <Link to="/reader/$series/$issue" params={{ series: bundle.series.slug, issue: String(issue.issue_number) }} className="btn-cta">▶ Read first 9 pages free</Link>}
              <Link to="/pricing" className="btn-ghost">Unlock all 24 pages</Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6">
              <KV label="Free pages" value="9" />
              <KV label="Paid pages" value="15" />
              <KV label="Cadence" value="3/wk" />
            </div>
          </div>
        </section>

        {/* Page grid */}
        <section className="mt-20">
          <div className="eyebrow">Issue 1 · Page index</div>
          <h2 className="mt-2 text-3xl font-black">Pages</h2>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-12">
            {Array.from({ length: 24 }).map((_, idx) => {
              const n = idx + 1;
              const isFree = n <= 9;
              const found = pages.find((p: typeof pages[number]) => p.page_number === n);
              const thumb = pageUrl(found?.image_path);
              return (
                <div key={n} className="card-rwc relative aspect-[3/4] overflow-hidden">
                  {thumb && isFree ? <img src={thumb} alt={`Page ${n}`} className="h-full w-full object-cover opacity-90" /> : <div className="flex h-full items-center justify-center text-xs text-[var(--mute)]">Locked</div>}
                  <div className="absolute bottom-1 left-1 font-mono text-[10px]" style={{ color: isFree ? "var(--neon)" : "var(--mute)" }}>{isFree ? "FREE" : "LOCKED"}</div>
                  <div className="absolute right-1 top-1 font-mono text-[10px] text-[var(--ink2)]">#{n}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Cast */}
        <section className="mt-20">
          <div className="eyebrow">Dramatis personae</div>
          <h2 className="mt-2 text-3xl font-black">Cast</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CAST.map((c) => (
              <article key={c.name} className="card-rwc group overflow-hidden rounded-xl border" style={{ borderColor: "var(--border-line)" }}>
                <div className="aspect-[16/10] overflow-hidden bg-black">
                  <img src={c.img} alt={`${c.name} — ${c.role}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                </div>
                <div className="p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[2px] text-[var(--gold)]">{c.role}</div>
                  <h3 className="mt-1 text-xl font-black text-white">{c.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{c.blurb}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Drop schedule */}
        {drops.length > 0 && (
          <section className="mt-20">
            <div className="eyebrow">Paid release schedule</div>
            <h2 className="mt-2 text-3xl font-black">Three pages a week. Five weeks.</h2>
            <div className="mt-6 overflow-hidden rounded-xl border" style={{ borderColor: "var(--border-line)" }}>
              <table className="w-full font-mono text-sm">
                <thead style={{ background: "var(--bg-panel)" }}>
                  <tr className="text-left">
                    <th className="px-4 py-3 text-[var(--mute)]">Week</th>
                    <th className="px-4 py-3 text-[var(--mute)]">Patron · Tue</th>
                    <th className="px-4 py-3 text-[var(--mute)]">Reader · Thu</th>
                    <th className="px-4 py-3 text-[var(--mute)]">Pages</th>
                  </tr>
                </thead>
                <tbody>
                  {drops.map((d: typeof drops[number]) => (
                    <tr key={d.id} className="border-t" style={{ borderColor: "var(--border-line)" }}>
                      <td className="px-4 py-3 font-bold text-[var(--gold)]">W{d.week}</td>
                      <td className="px-4 py-3">{d.patron_date}</td>
                      <td className="px-4 py-3">{d.reader_date}</td>
                      <td className="px-4 py-3 text-[var(--neon)]">{d.pages.join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (<div><div className="font-mono text-2xl font-black text-[var(--gold)]">{value}</div><div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--mute)]">{label}</div></div>);
}
