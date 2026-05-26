import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { getIssueBundle } from "@/lib/public.functions";
import { logStorageAccess } from "@/lib/storage-access.functions";
import { supabase } from "@/integrations/supabase/client";
import { pageUrl } from "@/lib/storage";
import { z } from "zod";

export const Route = createFileRoute("/reader/$series/$issue")({
  validateSearch: (s) => ({ page: z.coerce.number().int().min(1).max(50).catch(1).parse(s.page ?? 1) }),
  loader: async ({ params }) => {
    const slug = `${params.series}-issue-${params.issue}`;
    const bundle = await getIssueBundle({ data: { slug } });
    if (!bundle) throw notFound();
    return bundle;
  },
  head: ({ params }) => ({
    meta: [
      { title: `Reader — ${params.series} Issue ${params.issue} · Real World Comics` },
      { name: "description", content: "Free first-act reader. Subscribe to unlock the rest." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reader,
});

function flashVariantFor(page: number): "lightning" | "explosion" | "pulse" | null {
  if (page === 1) return "lightning";
  if (page === 2) return "explosion";
  if (page === 4 || page === 5) return "lightning"; // Zeus lightning beats
  if (page === 9) return "pulse";
  return null;
}

function Reader() {
  const { issue, pages } = Route.useLoaderData();
  const { page } = Route.useSearch();
  const navigate = useNavigate();
  const total = Math.ceil(Number(issue.total_pages));
  const freeMax = Math.floor(Number(issue.free_pages));
  const current = pages.find((p: typeof pages[number]) => p.page_number === page);
  const isFree = page <= freeMax;
  const img = pageUrl(current?.image_path);
  const [zoom, setZoom] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const flashVariant = flashVariantFor(page);


  function go(delta: number) {
    const next = Math.min(total, Math.max(1, page + delta));
    navigate({ to: "/reader/$series/$issue", params: { series: issue.series.slug, issue: String(issue.issue_number) }, search: { page: next } });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") navigate({ to: `/${issue.series.slug}` as "/battlefield-atlantis" | "/children-of-aquarius" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Best-effort access logging for paid-content auditing & burst detection.
  useEffect(() => {
    if (!current?.image_path) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      logStorageAccess({
        data: {
          paths: [current.image_path],
          bucket: "comic-pages",
          userId: data.user?.id ?? null,
          comicId: current.id ?? null,
          isFree,
        },
      }).catch(() => {});
    })();
    return () => { cancelled = true; };
  }, [current?.id, current?.image_path, isFree]);

  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="sr-only">{issue.series.name} Issue {issue.issue_number} — Page {page}</h1>
        <div className="flex items-center justify-between">
          <Link to={`/${issue.series.slug}` as "/battlefield-atlantis"} className="text-xs text-[var(--mute)] hover:text-[var(--neon)]">← {issue.series.name}</Link>
          <div className="font-mono text-sm text-[var(--mute)]">PAGE <span className="text-[var(--ink)]">{page}</span> / {total} · {isFree ? <span className="text-[var(--neon)]">FREE</span> : <span className="text-[var(--gold)]">LOCKED</span>}</div>
        </div>

        <div className="mt-4 panel relative overflow-hidden">
          {isFree && img ? (
            <img src={img} alt={current?.alt_text ?? `Page ${page}`} onClick={() => setZoom(!zoom)} className={`mx-auto h-auto w-full cursor-zoom-${zoom ? "out" : "in"} ${zoom ? "scale-150" : ""}`} style={{ transition: "transform .3s ease", maxHeight: "85vh", objectFit: "contain" }} />
          ) : isFree && !img ? (
            <div className="aspect-[1054/1491] flex items-center justify-center p-10 text-center text-[var(--mute)]">Page art forthcoming</div>
          ) : (
            <Paywall page={page} freeMax={freeMax} dropAt={current?.drop_at} />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => go(-1)} disabled={page <= 1} className="btn-ghost disabled:opacity-30">← Prev</button>
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => {
              const n = i + 1;
              return (
                <button key={n} aria-label={`Go to page ${n}`} onClick={() => navigate({ to: "/reader/$series/$issue", params: { series: issue.series.slug, issue: String(issue.issue_number) }, search: { page: n } })} className="h-2 w-2 rounded-full" style={{ background: n === page ? "var(--neon)" : n <= freeMax ? "rgba(34,211,255,0.3)" : "rgba(255,255,255,0.1)" }} />
              );
            })}
          </div>
          <button onClick={() => go(1)} disabled={page >= total} className="btn-ghost disabled:opacity-30">Next →</button>
        </div>
      </div>
    </>
  );
}

function Paywall({ page, freeMax, dropAt }: { page: number; freeMax: number; dropAt?: string | null }) {
  return (
    <div className="mx-auto max-w-xl p-10 text-center" style={{ background: "var(--gradient-panel)" }}>
      <div className="eyebrow">Subscriber unlock</div>
      <h2 className="mt-3 text-3xl font-black">Page {page} drops to subscribers.</h2>
      <p className="mt-3 text-[var(--ink2)]">You're reading the free first act (pages 1–{freeMax}). The rest of this issue releases on the tier-staggered weekly cadence.</p>
      {dropAt && <p className="mt-2 font-mono text-sm text-[var(--gold)]">Reader drop · {new Date(dropAt).toLocaleDateString()}</p>}
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <Stat label="Reader" price="$4.99" />
        <Stat label="Initiate" price="$9.99" />
        <Stat label="Patron" price="$24.99" />
      </div>
      <Link to="/pricing" className="btn-cta mt-8 inline-flex">▶ Choose a tier</Link>
    </div>
  );
}
function Stat({ label, price }: { label: string; price: string }) {
  return (<div className="card-rwc p-3"><div className="font-mono text-lg font-black text-[var(--neon)]">{price}</div><div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--mute)]">{label}</div></div>);
}
