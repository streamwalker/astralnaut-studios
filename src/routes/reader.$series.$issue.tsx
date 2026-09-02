import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { RightsNotice } from "@/components/rights-notice";
import { Indicia } from "@/components/indicia";
import { getIssueBundle } from "@/lib/public.functions";
import { getEntitledIssuePages } from "@/lib/comic-pages.functions";
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
  validateSearch: (s: Record<string, unknown>): { page?: number } => ({
    page: z.coerce.number().int().min(1).max(50).catch(1).parse(s.page ?? 1),
  }),
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
type ReadMode = "single" | "all";

// Shared by the reader's small square controls. Hoisted to module scope because
// the text-size control now lives outside the page-viewer toolbar — that toolbar
// only renders in single-page mode, and the control scales the chrome in both.
// min-h-11/min-w-11 is the 44px touch target.
const UI_CTRL_CLS =
  "btn-ghost inline-flex min-h-11 min-w-11 items-center justify-center px-2 py-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon)] focus-visible:ring-offset-2 focus-visible:ring-offset-black";

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
  const { page = 1 } = Route.useSearch();
  const navigate = useNavigate();
  const [accessOk, setAccessOk] = useState(false);
  const [readerLocation, setReaderLocation] = useState<{ city: string; country: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = `/reader/${issue.series.slug}/${issue.issue_number}?page=${page}`;
      const { data: userRes } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!userRes.user) {
        window.location.assign(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (!userRes.user.email_confirmed_at) {
        window.location.assign(`/verify-email?next=${encodeURIComponent(next)}`);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, city, country")
        .eq("id", userRes.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!prof || !prof.full_name || !prof.city || !prof.country) {
        window.location.assign(`/complete-profile?next=${encodeURIComponent(next)}`);
        return;
      }
      setReaderLocation({ city: prof.city, country: prof.country });
      setAccessOk(true);
    })();
    return () => { cancelled = true; };
  }, [issue.series.slug, issue.issue_number, page]);

  // Paid pages arrive from the loader with image_path blanked for everyone, so
  // the reader has to ask the server for them separately. The server hands them
  // back only to an admin or an active subscriber; everyone else gets an empty
  // list and keeps seeing the paywall exactly as before.
  const [paidPaths, setPaidPaths] = useState<ReadonlyMap<number, string>>(() => new Map());
  const [entitled, setEntitled] = useState(false);
  useEffect(() => {
    if (!accessOk) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getEntitledIssuePages({ data: { issueId: issue.id } });
        if (cancelled || !res.entitled) return;
        setEntitled(true);
        setPaidPaths(new Map(res.pages.map((p) => [p.page_number, p.image_path])));
      } catch {
        // Entitlement lookup failed — fall through to the paywall rather than
        // guessing. A transient failure must never unlock, and must never blank
        // the free pages either.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessOk, issue.id]);

  const total = Math.ceil(Number(issue.total_pages));
  const freeMax = Math.floor(Number(issue.free_pages));
  const current = pages.find((p: typeof pages[number]) => p.page_number === page);
  const isFree = page <= freeMax;
  // "Unlocked" is free-by-position OR paid-and-entitled. The FREE/LOCKED badge
  // still reports the page's commercial status; this drives what renders.
  const currentPath = isFree ? current?.image_path : paidPaths.get(page);
  const unlocked = !!currentPath;
  const img = pageUrl(currentPath);

  // Two ways to read, because they suit different moments. "All pages" is a
  // continuous vertical strip that scrolls with the document — the way people
  // actually read comics on a phone. "Single page" is the click-to-turn view
  // with zoom and pan, for studying one page of art.
  //
  // The choice is remembered because it is a reading preference, not a
  // per-issue decision, and re-picking it on every page turn would be its own
  // annoyance.
  const READ_MODE_KEY = "reader:mode:v1";
  const [mode, setMode] = useState<ReadMode>("single");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_MODE_KEY);
      if (raw === "all" || raw === "single") setMode(raw);
    } catch { /* ignore */ }
  }, []);
  const chooseMode = useCallback((next: ReadMode) => {
    setMode(next);
    try { localStorage.setItem(READ_MODE_KEY, next); } catch { /* ignore */ }
  }, []);

  // Every page the reader is actually entitled to see: the free run, plus any
  // paid page the server confirmed this caller is entitled to. Paid pages come
  // back from the loader with image_path stripped to "", so an unentitled
  // reader's `paidPaths` stays empty and this collapses to the free run.
  const readablePages = pages
    .map((p: (typeof pages)[number]) =>
      p.page_number <= freeMax ? p : { ...p, image_path: paidPaths.get(p.page_number) ?? "" },
    )
    .filter((p: (typeof pages)[number]) => !!p.image_path);
  const readableSet = new Set(readablePages.map((p: (typeof pages)[number]) => p.page_number));
  // The wall goes at the first page the reader cannot open, not at a fixed
  // offset — otherwise a subscriber sees a paywall stapled to the middle of
  // pages they just unlocked.
  const firstLockedPage =
    Array.from({ length: total }, (_, i) => i + 1).find((n) => !readableSet.has(n)) ?? total + 1;
  // The strip renders contiguously from page 1, so the furthest it can scroll
  // to is the last page before the wall — not the highest readable number.
  const maxScrollable = Math.max(1, firstLockedPage - 1);
  const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3] as const;
  const FIT = 0 as const; // 0 = fit-width mode
  const [zoom, setZoom] = useState<number>(FIT);
  const [lastZoomIn, setLastZoomIn] = useState<number>(1.5);
  // Reader UI/text scaling — persisted across pages & issues (localStorage).
  const UI_SCALE_STEPS = [0.85, 1, 1.15, 1.3, 1.5, 1.75] as const;
  const UI_SCALE_KEY = "reader:ui-scale:v1";
  const [uiScale, setUiScale] = useState<number>(1);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(UI_SCALE_KEY);
      const n = raw ? Number(raw) : NaN;
      if (Number.isFinite(n) && n >= UI_SCALE_STEPS[0] && n <= UI_SCALE_STEPS[UI_SCALE_STEPS.length - 1]) {
        setUiScale(n);
      }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(UI_SCALE_KEY, String(uiScale)); } catch { /* ignore */ }
  }, [uiScale]);
  const uiScaleUp = useCallback(() => {
    setUiScale((s) => UI_SCALE_STEPS.find((x) => x > s) ?? UI_SCALE_STEPS[UI_SCALE_STEPS.length - 1]);
  }, []);
  const uiScaleDown = useCallback(() => {
    setUiScale((s) => [...UI_SCALE_STEPS].reverse().find((x) => x < s) ?? UI_SCALE_STEPS[0]);
  }, []);
  const uiScaleReset = useCallback(() => setUiScale(1), []);
  const atMinUi = uiScale <= UI_SCALE_STEPS[0];
  const atMaxUi = uiScale >= UI_SCALE_STEPS[UI_SCALE_STEPS.length - 1];
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
  // True when the viewer needs to be its own scroll container: the image is
  // wider/taller than the frame and has to be panned within it.
  const panBox = zoom !== FIT;
  const toggleActual = useCallback(() => setZoom((z) => (z === FIT ? 1 : FIT)), []);
  const onImageClick = useCallback(() => {
    setZoom((z) => (z === FIT ? lastZoomIn : FIT));
  }, [lastZoomIn]);

  function playFlash(v: FlashVariant | "reduced" | null) {
    setDebugVariant(v);
    setFlashKey((k) => k + 1);
  }



  // In the strip, "go to page N" is a scroll, not a navigation. Each page
  // renders with id="rp-N"; anything past the unlocked run has no anchor, so the
  // jump is clamped rather than silently doing nothing.
  const scrollToPage = useCallback((n: number) => {
    const target = Math.min(Math.max(1, n), maxScrollable);
    document.getElementById(`rp-${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [maxScrollable]);

  function goTo(target: number) {
    const next = Math.min(total, Math.max(1, target));
    if (mode === "all") { scrollToPage(next); return; }
    navigate({ to: "/reader/$series/$issue", params: { series: issue.series.slug, issue: String(issue.issue_number) }, search: { page: next } });
  }
  function go(delta: number) {
    goTo(page + delta);
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

  // Keep latest nav/zoom callbacks in a ref so the keydown listener binds ONCE.
  // Previously this effect had no dep array, so it re-added a window listener on every render
  // (every scroll tick, every zoom step) — a real INP regression.
  const kbRef = useRef({ go, goTo, zoomIn, zoomOut, zoomReset, toggleFullscreen, total, seriesSlug: issue.series.slug, navigate });
  kbRef.current = { go, goTo, zoomIn, zoomOut, zoomReset, toggleFullscreen, total, seriesSlug: issue.series.slug, navigate };
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = kbRef.current;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === "n" || e.key === "N") { e.preventDefault(); k.go(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "p" || e.key === "P") { e.preventDefault(); k.go(-1); }
      else if (e.key === "Home") { e.preventDefault(); k.goTo(1); }
      else if (e.key === "End") { e.preventDefault(); k.goTo(k.total); }
      else if (e.key === "Escape" && !document.fullscreenElement) k.navigate({ to: `/${k.seriesSlug}` as "/battlefield-atlantis" | "/children-of-aquarius" });
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); k.zoomIn(); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); k.zoomOut(); }
      else if (e.key === "0") { e.preventDefault(); k.zoomReset(); }
      else if (e.key === "f" || e.key === "F") { e.preventDefault(); k.toggleFullscreen(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);



  // Best-effort access logging for paid-content auditing & burst detection.
  // Only logs when signed in — the server fn requires auth and derives the
  // user id from the session, so clients can't spoof another user.
  // The strip renders every free page at once, so the audit record has to cover
  // all of them — logging only the "current" page would under-report exactly
  // the view that reads the most.
  // `logStorageAccess` validates at most 20 paths. Before subscriber unlock the
  // strip could only ever hold the free run, so this was safe by accident; now
  // a 24-page issue would blow the limit and throw away the whole audit record.
  const loggedPaths =
    mode === "all"
      ? readablePages.slice(0, 20).map((p: (typeof pages)[number]) => p.image_path)
      : currentPath
        ? [currentPath]
        : [];
  const loggedKey = loggedPaths.join("|");
  useEffect(() => {
    if (!loggedKey) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;
      logStorageAccess({
        data: {
          paths: loggedKey.split("|"),
          bucket: "comic-pages",
          comicId: mode === "all" ? null : current?.id ?? null,
          // The strip can now mix free and unlocked-paid pages, so a blanket
          // `true` would under-report paid reads — exactly what this log exists
          // to catch. `null` means "mixed / not asserted".
          isFree: mode === "all" ? null : isFree,
        },
      }).catch(() => {});
    })();
    return () => { cancelled = true; };
    // loggedKey is the stable identity of the path set; current?.id only
    // matters in single-page mode, where it moves in lockstep with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedKey, mode, isFree]);

  if (!accessOk) {
    return (
      <>
        <SiteHeader />
        <div className="container-wide py-16 text-center text-sm text-[var(--mute)]">
          Verifying access…
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />

      <div
        className="container-wide py-6"
        style={{ ["--reader-ui-scale" as string]: String(uiScale) }}
      >
        <h1 className="sr-only">{issue.series.name} Issue {issue.issue_number} — Page {page}</h1>
        <div className="flex items-center justify-between" style={{ fontSize: `calc(0.875rem * ${uiScale})` }}>
          <Link to={`/${issue.series.slug}` as "/battlefield-atlantis"} className="text-[var(--mute)] hover:text-[var(--neon)]">← {issue.series.name}</Link>
          <div className="font-mono text-[var(--mute)]">PAGE <span className="text-[var(--ink)]">{page}</span> / {total} · {isFree ? <span className="text-[var(--neon)]">FREE</span> : unlocked ? <span className="text-[var(--neon)]">UNLOCKED</span> : <span className="text-[var(--gold)]">LOCKED</span>}</div>
        </div>
        {readerLocation ? (
          <div
            className="mt-1 flex items-center justify-end gap-2 font-mono uppercase tracking-[2px] text-[var(--mute)]"
            style={{ fontSize: `calc(10px * ${uiScale})` }}
            title="Signed in from"
          >
            <span aria-hidden="true">◉</span>
            <span>
              {readerLocation.city}, {readerLocation.country}
            </span>
            <Link to="/complete-profile" className="underline underline-offset-2 hover:text-[var(--neon)]">
              Edit
            </Link>
          </div>
        ) : null}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          Page {page} of {total}{isFree ? ", free preview" : unlocked ? ", unlocked by subscription" : ", locked"}
        </div>


        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-2"
          style={{ fontSize: `calc(10px * ${uiScale})` }}
        >
          <div
            role="group"
            aria-label="Reading mode"
            className="inline-flex overflow-hidden rounded-sm border border-white/10"
          >
            <ModeButton
              active={mode === "all"}
              onClick={() => chooseMode("all")}
              label="Read all pages"
              hint="Continuous vertical scroll"
            >
              ▤ All pages
            </ModeButton>
            <ModeButton
              active={mode === "single"}
              onClick={() => chooseMode("single")}
              label="Single page"
              hint="Click to turn, zoom and pan"
            >
              ❐ Single page
            </ModeButton>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono uppercase tracking-[2px] text-[var(--mute)]">
              {mode === "all"
                ? `${readablePages.length} page${readablePages.length === 1 ? "" : "s"} · scroll to read`
                : "Click the art to zoom · ← → to turn"}
            </span>
            {/* Text-size control lives out here rather than in the page-viewer
                toolbar, because it scales the reader chrome in both modes and
                the toolbar only exists in single-page mode. */}
            <div className="flex items-center gap-1">
              <button type="button" onClick={uiScaleDown} aria-label="Decrease reader interface text size" disabled={atMinUi} className={UI_CTRL_CLS}>
                <span aria-hidden="true">A−</span>
              </button>
              <button type="button" onClick={uiScaleReset} aria-label="Reset reader interface text size to default" aria-pressed={uiScale === 1} className={UI_CTRL_CLS}>
                A
              </button>
              <button type="button" onClick={uiScaleUp} aria-label="Increase reader interface text size" disabled={atMaxUi} className={UI_CTRL_CLS}>
                <span aria-hidden="true">A+</span>
              </button>
              <span aria-live="polite" aria-atomic="true" className="ml-1 font-mono tabular-nums text-[var(--ink)]">
                <span className="sr-only">Interface text size: </span>
                UI {Math.round(uiScale * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 panel relative overflow-hidden">
          {mode === "all" ? (
            <AllPagesStrip
              pages={readablePages}
              total={total}
              freeMax={freeMax}
              entitled={entitled}
              firstLockedPage={firstLockedPage}
              seriesSlug={issue.series.slug}
              dropAt={pages.find((p: typeof pages[number]) => p.page_number === firstLockedPage)?.drop_at}
            />
          ) : unlocked && img ? (
            <div ref={stageRef} className={isFullscreen ? "flex h-full w-full flex-col bg-black" : "contents"}>
              <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
                {fsAnnouncement}
              </div>

              <div
                role="toolbar"
                aria-label="Page viewer controls"
                aria-controls="comic-page-viewer"
                className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-2 py-1.5 font-mono uppercase tracking-[2px] text-[var(--mute)]"
                style={{ fontSize: `calc(10px * ${uiScale})` }}
              >
                <span id="viewer-toolbar-hint">Scroll & zoom</span>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={zoomOut}
                    aria-label="Zoom out"
                    aria-keyshortcuts="-"
                    disabled={zoom !== FIT && zoom <= ZOOM_STEPS[0]}
                    className={UI_CTRL_CLS}
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                  <button
                    type="button"
                    onClick={zoomReset}
                    aria-label="Fit page to width"
                    aria-pressed={zoom === FIT}
                    aria-keyshortcuts="0"
                    className={UI_CTRL_CLS}
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={zoomIn}
                    aria-label="Zoom in"
                    aria-keyshortcuts="+ ="
                    disabled={zoom !== FIT && zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                    className={UI_CTRL_CLS}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleActual}
                    aria-label={zoom === FIT ? "Show at actual size (100%)" : "Fit page to width"}
                    aria-pressed={zoom !== FIT && zoom === 1}
                    className={UI_CTRL_CLS}
                  >
                    {zoom === FIT ? "1:1" : "Fit"}
                  </button>
                  <button
                    ref={fsButtonRef}
                    type="button"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
                    aria-pressed={isFullscreen}
                    aria-keyshortcuts="F"
                    className={UI_CTRL_CLS}
                  >
                    <span aria-hidden="true">⤢ </span>{isFullscreen ? "Exit" : "Full"}
                  </button>

                  <span aria-live="polite" aria-atomic="true" className="ml-2 tabular-nums text-[var(--ink)]">
                    <span className="sr-only">Zoom level: </span>
                    {zoom === FIT ? "FIT" : `${Math.round(zoom * 100)}%`}
                  </span>
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
                  // A fit-width comic page is roughly 1.4× taller than it is
                  // wide, so inside a fixed 85vh box the bottom third of every
                  // page sat below an inner scrollbar — and `overscroll-behavior:
                  // contain` stopped that inner scroll from handing off to the
                  // document, so readers hit a dead end at the bottom of the art.
                  //
                  // At fit width the page now flows at its natural height and the
                  // document scrolls normally. The fixed-height pan box is kept
                  // only where it earns its place: zoomed in, or full screen.
                  height: isFullscreen ? "100%" : panBox ? "min(85vh, 1200px)" : "auto",
                  flex: isFullscreen ? "1 1 auto" : undefined,
                  overflow: isFullscreen || panBox ? "auto" : "visible",
                  overscrollBehavior: isFullscreen || panBox ? "contain" : undefined,
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
          ) : (isFree || entitled) && !img ? (
            // Entitled but no art on file — the honest answer is "not drawn
            // yet", not a paywall the reader has already paid past.
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

        {mode === "all" ? (
          // In the strip there is no "current page" to advance from, so the
          // dots become jump targets and Prev/Next would be meaningless.
          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => scrollToPage(1)} className="btn-ghost">↑ Top</button>
            <div className="flex flex-wrap justify-center gap-1">
              {Array.from({ length: total }).map((_, i) => {
                const n = i + 1;
                const reachable = n <= maxScrollable;
                return (
                  <button
                    key={n}
                    aria-label={reachable ? `Jump to page ${n}` : `Page ${n} is locked`}
                    disabled={!reachable}
                    onClick={() => scrollToPage(n)}
                    className="h-2 w-2 rounded-full disabled:cursor-not-allowed"
                    style={{ background: reachable ? "rgba(34,211,255,0.5)" : "rgba(255,255,255,0.1)" }}
                  />
                );
              })}
            </div>
            <button onClick={() => scrollToPage(maxScrollable)} className="btn-ghost">↓ End</button>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => go(-1)} disabled={page <= 1} className="btn-ghost disabled:opacity-30">← Prev</button>
            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => {
                const n = i + 1;
                return (
                  <button key={n} aria-label={`Go to page ${n}`} onClick={() => navigate({ to: "/reader/$series/$issue", params: { series: issue.series.slug, issue: String(issue.issue_number) }, search: { page: n } })} className="h-2 w-2 rounded-full" style={{ background: n === page ? "var(--neon)" : readableSet.has(n) ? "rgba(34,211,255,0.3)" : "rgba(255,255,255,0.1)" }} />
                );
              })}
            </div>
            <button onClick={() => go(1)} disabled={page >= total} className="btn-ghost disabled:opacity-30">Next →</button>
          </div>
        )}

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

function ModeButton({
  active,
  onClick,
  label,
  hint,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label} — ${hint}`}
      title={hint}
      className="inline-flex min-h-11 items-center justify-center px-3 py-1 font-mono uppercase tracking-[2px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon)] focus-visible:ring-inset"
      style={{
        background: active ? "rgba(34,211,255,0.14)" : "transparent",
        color: active ? "var(--neon)" : "var(--mute)",
      }}
    >
      {children}
    </button>
  );
}

/**
 * The continuous vertical strip.
 *
 * Deliberately plain: one image per page at fit width, in normal document flow.
 * There is no inner scroll container, so the browser's own scrolling — wheel,
 * trackpad, touch, scrollbar, spacebar, Page Down — reaches the bottom of the
 * art without the reader having to find the right region of the screen first.
 *
 * Receives free pages plus any paid pages the caller is entitled to. Paid pages
 * arrive from the loader with an empty image_path for every visitor; the reader
 * re-fills them only after `getEntitledIssuePages` has confirmed entitlement
 * server-side. Leak protection therefore lives in that gate, not here — anything
 * holding a path by this point has already been authorised. The strip renders
 * contiguously and terminates at the first page still without one.
 */
function AllPagesStrip({
  pages,
  total,
  freeMax,
  entitled,
  firstLockedPage,
  seriesSlug,
  dropAt,
}: {
  pages: ReadonlyArray<{ id?: string | null; page_number: number; image_path: string; alt_text?: string | null }>;
  total: number;
  freeMax: number;
  entitled: boolean;
  firstLockedPage: number;
  seriesSlug: string;
  dropAt?: string | null;
}) {
  if (pages.length === 0) {
    return (
      <div className="aspect-[1054/1491] flex items-center justify-center p-10 text-center text-[var(--mute)]">
        Page art forthcoming
      </div>
    );
  }
  return (
    <div className="bg-black/35">
      {pages.map((p, i) => (
        <figure key={p.page_number} id={`rp-${p.page_number}`} className="relative scroll-mt-4">
          <img
            src={pageUrl(p.image_path) ?? undefined}
            alt={p.alt_text ?? `Page ${p.page_number}`}
            // The first page is what the reader is waiting on, so it loads
            // eagerly; the rest stream in as they approach the viewport, which
            // is what keeps a twenty-page strip from being a twenty-image
            // blocking download.
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            className="block h-auto w-full select-none"
          />
          <figcaption className="pointer-events-none absolute right-2 top-2 rounded-sm bg-black/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[2px] text-[var(--mute)]">
            {p.page_number} / {total}
          </figcaption>
        </figure>
      ))}
      {firstLockedPage <= total ? (
        <div className="border-t border-white/10">
          {entitled ? (
            // A subscriber who has read to the end of what exists is not being
            // paywalled — they are waiting on a drop. Pitching them a tier they
            // already pay for is the wrong message.
            <CaughtUpWall page={firstLockedPage} dropAt={dropAt} />
          ) : (
            <PaywallWithCapture
              page={firstLockedPage}
              freeMax={freeMax}
              dropAt={dropAt}
              seriesSlug={seriesSlug}
            />
          )}
        </div>
      ) : null}
    </div>
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
      <h2 className="text-fluid-h2 mt-3 font-black">Page {page} drops to subscribers.</h2>
      <p className="text-fluid-body measure mx-auto mt-3 text-[var(--ink2)]">You're reading the free first act (pages 1–{freeMax}). The rest of this issue releases on the tier-staggered weekly cadence.</p>
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
/**
 * The end-of-strip panel for a reader who is already entitled. Same slot as the
 * paywall, opposite message: nothing is being withheld for payment, the next
 * page simply has not dropped yet.
 */
function CaughtUpWall({ page, dropAt }: { page: number; dropAt?: string | null }) {
  return (
    <div
      className="mx-auto max-w-xl p-10 text-center"
      style={{ background: "var(--gradient-panel)" }}
    >
      <div className="eyebrow">You're caught up</div>
      <h2 className="text-fluid-h2 mt-3 font-black">Page {page} hasn't dropped yet.</h2>
      <p className="text-fluid-body measure mx-auto mt-3 text-[var(--ink2)]">
        You've read everything released so far. New pages arrive on the weekly cadence and unlock
        automatically with your subscription.
      </p>
      {dropAt && (
        <p className="mt-2 font-mono text-sm text-[var(--gold)]">
          Next drop · {new Date(dropAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function Stat({ label, price }: { label: string; price: string }) {
  return (<div className="card-rwc p-3"><div className="font-mono text-lg font-black text-[var(--neon)]">{price}</div><div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--mute)]">{label}</div></div>);
}
