import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { RightsNotice } from "@/components/rights-notice";
import { getSeriesBundle, getIssueBundle } from "@/lib/public.functions";
import { pageUrl } from "@/lib/storage";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import coaLogo from "@/assets/children-of-aquarius-logo.png";
import { AuthorBioAB } from "@/components/author-bio-ab";
import { AuthorFaq, FAQ_FALLBACK } from "@/components/author-faq";
import { listActiveAuthorFaq } from "@/lib/author-faq.functions";



export const Route = createFileRoute("/children-of-aquarius")({
  loader: async () => {
    const bundle = await getSeriesBundle({ data: { slug: "children-of-aquarius" } });
    if (!bundle) throw notFound();
    const firstIssue = bundle.issues[0];
    const issueBundle = firstIssue ? await getIssueBundle({ data: { slug: firstIssue.slug } }) : null;
    const faqRaw = await listActiveAuthorFaq().catch(() => [] as Array<{ question: string; answer: string }>);
    const faq = faqRaw.length > 0 ? faqRaw : FAQ_FALLBACK;
    return { bundle, issueBundle, faq };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: "Children of Aquarius — Issue 1 · Real World Comics" },
      { name: "description", content: "A priest gifts three young humans the powers of Christ to find and protect the Christ child of the Aquarian Age. First 9 pages free." },
      { property: "og:title", content: "Children of Aquarius — Issue 1" },
      { property: "og:description", content: "Esoteric thriller. The Age Begins · The Child Awakens." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://astralnautstudios.com/children-of-aquarius" },
      { property: "og:site_name", content: "Real World Comics — Astralnaut Studios" },
      { property: "article:author", content: "Phil Russell" },
      { property: "article:publisher", content: "Streamwalkers Corporation" },
      { property: "og:image", content: "https://xcznyhkaispxnjrvhdnc.supabase.co/storage/v1/object/public/comic-pages/children-of-aquarius/issue-1/page-0.png" },
      { property: "og:image:alt", content: "Children of Aquarius Issue 1 cover — Real World Comics" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://xcznyhkaispxnjrvhdnc.supabase.co/storage/v1/object/public/comic-pages/children-of-aquarius/issue-1/page-0.png" },
      { name: "twitter:image:alt", content: "Children of Aquarius Issue 1 cover — Real World Comics" },
    ],
    links: [{ rel: "canonical", href: "https://astralnautstudios.com/children-of-aquarius" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ComicIssue",
          name: "Children of Aquarius — Issue #1: The Age Begins · The Child Awakens",
          issueNumber: "1",
          isPartOf: { "@type": "ComicSeries", name: "Children of Aquarius" },
          author: { "@type": "Person", name: "Phil Russell" },
          publisher: { "@type": "Organization", name: "Streamwalkers Corporation" },
          copyrightHolder: { "@type": "Organization", name: "Streamwalkers Corporation" },
          copyrightYear: 2026,
          copyrightNotice: "© 2026 Streamwalkers Corporation. All rights reserved.",
          genre: "Esoteric thriller",
          inLanguage: "en",
          isAccessibleForFree: true,
          creativeWorkStatus: "Published",
          image: "https://xcznyhkaispxnjrvhdnc.supabase.co/storage/v1/object/public/comic-pages/children-of-aquarius/issue-1/page-0.png",
          url: "https://astralnautstudios.com/children-of-aquarius",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": "https://astralnautstudios.com/children-of-aquarius#author-faq",
          about: { "@type": "Person", name: "Phil Russell" },
          mainEntity: (loaderData?.faq ?? []).map((item: { question: string; answer: string }) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }),
      },
    ],
  }),
  component: COAPage,
});

function COAPage() {
  const { bundle, issueBundle } = Route.useLoaderData();
  const issue = issueBundle?.issue;
  const pages = issueBundle?.pages ?? [];
  const drops = issueBundle?.drops ?? [];
  const factions = bundle.factions;
  const cover = pageUrl(issue?.cover_path);
  const readerLink = issue
    ? { to: "/reader/$series/$issue" as const, params: { series: bundle.series.slug, issue: String(issue.issue_number) } }
    : null;

  const totalPages = Math.ceil(Number(issue?.total_pages ?? 24));
  const freeCount = Number(issue?.free_pages ?? 9);
  const paidCount = Number(issue?.paid_pages ?? 15);

  // Build a per-page drop label map from issue_drops (week → pages[]).
  const DROP_SCHEDULE: Record<number, string> = {};
  for (const d of drops as Array<{ week: number; patron_date: string; pages: number[] }>) {
    const label = `PATRON TUE · ${formatDropDate(d.patron_date)}`;
    for (const p of d.pages ?? []) DROP_SCHEDULE[p] = label;
  }

  const characters = bundle.characters;
  // Up to 3 hero sticker thumbs from the cast.
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
              <img src={cover} alt="Children of Aquarius cover" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-center">
                <div>
                  <div className="eyebrow">Cover forthcoming</div>
                  <div className="mt-3 text-3xl font-black">Children of Aquarius</div>
                  <div className="mt-1 text-[var(--ink2)]">Issue 1 · The Age Begins</div>
                </div>
              </div>
            )}

            {/* Top-left: $1.00 / ISSUE #1 comic price box */}
            <div className="absolute left-3 top-3 overflow-hidden rounded-sm border border-black/40 bg-[#f5e9c8] font-mono text-black shadow-md">
              <div className="flex border-b border-black/30 text-[10px] font-black">
                <div className="border-r border-black/30 px-2 py-0.5">$4.99</div>
                <div className="px-2 py-0.5">1</div>
              </div>
              <div className="px-2 py-1 text-[11px] font-black tracking-wider">ISSUE #1</div>
            </div>

            {/* Top-right: 9 PAGES FREE pill */}
            <div className="absolute right-3 top-3 rounded-md bg-gradient-to-r from-violet-300 to-fuchsia-300 px-3 py-1.5 text-[11px] font-black tracking-wider text-violet-950 shadow-lg">
              {freeCount} PAGES · FREE
            </div>

            {/* Left edge: starburst sticker + character mini-portraits */}
            <div className="absolute left-3 top-24 flex flex-col items-center gap-1">
              <div
                className="flex h-14 w-14 items-center justify-center text-center text-[8px] font-black leading-tight text-violet-950"
                style={{
                  background: "radial-gradient(circle, #fde047 0%, #facc15 70%, #ca8a04 100%)",
                  clipPath: "polygon(50% 0%, 61% 20%, 80% 12%, 75% 33%, 95% 38%, 80% 50%, 95% 62%, 75% 67%, 80% 88%, 61% 80%, 50% 100%, 39% 80%, 20% 88%, 25% 67%, 5% 62%, 20% 50%, 5% 38%, 25% 33%, 20% 12%, 39% 20%)",
                }}
              >
                THE AGE<br />BEGINS!
              </div>
              {heroThumbs.map((src, i) => (
                <div key={i} className="h-10 w-10 overflow-hidden rounded-sm border-2 border-black/70 shadow">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>

            {/* Bottom-left: THE CHILD AWAKENS starburst */}
            <div
              className="absolute -left-2 bottom-16 flex h-28 w-28 -rotate-12 items-center justify-center text-center text-[11px] font-black leading-tight text-yellow-300 drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]"
              style={{
                background: "radial-gradient(circle, #7c3aed 0%, #4c1d95 80%)",
                clipPath: "polygon(50% 0%, 58% 18%, 78% 8%, 72% 30%, 96% 28%, 80% 47%, 100% 60%, 78% 65%, 88% 88%, 65% 78%, 60% 100%, 45% 82%, 30% 100%, 25% 78%, 5% 88%, 15% 65%, 0% 55%, 18% 45%, 0% 28%, 22% 30%, 18% 8%, 38% 18%)",
              }}
            >
              THE<br />CHILD<br />AWAKENS!
            </div>

            {/* Bottom CTA + caption strip */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-12">
              {readerLink && (
                <Link
                  {...readerLink}
                  className="block w-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-500 to-amber-400 px-4 py-2.5 text-center text-sm font-black tracking-wider text-white shadow-xl transition hover:brightness-110"
                >
                  ▶ READ {freeCount} PAGES FREE
                </Link>
              )}
              <div className="mt-2 text-center font-mono text-[10px] font-bold uppercase tracking-[2px] text-white/80">
                First act free · Pages {freeCount + 1}–{totalPages} subscribe
              </div>
            </div>
          </div>

          {/* Copy column */}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[3px] text-[var(--gold)]">
              <span>✶</span> Astralnaut Studios Presents
            </div>
            <div className="mt-4 flex items-center justify-center rounded-xl border border-white/10 bg-black/60 p-6 shadow-2xl" style={{ boxShadow: "0 0 80px -20px rgba(167,139,250,0.4)" }}>
              <img src={coaLogo} alt="Children of Aquarius" className="max-h-32 w-auto" />
            </div>
            <h1 className="sr-only">Children of Aquarius</h1>

            <p className="mt-5 italic text-[var(--gold)]">"The Age Begins. The Child Awakens."</p>

            <p className="mt-4 max-w-xl leading-relaxed text-[var(--ink2)]">
              An excommunicated priest gifts three young humans the powers of Christ to find and protect the{" "}
              <strong className="text-white">Christ Child of the Aquarian Age</strong>. In Brooklyn, a 15-year-old named{" "}
              <strong className="text-white">Michael</strong> wakes up to a calling older than any church.
              Across centuries, <strong className="text-white">Father Alistaire Blaire</strong> has been waiting for him —
              and so have the operatives sent to bury the prophecy before it begins.
            </p>

            <div className="mt-7 grid grid-cols-4 gap-4">
              <Stat value={String(freeCount)} label="Pages free for all" />
              <Stat value={String(paidCount)} label="Subscriber pages" />
              <Stat value="5 wks" label="To complete issue" />
              <Stat value={String(totalPages)} label="Total story pages" />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {readerLink && (
                <Link {...readerLink} className="rounded-md bg-gradient-to-r from-violet-400 via-fuchsia-500 to-amber-400 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:brightness-110">
                  ▶ Read {freeCount} pages free
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
                Pages 1–{freeCount} the full first act · Pages {freeCount + 1}–{totalPages} episode body
              </div>
              <div className="text-[var(--ink2)]">
                <span className="mr-2">⚡</span>
                <span className="font-black uppercase tracking-wider text-[var(--gold)]">Early Access:</span>{" "}
                Patron Tuesdays · Reader Thursdays · 3 pages/week · 5-week run
              </div>
            </div>
          </div>
        </section>

        {/* ============ ISSUE #1 DETAILS ============ */}
        <section className="mt-20 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-fluid-h2 font-black">Issue #1 — <span className="italic">"{issue?.subtitle ?? issue?.title ?? "The Age Begins"}"</span></h2>
            <p className="mt-3 max-w-xl text-[var(--ink2)]">The calling. The priest. The three who were chosen before they were born.</p>

            {/* Violet callout */}
            <div className="mt-8 rounded-md border-l-4 border-violet-400 bg-violet-500/5 p-5">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[2px] text-violet-300">
                <span>📺</span> Structured like TV · {freeCount} free pages
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">
                Pages 1–{freeCount} are the full first act — free for everyone.
                Pages {freeCount + 1}–{totalPages} are the episode body, releasing three per week to subscribers across five weeks.
              </p>
            </div>

            <div className="mt-8 space-y-5 text-sm leading-relaxed text-[var(--ink2)]">
              <p>
                <span className="font-black uppercase tracking-wider text-violet-400">First Act · Pages 1–{freeCount}.</span>{" "}
                The story opens in <strong className="text-[var(--gold)]">Brooklyn</strong>, present day. Michael — fifteen, sharp, and quietly furious at a world he cannot fix —
                begins seeing things he should not be able to see. A priest no parish will claim,{" "}
                <strong className="text-[var(--gold)]">Father Alistaire Blaire</strong>, has been waiting decades for the signs to align.
                Across the city, two other children stir to the same call: the <strong className="text-[var(--gold)]">Hand</strong> and the{" "}
                <strong className="text-[var(--gold)]">Head</strong>. The Trinity of the Aquarian Age is assembling — and the operatives who hunt it are already on the move.
              </p>
              <p>
                <span className="font-black uppercase tracking-wider text-cyan-400">Episode Body · Pages {freeCount + 1}–{totalPages}.</span>{" "}
                The subscriber-gated pages develop the consequences of the awakening. Blaire moves to gather the three before they are picked off.
                Jon Monarch shifts a timeline. Edmund Burke closes a net. The issue closes on a confrontation designed to land the reader straight into Issue #2.
              </p>
            </div>
          </div>

          {/* Issue details card */}
          <aside className="self-start rounded-xl border border-white/10 bg-[var(--bg2)]/60 p-6 shadow-xl backdrop-blur">
            <div className="text-[11px] font-black uppercase tracking-[3px] text-[var(--mute)]">Issue Details</div>
            <dl className="mt-5 divide-y divide-white/5 text-sm">
              <DetailRow label="Series" value="Children of Aquarius" />
              <DetailRow label="Issue" value="#1 · First Issue" />
              <DetailRow label="Title" value={issue?.subtitle ?? issue?.title ?? "The Age Begins"} />
              <DetailRow label="Writer" value="Phil" />
              <DetailRow label="Studio" value="Astralnaut" />
              <DetailRow label="Total pages" value={String(totalPages)} />
              <DetailRow label={`Pages 1–${freeCount}`} value={<span className="text-violet-400">FREE · the full first act</span>} />
              <DetailRow label={`Pages ${freeCount + 1}–${totalPages}`} value={<span className="text-cyan-400">Subscribers</span>} />
            </dl>

            {/* Next drop sub-card */}
            {drops.length > 0 && (() => {
              const next = drops[0] as { week: number; patron_date: string; reader_date: string; pages: number[] };
              return (
                <div className="mt-5 rounded-md border border-[var(--gold)]/30 bg-black/40 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[2px] text-[var(--gold)]">
                    Next drop · Pages {next.pages.join(", ")} ({next.pages.length} pages)
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-[var(--ink2)]">Patron</span><span className="font-mono text-cyan-300">Tue · {formatDropDate(next.patron_date)}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--ink2)]">Reader</span><span className="font-mono text-cyan-300">Thu · {formatDropDate(next.reader_date)}</span></div>
                  </div>
                </div>
              );
            })()}

            <dl className="mt-5 divide-y divide-white/5 text-sm">
              <DetailRow label="Issue completes" value={drops.length > 0 ? `Week of ${formatDropDate((drops[drops.length - 1] as { reader_date: string }).reader_date)}` : "5-week run"} />
              <DetailRow label="Cadence" value="3 pages / week" />
            </dl>
          </aside>
        </section>

        {/* ============ ALL PAGES ============ */}
        <section className="mt-20">
          <h2 className="text-4xl font-black md:text-5xl">All {totalPages} pages</h2>
          <p className="mt-2 max-w-xl text-[var(--ink2)]">Click any unlocked page to jump straight to it. Locked pages drop weekly on Thursdays.</p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const n = idx + 1;
              const isFree = n <= freeCount;
              const found = pages.find((p: typeof pages[number]) => p.page_number === n);
              const thumb = pageUrl(found?.image_path);
              const dropLabel = DROP_SCHEDULE[n];

              if (isFree) {
                const card = (
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md ring-1 ring-violet-400/60">
                    {thumb ? (
                      <img src={thumb} alt={`Page ${n}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[var(--mute)]">Page {n}</div>
                    )}
                    <div className="absolute left-2 top-2 rounded bg-violet-400 px-2 py-0.5 text-[10px] font-black tracking-wider text-violet-950">
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
          </div>
        </section>

        {/* ============ FACTIONS ============ */}
        {factions.length > 0 && (
          <section className="mt-20">
            <div className="eyebrow">Factions</div>
            <h2 className="mt-2 text-3xl font-black">The orders in play.</h2>
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

        {/* ============ ABOUT THE AUTHOR (A/B tested) ============ */}
        <AuthorBioAB pagePath="/children-of-aquarius" />

        {/* ============ ABOUT THE AUTHOR — FAQ ============ */}
        <AuthorFaq />

        {/* ============ MEET THE CAST ============ */}
        <section className="mt-20">
          <h2 className="text-4xl font-black md:text-5xl">Meet the cast</h2>
          <p className="mt-2 max-w-xl text-[var(--ink2)]">The Children of Aquarius ensemble — the Trinity, their protectors, the operatives, and the Brooklyn circle that holds them together.</p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {characters.map((c: typeof characters[number]) => {
              const portrait = pageUrl(c.portrait_path);
              return (
                <Dialog key={c.id}>
                  <DialogTrigger asChild>
                    <button type="button" aria-label={`View ${c.name} details`} className="group block w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-slate-700/40 to-slate-900/60 text-left transition hover:ring-2 hover:ring-[var(--neon)] focus:outline-none focus:ring-2 focus:ring-[var(--neon)] cursor-pointer">
                      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-slate-300/10 to-slate-900/30">
                        {portrait ? (
                          <img src={portrait} alt={c.name} loading="lazy" className="h-full w-full object-cover object-top transition group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-[var(--mute)]">Portrait forthcoming</div>
                        )}
                        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-3 py-2 text-center font-mono text-[10px] font-black uppercase tracking-[3px] text-white/90">
                          {c.name}
                        </div>
                      </div>
                      <div className="space-y-1 p-4">
                        <div className="font-mono text-[10px] font-black uppercase tracking-[2px] text-violet-300">
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
        <RightsNotice variant="characters" />
        <RightsNotice variant="series" title="Children of Aquarius" />
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


function formatDropDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${month} ${day}`;
}
