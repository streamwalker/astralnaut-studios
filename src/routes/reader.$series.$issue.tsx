import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { RightsNotice } from "@/components/rights-notice";
import { Indicia } from "@/components/indicia";
import { getIssueBundle } from "@/lib/public.functions";
import { logStorageAccess } from "@/lib/storage-access.functions";
import { supabase } from "@/integrations/supabase/client";
import { pageUrl } from "@/lib/storage";
import { LeadCaptureInterstitial } from "@/components/reader/LeadCaptureInterstitial";
import { z } from "zod";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

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

type FlashVariant = "lightning" | "explosion" | "pulse" | "ember";

// Per-page flash overlay map, keyed by `${series-slug}:${issue-number}:${page-number}`.
// Add entries here to tune the first-view animation for any specific page.
const PAGE_FLASH_MAP: Record<string, FlashVariant> = {
  // Battlefield Atlantis — Issue 1, pages 1–9 (free first act)
  "battlefield-atlantis:1:1": "lightning",   // Saantris Station — first lightning beat
  "battlefield-atlantis:1:2": "explosion",   // Vrenoa City annihilation
  "battlefield-atlantis:1:3": "pulse",       // TPC council reveal
  "battlefield-atlantis:1:4": "lightning",   // Poseidon ultimatum — Zeus lightning
  "battlefield-atlantis:1:5": "lightning",   // Zeus reaction — sustained lightning
  "battlefield-atlantis:1:6": "ember",       // Quiet aftermath
  "battlefield-atlantis:1:7": "pulse",       // Nerrian galaxy wide shot
  "battlefield-atlantis:1:8": "pulse",       // Alympia capital reveal
  "battlefield-atlantis:1:9": "lightning",   // Act-one close — "we end it"
};

function flashVariantFor(series: string, issueNumber: number | string, page: number): FlashVariant | null {
  return PAGE_FLASH_MAP[`${series}:${issueNumber}:${page}`] ?? null;
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
  const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3] as const;
  const FIT = 0 as const; // 0 = fit-width mode
  const [zoom, setZoom] = useState<number>(FIT);
  const [lastZoomIn, setLastZoomIn] = useState<number>(1.5);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugVariant, setDebugVariant] = useState<FlashVariant | "reduced" | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const rawVariant = flashVariantFor(issue.series.slug, issue.issue_number, page);
  const mappedVariant: FlashVariant | "reduced" | null = prefersReducedMotion ? (rawVariant ? "reduced" : null) : rawVariant;
  const flashVariant = debugVariant ?? mappedVariant;

  // Per-page persistence of zoom + scroll position (session-scoped).
  const stateKey = `reader:${issue.series.slug}:${issue.issue_number}:${page}:v1`;
  const restoredRef = useRef(false);
  // Restore on page change
  useEffect(() => {
    restoredRef.current = false;
    let restoredZoom: number = FIT;
    let restoredScroll: { top: number; left: number } | null = null;
    try {
      const raw = sessionStorage.getItem(stateKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { zoom?: number; top?: number; left?: number };
        if (typeof parsed.zoom === "number") restoredZoom = parsed.zoom;
        if (typeof parsed.top === "number" && typeof parsed.left === "number") {
          restoredScroll = { top: parsed.top, left: parsed.left };
        }
      }
    } catch { /* ignore */ }
    setZoom(restoredZoom);
    // Wait for layout with new zoom before restoring scroll
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (viewerRef.current) {
          viewerRef.current.scrollTo({
            top: restoredScroll?.top ?? 0,
            left: restoredScroll?.left ?? 0,
          });
        }
        restoredRef.current = true;
      });
    });
  }, [stateKey]);

  // Save zoom + scroll (throttled via rAF) after restore completes.
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    let raf = 0;
    const save = () => {
      if (!restoredRef.current) return;
      try {
        sessionStorage.setItem(
          stateKey,
          JSON.stringify({ zoom, top: el.scrollTop, left: el.scrollLeft }),
        );
      } catch { /* quota / disabled */ }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; save(); });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    // Save current zoom immediately (covers zoom changes without scroll)
    save();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [stateKey, zoom]);

  // Pinch-to-zoom + two-finger pan (mobile). Attached with passive:false so we
  // can preventDefault on multi-touch moves; single touch keeps native scroll.
  const pinchRef = useRef<{
    startDist: number;
    startZoom: number;
    contentX: number;
    contentY: number;
    rectLeft: number;
    rectTop: number;
  } | null>(null);
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const clamp = (v: number) => Math.max(0.5, Math.min(4, v));
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const rect = el.getBoundingClientRect();
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const startZoom = zoom === FIT ? 1 : zoom;
      pinchRef.current = {
        startDist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
        startZoom,
        contentX: (el.scrollLeft + (midX - rect.left)) / startZoom,
        contentY: (el.scrollTop + (midY - rect.top)) / startZoom,
        rectLeft: rect.left,
        rectTop: rect.top,
      };
      if (zoom === FIT) setZoom(1);
      e.preventDefault();
    };
    const onMove = (e: TouchEvent) => {
      const p = pinchRef.current;
      if (!p || e.touches.length !== 2) return;
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const newZoom = clamp(p.startZoom * (dist / p.startDist));
      setZoom(newZoom);
      requestAnimationFrame(() => {
        if (!viewerRef.current) return;
        viewerRef.current.scrollLeft = p.contentX * newZoom - (midX - p.rectLeft);
        viewerRef.current.scrollTop = p.contentY * newZoom - (midY - p.rectTop);
      });
    };
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchRef.current = null;
    };
    // Double-tap to toggle zoom (mobile). Ignored when a pinch is in progress.
    let lastTapAt = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    const DOUBLE_TAP_MS = 300;
    const DOUBLE_TAP_DIST = 40;
    const onTapStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || pinchRef.current) { lastTapAt = 0; return; }
      const t = e.touches[0];
      const now = Date.now();
      if (
        now - lastTapAt < DOUBLE_TAP_MS &&
        Math.hypot(t.clientX - lastTapX, t.clientY - lastTapY) < DOUBLE_TAP_DIST
      ) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const targetZoom = zoom === FIT || zoom < 1.5 ? 2 : FIT;
        if (targetZoom === FIT) {
          setZoom(FIT);
        } else {
          const startZoom = zoom === FIT ? 1 : zoom;
          const contentX = (el.scrollLeft + (t.clientX - rect.left)) / startZoom;
          const contentY = (el.scrollTop + (t.clientY - rect.top)) / startZoom;
          setZoom(targetZoom);
          requestAnimationFrame(() => {
            if (!viewerRef.current) return;
            viewerRef.current.scrollLeft = contentX * targetZoom - (t.clientX - rect.left);
            viewerRef.current.scrollTop = contentY * targetZoom - (t.clientY - rect.top);
          });
        }
        lastTapAt = 0;
      } else {
        lastTapAt = now;
        lastTapX = t.clientX;
        lastTapY = t.clientY;
      }
    };
    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchstart", onTapStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchstart", onTapStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [zoom]);

  const zoomIn = useCallback(() => {
    setZoom((z) => {
      const cur = z === FIT ? 1 : z;
      const next = ZOOM_STEPS.find((s) => s > cur) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
      setLastZoomIn(next);
      return next;
    });
  }, []);
  const zoomOut = useCallback(() => {
    setZoom((z) => {
      if (z === FIT) return FIT;
      const lower = [...ZOOM_STEPS].reverse().find((s) => s < z);
      return lower ?? FIT;
    });
  }, []);
  const zoomReset = useCallback(() => setZoom(FIT), []);
  const toggleActual = useCallback(() => setZoom((z) => (z === FIT ? 1 : FIT)), []);
  const onImageClick = useCallback(() => {
    setZoom((z) => (z === FIT ? lastZoomIn : FIT));
  }, [lastZoomIn]);

  function playFlash(v: FlashVariant | "reduced" | null) {
    setDebugVariant(v);
    setFlashKey((k) => k + 1);
  }



  function go(delta: number) {
    const next = Math.min(total, Math.max(1, page + delta));
    navigate({ to: "/reader/$series/$issue", params: { series: issue.series.slug, issue: String(issue.issue_number) }, search: { page: next } });
  }

  const stageRef = useRef<HTMLDivElement>(null);
  const fsButtonRef = useRef<HTMLButtonElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsAnnouncement, setFsAnnouncement] = useState("");
  const toggleFullscreen = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* user gesture / unsupported */ }
  }, []);
  useEffect(() => {
    const onChange = () => {
      const nowFs = document.fullscreenElement === stageRef.current;
      setIsFullscreen(nowFs);
      if (nowFs) {
        setFsAnnouncement("Entered full screen. Press Escape or F to exit.");
        // Move focus into the viewer so keyboard nav (arrows, +/-, Esc) works
        // immediately and screen readers land on the page region.
        requestAnimationFrame(() => viewerRef.current?.focus());
      } else {
        setFsAnnouncement("Exited full screen.");
        // Return focus to the control that opened fullscreen.
        requestAnimationFrame(() => fsButtonRef.current?.focus());
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape" && !document.fullscreenElement) navigate({ to: `/${issue.series.slug}` as "/battlefield-atlantis" | "/children-of-aquarius" });
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomIn(); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomOut(); }
      else if (e.key === "0") { e.preventDefault(); zoomReset(); }
      else if (e.key === "f" || e.key === "F") { e.preventDefault(); toggleFullscreen(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });


  // Best-effort access logging for paid-content auditing & burst detection.
  // Only logs when signed in — the server fn requires auth and derives the
  // user id from the session, so clients can't spoof another user.
  useEffect(() => {
    if (!current?.image_path) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;
      logStorageAccess({
        data: {
          paths: [current.image_path],
          bucket: "comic-pages",
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
            <div ref={stageRef} className={isFullscreen ? "flex h-full w-full flex-col bg-black" : "contents"}>
              <div
                role="toolbar"
                aria-label="Page viewer controls"
                aria-controls="comic-page-viewer"
                className="flex items-center justify-between gap-2 border-b border-white/5 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[2px] text-[var(--mute)]"
              >
                <span id="viewer-toolbar-hint">Scroll & zoom</span>
                <div className="flex items-center gap-1">
                  {(() => {
                    const ctrlCls =
                      "btn-ghost inline-flex min-h-11 min-w-11 items-center justify-center px-2 py-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon)] focus-visible:ring-offset-2 focus-visible:ring-offset-black";
                    return (
                      <>
                        <button
                          type="button"
                          onClick={zoomOut}
                          aria-label="Zoom out"
                          aria-keyshortcuts="-"
                          disabled={zoom !== FIT && zoom <= ZOOM_STEPS[0]}
                          className={ctrlCls}
                        >
                          <span aria-hidden="true">−</span>
                        </button>
                        <button
                          type="button"
                          onClick={zoomReset}
                          aria-label="Fit page to width"
                          aria-pressed={zoom === FIT}
                          aria-keyshortcuts="0"
                          className={ctrlCls}
                        >
                          Fit
                        </button>
                        <button
                          type="button"
                          onClick={zoomIn}
                          aria-label="Zoom in"
                          aria-keyshortcuts="+ ="
                          disabled={zoom !== FIT && zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                          className={ctrlCls}
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                        <button
                          type="button"
                          onClick={toggleActual}
                          aria-label={zoom === FIT ? "Show at actual size (100%)" : "Fit page to width"}
                          aria-pressed={zoom !== FIT && zoom === 1}
                          className={ctrlCls}
                        >
                          {zoom === FIT ? "1:1" : "Fit"}
                        </button>
                        <button
                          type="button"
                          onClick={toggleFullscreen}
                          aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
                          aria-pressed={isFullscreen}
                          aria-keyshortcuts="F"
                          className={ctrlCls}
                        >
                          <span aria-hidden="true">⤢ </span>{isFullscreen ? "Exit" : "Full"}
                        </button>
                        <span
                          aria-live="polite"
                          aria-atomic="true"
                          className="ml-2 tabular-nums text-[var(--ink)]"
                        >
                          <span className="sr-only">Zoom level: </span>
                          {zoom === FIT ? "FIT" : `${Math.round(zoom * 100)}%`}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div
                ref={viewerRef}
                id="comic-page-viewer"
                role="region"
                aria-label={`Comic page ${page} of ${total} — scroll to pan, plus and minus to zoom, F for full screen`}
                aria-describedby="viewer-toolbar-hint"
                tabIndex={0}
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (e.deltaY < 0) zoomIn(); else zoomOut();
                  }
                }}
                className="relative w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon)] focus-visible:ring-inset"
                style={{
                  height: isFullscreen ? "100%" : "min(85vh, 1200px)",
                  flex: isFullscreen ? "1 1 auto" : undefined,
                  overflow: "auto",
                  overscrollBehavior: "contain",
                  touchAction: "pan-x pan-y",
                  background: "rgba(0,0,0,0.35)",
                }}
              >
                <div
                  style={{
                    width: zoom === FIT ? "100%" : `${zoom * 100}%`,
                    margin: "0 auto",
                  }}
                >
                  <img
                    src={img}
                    alt={current?.alt_text ?? `Page ${page}`}
                    onClick={onImageClick}
                    onLoad={() => {
                      if (!prefersReducedMotion) setFlashKey((k) => k + 1);
                    }}
                    draggable={false}
                    className={`block h-auto w-full select-none ${zoom === FIT ? "cursor-zoom-in" : "cursor-zoom-out"}`}
                    style={{ transition: prefersReducedMotion ? "none" : "width .2s ease" }}
                  />
                </div>
                {flashVariant && flashKey > 0 && (
                  <div key={`${page}-${flashKey}`} className={`page-flash page-flash--${flashVariant} pointer-events-none absolute inset-0`} aria-hidden="true" />
                )}
              </div>
            </div>
          ) : isFree && !img ? (
            <div className="aspect-[1054/1491] flex items-center justify-center p-10 text-center text-[var(--mute)]">Page art forthcoming</div>
          ) : (
            <PaywallWithCapture
              page={page}
              freeMax={freeMax}
              dropAt={current?.drop_at}
              seriesSlug={issue.series.slug}
            />
          )}
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setDebugOpen((o) => !o)}
            className="font-mono text-[10px] uppercase tracking-[2px] text-[var(--mute)] hover:text-[var(--neon)]"
            aria-expanded={debugOpen}
          >
            {debugOpen ? "× Close FX debug" : "⚙ FX debug"}
          </button>
        </div>
        {debugOpen && (
          <div className="mt-2 card-rwc flex flex-wrap items-center gap-2 p-3 text-xs">
            <span className="font-mono uppercase tracking-[2px] text-[var(--mute)]">
              Mapped: <span className="text-[var(--ink)]">{mappedVariant ?? "none"}</span>
            </span>
            <span className="ml-2 font-mono uppercase tracking-[2px] text-[var(--mute)]">Preview:</span>
            {(["lightning", "explosion", "pulse", "ember", "reduced"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => playFlash(v)}
                className="btn-ghost px-2 py-1 text-[10px] uppercase tracking-[2px]"
              >
                {v}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setDebugVariant(null); setFlashKey((k) => k + 1); }}
              className="btn-ghost px-2 py-1 text-[10px] uppercase tracking-[2px]"
            >
              Replay mapped
            </button>
            <button
              type="button"
              onClick={() => setDebugVariant(null)}
              className="btn-ghost px-2 py-1 text-[10px] uppercase tracking-[2px]"
            >
              Reset
            </button>
          </div>
        )}

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

        <div className="mt-6 text-center">
          <Link
            to="/reader/$series/$issue/letters"
            params={{ series: issue.series.slug, issue: String(issue.issue_number) }}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[3px] text-[var(--neon)] hover:underline"
          >
            ✉ Turn the page → Letters
          </Link>
        </div>
        <RightsNotice variant="reader" title={issue.series.name} issueNumber={issue.issue_number} />
        <Indicia
          seriesName={issue.series.name}
          volume={Number((issue as { volume?: number }).volume ?? 1)}
          issueNumber={issue.issue_number}
          publicationYear={Number((issue as { publication_year?: number }).publication_year ?? 2026)}
          issn={(issue.series as { issn?: string | null }).issn ?? null}
        />
      </div>
    </>
  );
}

function PaywallWithCapture({
  page,
  freeMax,
  dropAt,
  seriesSlug,
}: {
  page: number;
  freeMax: number;
  dropAt?: string | null;
  seriesSlug: string;
}) {
  const navigate = useNavigate();
  // Show the soft email capture only on the FIRST locked page of the issue,
  // and remember dismissal/submission per series in sessionStorage so it
  // doesn't repeatedly nag readers paging through paywalled content.
  const storageKey = `lead-capture-dismissed:${seriesSlug}`;
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(storageKey) === "1";
  });
  const isFirstLockedPage = page === freeMax + 1;

  useEffect(() => {
    if (isFirstLockedPage && !dismissed && typeof window !== "undefined") {
      import("@/lib/analytics").then(({ track }) =>
        track("lead_capture_shown", { source: "free_act_wall", series_slug: seriesSlug, last_page: freeMax }),
      );
    }
  }, [isFirstLockedPage, dismissed, seriesSlug, freeMax]);

  const dismiss = () => {
    if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, "1");
    setDismissed(true);
  };

  if (isFirstLockedPage && !dismissed) {
    return (
      <LeadCaptureInterstitial
        seriesSlug={seriesSlug}
        lastPage={freeMax}
        onDismiss={dismiss}
        onPlans={() => {
          dismiss();
          navigate({ to: "/pricing" });
        }}
      />
    );
  }
  return <Paywall page={page} freeMax={freeMax} dropAt={dropAt} />;
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
