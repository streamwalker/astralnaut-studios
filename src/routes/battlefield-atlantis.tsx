import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { getSeriesBundle, getIssueBundle } from "@/lib/public.functions";
import { pageUrl } from "@/lib/storage";
import baLogo from "@/assets/battlefield-atlantis-logo.png";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/battlefield-atlantis")({
  loader: async () => {
    const bundle = await getSeriesBundle({ data: { slug: "battlefield-atlantis" } });
    if (!bundle) throw notFound();
    const firstIssue = bundle.issues[0];
    const issueBundle = firstIssue ? await getIssueBundle({ data: { slug: firstIssue.slug } }) : null;
    return { bundle, issueBundle };
  },
  head: () => ({
    meta: [
      { title: "Battlefield Atlantis — Issue 1 · Real World Comics" },
      { name: "description", content: "Twenty-five thousand years before the present, Saantris Station is destroyed. The Tri-Planetary Coalition splits. Read the first 9.5 pages free." },
      { property: "og:title", content: "Battlefield Atlantis — Issue 1" },
      { property: "og:description", content: "Hard sci-fi space opera. First 9.5 pages free." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/battlefield-atlantis" },
      { property: "og:image", content: "https://xcznyhkaispxnjrvhdnc.supabase.co/storage/v1/object/public/comic-pages/battlefield-atlantis/issue-1/variant-cover-m.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://xcznyhkaispxnjrvhdnc.supabase.co/storage/v1/object/public/comic-pages/battlefield-atlantis/issue-1/variant-cover-m.png" },
    ],
    links: [{ rel: "canonical", href: "/battlefield-atlantis" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Book",
        name: "Battlefield Atlantis",
        headline: "Battlefield Atlantis — Issue 1",
        bookFormat: "https://schema.org/EBook",
        genre: "Hard sci-fi space opera",
        image: "https://xcznyhkaispxnjrvhdnc.supabase.co/storage/v1/object/public/comic-pages/battlefield-atlantis/issue-1/variant-cover-m.png",
        author: { "@type": "Organization", name: "Astralnaut Studios" },
        publisher: { "@type": "Organization", name: "Astralnaut Studios" },
        url: "https://astralnautstudios.com/battlefield-atlantis",
        description: "Twenty-five thousand years before the present, Saantris Station is destroyed. The Tri-Planetary Coalition splits.",
      }),
    }],
  }),
  component: BAPage,
});

function BAPage() {
  const { bundle, issueBundle } = Route.useLoaderData();
  const issue = issueBundle?.issue;
  const pages = issueBundle?.pages ?? [];
  const characters = bundle.characters;
  const factions = bundle.factions;
  const cover = pageUrl(issue?.cover_path);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <Link to="/" className="text-xs text-[var(--mute)] hover:text-[var(--neon)]">← Back to slate</Link>

        {/* Hero */}
        <section className="mt-6 grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div className="aspect-[1054/1491] overflow-hidden rounded-2xl" style={{ boxShadow: "var(--shadow-hero)", background: "var(--gradient-panel)" }}>
            {cover ? <img src={cover} alt="Battlefield Atlantis cover" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center p-10 text-center"><div><div className="eyebrow">Cover forthcoming</div><div className="mt-3 text-3xl font-black">Battlefield Atlantis</div><div className="mt-1 text-[var(--ink2)]">Issue 1 · Only One Will Rule</div></div></div>}
          </div>
          <div>
            <div className="eyebrow">{bundle.series.genre}</div>
            <img src={baLogo} alt="Battlefield Atlantis" className="mt-3 max-h-32 w-auto" />
            <h1 className="sr-only">Battlefield Atlantis</h1>
            <div className="mt-2 font-mono text-sm text-[var(--mute)]">ISSUE 1 · {issue?.title}</div>
            <p className="mt-5 max-w-xl text-[var(--ink2)]">{bundle.series.logline}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {issue && <Link to="/reader/$series/$issue" params={{ series: bundle.series.slug, issue: String(issue.issue_number) }} className="btn-cta">▶ Read first 9.5 pages free</Link>}
              <Link to="/pricing" className="btn-ghost">Unlock all 20 pages</Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6">
              <KV label="Free pages" value={String(issue?.free_pages ?? "9.5")} />
              <KV label="Paid pages" value={String(issue?.paid_pages ?? "11")} />
              <KV label="Drop cadence" value="4/wk" />
            </div>
          </div>
        </section>

        {/* Page grid */}
        <section className="mt-20">
          <div className="eyebrow">Issue 1 · Page index</div>
          <h2 className="mt-2 text-3xl font-black">Pages</h2>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
            {Array.from({ length: Math.ceil(Number(issue?.total_pages ?? 20)) }).map((_, idx) => {
              const n = idx + 1;
              const isFree = n <= Number(issue?.free_pages ?? 9.5);
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

        {/* Factions */}
        {factions.length > 0 && (
          <section className="mt-20">
            <div className="eyebrow">Factions</div>
            <h2 className="mt-2 text-3xl font-black">Two worlds. One coalition.</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {factions.map((f: typeof factions[number]) => (
                <div key={f.id} className="card-rwc p-6">
                  <div className="eyebrow" style={{ color: "var(--neon)" }}>{f.acro}</div>
                  <h3 className="mt-2 text-xl font-black">{f.name}</h3>
                  <p className="mt-2 text-[var(--ink2)]">{f.summary}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Characters */}
        {characters.length > 0 && (
          <section className="mt-20">
            <div className="eyebrow">Meet the cast</div>
            <h2 className="mt-2 text-3xl font-black">Characters</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
              {characters.map((c: typeof characters[number]) => {
                const portrait = pageUrl(c.portrait_path);
                return (
                  <Dialog key={c.id}>
                    <DialogTrigger asChild>
                      <button type="button" aria-label={`View ${c.name} details`} className="card-rwc group block w-full overflow-hidden text-left transition hover:ring-2 hover:ring-[var(--neon)] focus:outline-none focus:ring-2 focus:ring-[var(--neon)] cursor-pointer">
                        <div className="relative aspect-[3/4] bg-[var(--bg2)]">
                          {portrait ? <img src={portrait} alt={c.name} className="h-full w-full object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-[var(--mute)]">Portrait forthcoming</div>}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] font-bold uppercase tracking-[2px] text-[var(--neon)] opacity-0 transition group-hover:opacity-100">Click to expand</div>
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-black">{c.name}</div>
                          <div className="font-mono text-[10px] text-[var(--mute)]">{c.role}</div>
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl overflow-hidden p-0">
                      <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
                        <div className="aspect-[3/4] bg-[var(--bg2)] md:aspect-auto">
                          {portrait && <img src={portrait} alt={c.name} className="h-full w-full object-cover" />}
                        </div>
                        <div className="p-6 md:p-8">
                          <div className="eyebrow" style={{ color: "var(--neon)" }}>{c.faction}</div>
                          <DialogTitle className="mt-2 text-2xl font-black md:text-3xl">{c.name}</DialogTitle>
                          <div className="mt-1 font-mono text-xs text-[var(--mute)]">{c.role}</div>
                          {c.transmedium && <div className="mt-3 inline-block rounded border border-[var(--gold)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">Transmedium</div>}
                          {c.short_description && <DialogDescription className="mt-4 text-[var(--ink)]">{c.short_description}</DialogDescription>}
                          {c.bio && <p className="mt-4 text-sm leading-relaxed text-[var(--ink2)]">{c.bio}</p>}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-black text-[var(--gold)]">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--mute)]">{label}</div>
    </div>
  );
}
