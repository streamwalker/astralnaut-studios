import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { getSeriesBundle, getIssueBundle } from "@/lib/public.functions";
import { pageUrl } from "@/lib/storage";
import baLogo from "@/assets/battlefield-atlantis-logo.png";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lock } from "lucide-react";

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

// Locked-page drop schedule (presentation-only). Pages 10-20.
const DROP_SCHEDULE: Record<number, string> = {
  10: "PATRON TUE · JUL 08",
  11: "PATRON TUE · JUL 08",
  12: "PATRON TUE · JUL 08",
  13: "PATRON TUE · JUL 08",
  14: "PATRON TUE · JUL 15",
  15: "PATRON TUE · JUL 15",
  16: "PATRON TUE · JUL 15",
  17: "PATRON TUE · JUL 15",
  18: "PATRON TUE · JUL 22",
  19: "PATRON TUE · JUL 22",
  20: "PATRON TUE · JUL 22",
};

function BAPage() {
  const { bundle, issueBundle } = Route.useLoaderData();
  const issue = issueBundle?.issue;
  const pages = issueBundle?.pages ?? [];
  const characters = bundle.characters;
  const factions = bundle.factions;
  const cover = pageUrl(issue?.cover_path);
  const readerLink = issue
    ? { to: "/reader/$series/$issue" as const, params: { series: bundle.series.slug, issue: String(issue.issue_number) } }
    : null;

  const totalPages = Math.ceil(Number(issue?.total_pages ?? 20));
  const freeCount = Number(issue?.free_pages ?? 9.5);
  const paidCount = Number(issue?.paid_pages ?? 11);
  const titlePageNum = 9.5;

  // Up to 3 character thumbs for the cover sticker.
  const heroThumbs = characters.slice(0, 3).map((c: typeof characters[number]) => pageUrl(c.portrait_path)).filter(Boolean) as string[];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <Link to="/" className="text-xs text-[var(--mute)] hover:text-[var(--neon)]">← Back to slate</Link>

        {/* ============ HERO ============ */}
        <section className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          {/* Cover plate */}
          <div className="relative aspect-[1054/1491] overflow-hidden rounded-2xl ring-1 ring-white/10" style={{ boxShadow: "var(--shadow-hero)", background: "var(--gradient-panel)" }}>
            {cover ? (
              <img src={cover} alt="Battlefield Atlantis cover" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-center">
                <div>
                  <div className="eyebrow">Cover forthcoming</div>
                  <div className="mt-3 text-3xl font-black">Battlefield Atlantis</div>
                  <div className="mt-1 text-[var(--ink2)]">Issue 1 · Only One Will Rule</div>
                </div>
              </div>
            )}

            {/* Top-left: $1.00 / ISSUE #1 comic price box */}
            <div className="absolute left-3 top-3 overflow-hidden rounded-sm border border-black/40 bg-[#f5e9c8] font-mono text-black shadow-md">
              <div className="flex border-b border-black/30 text-[10px] font-black">
                <div className="border-r border-black/30 px-2 py-0.5">$1.00</div>
                <div className="px-2 py-0.5">1</div>
              </div>
              <div className="px-2 py-1 text-[11px] font-black tracking-wider">ISSUE #1</div>
            </div>

            {/* Top-right: 9.5 PAGES FREE pill */}
            <div className="absolute right-3 top-3 rounded-md bg-gradient-to-r from-emerald-300 to-cyan-300 px-3 py-1.5 text-[11px] font-black tracking-wider text-emerald-950 shadow-lg">
              9.5 PAGES · FREE
            </div>

            {/* Left edge: "1ST EXPLOSIVE ISSUE" sticker + character mini-portraits */}
            <div className="absolute left-3 top-24 flex flex-col items-center gap-1">
              <div
                className="flex h-14 w-14 items-center justify-center text-center text-[8px] font-black leading-tight text-red-950"
                style={{
                  background: "radial-gradient(circle, #fde047 0%, #facc15 70%, #ca8a04 100%)",
                  clipPath: "polygon(50% 0%, 61% 20%, 80% 12%, 75% 33%, 95% 38%, 80% 50%, 95% 62%, 75% 67%, 80% 88%, 61% 80%, 50% 100%, 39% 80%, 20% 88%, 25% 67%, 5% 62%, 20% 50%, 5% 38%, 25% 33%, 20% 12%, 39% 20%)",
                }}
              >
                1ST<br />EXPLOSIVE<br />ISSUE!
              </div>
              {heroThumbs.map((src, i) => (
                <div key={i} className="h-10 w-10 overflow-hidden rounded-sm border-2 border-black/70 shadow">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>

            {/* Bottom-left: WAR OF THE WORLDS starburst */}
            <div
              className="absolute -left-2 bottom-16 flex h-28 w-28 -rotate-12 items-center justify-center text-center text-[11px] font-black leading-tight text-yellow-300 drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]"
              style={{
                background: "radial-gradient(circle, #dc2626 0%, #991b1b 80%)",
                clipPath: "polygon(50% 0%, 58% 18%, 78% 8%, 72% 30%, 96% 28%, 80% 47%, 100% 60%, 78% 65%, 88% 88%, 65% 78%, 60% 100%, 45% 82%, 30% 100%, 25% 78%, 5% 88%, 15% 65%, 0% 55%, 18% 45%, 0% 28%, 22% 30%, 18% 8%, 38% 18%)",
              }}
            >
              WAR<br />OF THE<br />WORLDS<br />BEGINS!
            </div>

            {/* Bottom CTA + caption strip */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-12">
              {readerLink && (
                <Link
                  {...readerLink}
                  className="block w-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 px-4 py-2.5 text-center text-sm font-black tracking-wider text-white shadow-xl transition hover:brightness-110"
                >
                  ▶ READ 9.5 PAGES FREE
                </Link>
              )}
              <div className="mt-2 text-center font-mono text-[10px] font-bold uppercase tracking-[2px] text-white/80">
                Full first act + title page · Free · Pages 10–20 subscribe
              </div>
            </div>
          </div>

          {/* Copy column */}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[3px] text-[var(--gold)]">
              <span>⚡</span> Astralnaut Studios Presents
            </div>
            <div className="mt-4 flex items-center justify-center rounded-xl border border-white/10 bg-black/60 p-6 shadow-2xl" style={{ boxShadow: "0 0 80px -20px rgba(34,211,238,0.35)" }}>
              <img src={baLogo} alt="Battlefield Atlantis" className="max-h-32 w-auto" />
            </div>
            <h1 className="sr-only">Battlefield Atlantis</h1>

            <p className="mt-5 italic text-[var(--gold)]">"Only one will rule."</p>

            <p className="mt-4 max-w-xl leading-relaxed text-[var(--ink2)]">
              25,000 years ago, Saantris Station was destroyed. Vrenoa City fell hours later.
              The <strong className="text-white">Tri-Planetary Coalition</strong> demands restraint.{" "}
              <strong className="text-white">Poseidon, King of Alympia</strong>, demands annihilation.
              And between them stands <strong className="text-white">Zeus</strong> — and the Alympian Guard he never asked to lead.
            </p>

            <div className="mt-7 grid grid-cols-4 gap-4">
              <Stat value={String(freeCount)} label="Pages free for all" />
              <Stat value={String(paidCount)} label="Subscriber pages" />
              <Stat value="4 wks" label="To complete issue" />
              <Stat value={String(totalPages)} label="Total story pages" />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {readerLink && (
                <Link {...readerLink} className="rounded-md bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:brightness-110">
                  ▶ Read 9.5 pages free
                </Link>
              )}
              <Link to="/pricing" className="rounded-md bg-gradient-to-r from-amber-300 to-yellow-500 px-5 py-3 text-sm font-black text-amber-950 shadow-lg transition hover:brightness-110">
                Subscribe from $4.99
              </Link>
            </div>

            <div className="mt-6 space-y-2 text-xs">
              <div className="text-[var(--ink2)]">
                <span className="mr-2">📺</span>
                <span className="font-black uppercase tracking-wider text-[var(--neon)]">TV-Style Structure:</span>{" "}
                Pages 1–9 the full first act · Page 9.5 title · Pages 10–20 episode body
              </div>
              <div className="text-[var(--ink2)]">
                <span className="mr-2">⚡</span>
                <span className="font-black uppercase tracking-wider text-[var(--gold)]">Early Access:</span>{" "}
                Patron Tuesdays · Initiate Wednesdays · Reader Thursdays · 4 pages/week · issue completes end of July
              </div>
            </div>
          </div>
        </section>

        {/* ============ ISSUE #1 DETAILS ============ */}
        <section className="mt-20 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-4xl font-black md:text-5xl">Issue #1 — <span className="italic">"Only One Will Rule"</span></h2>
            <p className="mt-3 max-w-xl text-[var(--ink2)]">The cold open. The council. The ultimatum. The team that should not exist.</p>

            {/* Green callout */}
            <div className="mt-8 rounded-md border-l-4 border-emerald-400 bg-emerald-500/5 p-5">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[2px] text-emerald-300">
                <span>📺</span> Structured like TV · 9.5 free pages
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">
                Pages 1–9 are the full first act — free for everyone. Page 9.5 is the title page — also free.
                Pages 10–20 are the episode body, releasing four per week to subscribers.
              </p>
            </div>

            <div className="mt-8 space-y-5 text-sm leading-relaxed text-[var(--ink2)]">
              <p>
                <span className="font-black uppercase tracking-wider text-emerald-400">First Act · Pages 1–9.</span>{" "}
                The story opens on <strong className="text-[var(--gold)]">Saantris Station</strong> in Mars orbit, 25,000 years before the present day, an instant before the bomb.
                The shockwave reaches Vrenoa City — population 3.8 million — in seconds. By page two, that number is zero.
                At <strong className="text-[var(--gold)]">Tri-Planetary Coalition headquarters</strong> twenty-four hours later, Poseidon, King of Alympia,
                attends an emergency council by hologram and demands deployment of the <strong className="text-[var(--gold)]">Lumenax</strong> —
                the most destructive weapon in the galaxy — against the Vaegan homeworld. He delivers his ultimatum to Zeus: deploy it in twenty-four hours,
                or he will come to Alympia and deploy it himself. Zeus, refusing both Poseidon's revenge and the council's paralysis,
                begins to form the <strong className="text-[var(--gold)]">Alympian Guard</strong>. Prometheus walks. By the close of the first act:{" "}
                <em>"He has made his choice. We have made ours. When Poseidon comes this time, we end it."</em>
              </p>
              <p>
                <span className="font-black uppercase tracking-wider text-[var(--gold)]">Title Page · Page 9.5.</span>{" "}
                The story breaks for its title beat — Battlefield Atlantis · Issue One · Only One Will Rule. The natural act-break before the paywall.
              </p>
              <p>
                <span className="font-black uppercase tracking-wider text-cyan-400">Episode Body · Pages 10–20.</span>{" "}
                The eleven subscriber-gated pages develop the consequences of the act-one decisions.
                The Alympian Guard is sanctioned. Captain Rhea is recalled. Forces preposition for the inevitable confrontation.
                The issue closes on a hook designed to convert subscribers into the next issue.
              </p>
            </div>
          </div>

          {/* Issue details card */}
          <aside className="self-start rounded-xl border border-white/10 bg-[var(--bg2)]/60 p-6 shadow-xl backdrop-blur">
            <div className="text-[11px] font-black uppercase tracking-[3px] text-[var(--mute)]">Issue Details</div>
            <dl className="mt-5 divide-y divide-white/5 text-sm">
              <DetailRow label="Series" value="Battlefield Atlantis" />
              <DetailRow label="Issue" value="#1 · First Issue" />
              <DetailRow label="Title" value="Only One Will Rule" />
              <DetailRow label="Writer" value="Phil" />
              <DetailRow label="Studio" value="Astralnaut" />
              <DetailRow label="Total pages" value="20 + title" />
              <DetailRow label="Pages 1–9" value={<span className="text-emerald-400">FREE · the full first act</span>} />
              <DetailRow label="Page 9.5" value={<span className="text-[var(--gold)]">FREE · title page</span>} />
              <DetailRow label="Pages 10–20" value={<span className="text-cyan-400">Subscribers</span>} />
            </dl>

            {/* Next drop sub-card */}
            <div className="mt-5 rounded-md border border-[var(--gold)]/30 bg-black/40 p-4">
              <div className="text-[10px] font-black uppercase tracking-[2px] text-[var(--gold)]">Next drop · Pages 10–13 (4 pages)</div>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-[var(--ink2)]">Patron</span><span className="font-mono text-cyan-300">Tue · May 12</span></div>
                <div className="flex justify-between"><span className="text-[var(--ink2)]">Initiate</span><span className="font-mono text-cyan-300">Wed · May 13</span></div>
                <div className="flex justify-between"><span className="text-[var(--ink2)]">Reader</span><span className="font-mono text-cyan-300">Thu · May 14</span></div>
              </div>
            </div>

            <dl className="mt-5 divide-y divide-white/5 text-sm">
              <DetailRow label="Issue completes" value="Week of May 26" />
              <DetailRow label="Variant covers" value="3 available" />
            </dl>
          </aside>
        </section>

        {/* ============ ALL 20 PAGES ============ */}
        <section className="mt-20">
          <h2 className="text-4xl font-black md:text-5xl">All {totalPages} pages</h2>
          <p className="mt-2 max-w-xl text-[var(--ink2)]">Click any unlocked page to jump straight to it. Locked pages drop weekly on Thursdays.</p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {/* Free + locked pages (1..20, plus a 9.5 title card after 9) */}
            {Array.from({ length: totalPages }).map((_, idx) => {
              const n = idx + 1;
              const isFree = n <= 9;
              const found = pages.find((p: typeof pages[number]) => p.page_number === n);
              const thumb = pageUrl(found?.image_path);
              const dropLabel = DROP_SCHEDULE[n];

              if (isFree) {
                const card = (
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md ring-1 ring-emerald-400/60">
                    {thumb ? (
                      <img src={thumb} alt={`Page ${n}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[var(--mute)]">Page {n}</div>
                    )}
                    <div className="absolute left-2 top-2 rounded bg-emerald-400 px-2 py-0.5 text-[10px] font-black tracking-wider text-emerald-950">
                      FREE · PAGE {n}
                    </div>
                  </div>
                );
                return readerLink ? (
                  <Link key={n} {...readerLink} className="block transition hover:scale-[1.02]">{card}</Link>
                ) : (
                  <div key={n}>{card}</div>
                );
              }

              return (
                <div key={n} className="relative flex aspect-[3/4] flex-col overflow-hidden rounded-md border border-white/5 bg-[#0a0e1f]">
                  <div className="absolute left-2 top-2 rounded bg-white/5 px-2 py-0.5 text-[10px] font-black tracking-wider text-white/40">
                    PAGE {n}
                  </div>
                  <div className="flex flex-1 items-center justify-center">
                    <Lock className="h-8 w-8 text-yellow-700/70" />
                  </div>
                  {dropLabel && (
                    <div className="bg-black/60 px-2 py-1.5 text-center font-mono text-[9px] font-black tracking-[1.5px] text-[var(--gold)]">
                      {dropLabel}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Title page 9.5 — inserted at the end of the free row visually (after page 9, before page 10). We append it here for simplicity. */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-md ring-1 ring-[var(--gold)]/60 bg-[var(--bg2)]">
              <div className="absolute left-2 top-2 rounded bg-[var(--gold)] px-2 py-0.5 text-[10px] font-black tracking-wider text-amber-950">
                TITLE · 9.5
              </div>
              <div className="flex h-full items-center justify-center p-4 text-center">
                <div>
                  <img src={baLogo} alt="Title page" className="mx-auto max-h-16 w-auto opacity-90" />
                  <div className="mt-2 text-[10px] font-black uppercase tracking-[2px] text-[var(--gold)]">Issue #1 · pt. 1</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FACTIONS (preserved) ============ */}
        {factions.length > 0 && (
          <section className="mt-20">
            <div className="eyebrow">Factions</div>
            <h2 className="mt-2 text-3xl font-black">Two worlds. One coalition.</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {factions.map((f: typeof factions[number]) => {
                const emblem = pageUrl(f.emblem_path);
                const mottoBits = (f.acro ?? "").split("·").map((s: string) => s.trim()).filter(Boolean);
                return (
                  <Dialog key={f.id}>
                    <DialogTrigger asChild>
                      <button type="button" aria-label={`View ${f.name} details`} className="card-rwc group flex w-full items-center gap-5 p-6 text-left transition hover:ring-2 hover:ring-[var(--neon)] focus:outline-none focus:ring-2 focus:ring-[var(--neon)] cursor-pointer">
                        <div className="flex h-24 w-24 flex-none items-center justify-center rounded-md bg-[var(--bg2)] p-2">
                          {emblem ? <img src={emblem} alt={`${f.name} emblem`} className="h-full w-full object-contain" /> : <div className="text-[10px] text-[var(--mute)]">Emblem</div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="eyebrow" style={{ color: "var(--neon)" }}>{f.acro}</div>
                          <h3 className="mt-2 text-xl font-black">{f.name}</h3>
                          <p className="mt-2 line-clamp-2 text-sm text-[var(--ink2)]">{f.summary}</p>
                          <div className="mt-3 text-[10px] font-bold uppercase tracking-[2px] text-[var(--mute)] transition group-hover:text-[var(--neon)]">Click to expand →</div>
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl overflow-hidden p-0">
                      <div className="grid grid-cols-1 gap-0 md:grid-cols-[1.05fr_1fr]">
                        <div className="flex items-center justify-center bg-[var(--bg2)] p-6">
                          {emblem && <img src={emblem} alt={`${f.name} brand sheet`} className="h-full max-h-[50vh] w-full object-contain animate-in fade-in zoom-in-95 duration-500 md:max-h-[70vh]" />}
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto p-6 md:max-h-[70vh] md:p-8">
                          <div className="eyebrow" style={{ color: "var(--neon)" }}>{f.acro}</div>
                          <DialogTitle className="mt-2 text-2xl font-black md:text-3xl">{f.name}</DialogTitle>
                          {f.summary && <DialogDescription className="mt-4 text-[var(--ink)]">{f.summary}</DialogDescription>}
                          {mottoBits.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {mottoBits.map((m: string) => (
                                <span key={m} className="rounded border border-[var(--gold)] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">{m}</span>
                              ))}
                            </div>
                          )}
                          {f.bio && <div className="mt-5 space-y-3 text-sm leading-relaxed text-[var(--ink2)]">{f.bio.split(/\n\n+/).map((p: string, i: number) => <p key={i}>{p}</p>)}</div>}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </section>
        )}

        {/* ============ MEET THE CAST ============ */}
        {characters.length > 0 && (
          <section className="mt-20">
            <h2 className="text-4xl font-black md:text-5xl">Meet the cast</h2>
            <p className="mt-2 max-w-xl text-[var(--ink2)]">The Battlefield Atlantis transmedium roster — humans, gods, and the suits that hold the line between the two.</p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {characters.map((c: typeof characters[number]) => {
                const portrait = pageUrl(c.portrait_path);
                return (
                  <Dialog key={c.id}>
                    <DialogTrigger asChild>
                      <button type="button" aria-label={`View ${c.name} details`} className="group block w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-slate-700/40 to-slate-900/60 text-left transition hover:ring-2 hover:ring-[var(--neon)] focus:outline-none focus:ring-2 focus:ring-[var(--neon)] cursor-pointer">
                        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-slate-300/10 to-slate-900/30">
                          {portrait ? (
                            <img src={portrait} alt={c.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-[var(--mute)]">Portrait forthcoming</div>
                          )}
                          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-3 py-2 text-center font-mono text-[10px] font-black uppercase tracking-[3px] text-white/90">
                            {c.name}
                          </div>
                        </div>
                        <div className="space-y-1 p-4">
                          <div className="font-mono text-[10px] font-black uppercase tracking-[2px] text-cyan-300">
                            {c.faction}{c.role ? ` · ${c.role}` : ""}
                          </div>
                          <div className="text-lg font-black">{c.name}</div>
                          {c.short_description && (
                            <div className="line-clamp-1 text-xs text-[var(--ink2)]">{c.short_description}</div>
                          )}
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-7xl overflow-hidden p-1">
                      <div className="grid grid-cols-1 gap-0 md:grid-cols-[2fr_1fr]">
                        <div className="flex items-center justify-center bg-[var(--bg2)] p-4">
                          {portrait && <img src={portrait} alt={c.name} className="max-h-[50vh] w-full object-contain animate-in fade-in zoom-in-95 duration-500 md:max-h-[90vh]" />}
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto p-6 md:max-h-[90vh] md:p-8">
                          <div className="eyebrow" style={{ color: "var(--neon)" }}>{c.faction}</div>
                          <DialogTitle className="mt-2 text-2xl font-black md:text-3xl">{c.name}</DialogTitle>
                          <div className="mt-1 font-mono text-xs text-[var(--mute)]">{c.role}</div>
                          {c.transmedium && <div className="mt-3 inline-block rounded border border-[var(--gold)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">Transmedium</div>}
                          {c.short_description && <DialogDescription className="mt-4 text-[var(--ink)]">{c.short_description}</DialogDescription>}
                          {c.bio && <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--ink2)]">{c.bio.split(/\n\n+/).map((p: string, i: number) => <p key={i}>{p}</p>)}</div>}
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[2px] text-[var(--mute)]">{label}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-[var(--ink2)]">{label}</dt>
      <dd className="text-right font-bold text-white">{value}</dd>
    </div>
  );
}
