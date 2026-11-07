import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AccessDenied } from "@/components/access-denied";

export const Route = createFileRoute("/_authenticated/admin/gridiron-comics")({
  head: () => ({
    meta: [
      { title: "Gridiron Zero Comic Library — Admin" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: PrivateComicLibrary,
});
type Page = {
  id: string;
  season: number;
  episode: number;
  page: number;
  title: string;
  edition: string;
  current: boolean;
  note: string;
  url: string;
};
type Catalog = {
  revision: string;
  counts: { total: number; current: number; earlier: number };
  pages: Page[];
};
const control =
  "min-h-11 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-30";
async function authorizedFetch(url: string, signal: AbortSignal) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("access");
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
    cache: "no-store",
    signal,
  });
  if (r.status === 401 || r.status === 403) throw new Error("access");
  if (!r.ok) throw new Error("load");
  return r;
}
function PrivateComicLibrary() {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [status, setStatus] = useState("loading"),
    [retry, setRetry] = useState(0);
  const [userId, setUserId] = useState(""),
    [selected, setSelected] = useState(""),
    [season, setSeason] = useState("all"),
    [episode, setEpisode] = useState("all"),
    [edition, setEdition] = useState("current"),
    [zoom, setZoom] = useState(false);
  const cache = useRef(new Map<string, Promise<string>>()),
    controller = useRef(new AbortController());
  useEffect(() => {
    const ac = new AbortController();
    controller.current = ac;
    let active = true;
    setStatus("loading");
    setCatalog(null);
    const old = cache.current;
    cache.current = new Map();
    for (const p of old.values()) p.then(URL.revokeObjectURL).catch(() => {});
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        ac.abort();
        setCatalog(null);
        setStatus("denied");
        for (const p of cache.current.values()) p.then(URL.revokeObjectURL).catch(() => {});
        cache.current.clear();
      }
    }).data.subscription;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("access");
        const response = await authorizedFetch("/api/admin/gridiron-zero/comics", ac.signal);
        const next = (await response.json()) as Catalog;
        if (!active) return;
        setUserId(data.session.user.id);
        setCatalog(next);
        setStatus("ready");
        let saved = "";
        try {
          saved = localStorage.getItem("gridiron-comic-position:" + data.session.user.id) || "";
        } catch {}
        const hash = window.location.hash.replace("#page=", "");
        const page =
          next.pages.find((p) => p.id === hash) ||
          next.pages.find((p) => p.id === saved) ||
          next.pages.find((p) => p.current);
        if (page) {
          setSelected(page.id);
          setEdition(page.current ? "current" : "earlier");
        }
      } catch (e) {
        if (active) setStatus(e instanceof Error && e.message === "access" ? "denied" : "error");
      }
    })();
    return () => {
      active = false;
      ac.abort();
      sub.unsubscribe();
      for (const p of cache.current.values()) p.then(URL.revokeObjectURL).catch(() => {});
      cache.current.clear();
    };
  }, [retry]);
  const loadImage = useCallback((p: Page) => {
    const hit = cache.current.get(p.id);
    if (hit) return hit;
    const pending = authorizedFetch(p.url, controller.current.signal)
      .then((r) => r.blob())
      .then((blob) => URL.createObjectURL(blob))
      .catch((e) => {
        cache.current.delete(p.id);
        if (e instanceof Error && e.message === "access") {
          setCatalog(null);
          setStatus("denied");
        }
        throw e;
      });
    cache.current.set(p.id, pending);
    return pending;
  }, []);
  const episodes = useMemo(
    () => [
      ...new Map(
        (catalog?.pages || [])
          .filter((p) => season === "all" || String(p.season) === season)
          .map((p) => [`${p.season}-${p.episode}`, p]),
      ).values(),
    ],
    [catalog, season],
  );
  const visible = useMemo(
    () =>
      (catalog?.pages || []).filter(
        (p) =>
          (season === "all" || String(p.season) === season) &&
          (episode === "all" || `${p.season}-${p.episode}` === episode) &&
          (edition === "all" || (edition === "current" ? p.current : !p.current)),
      ),
    [catalog, season, episode, edition],
  );
  const current = visible.find((p) => p.id === selected) || visible[0];
  const index = current ? visible.indexOf(current) : -1;
  useEffect(() => {
    if (!current || !userId) return;
    try {
      localStorage.setItem("gridiron-comic-position:" + userId, current.id);
      window.history.replaceState(window.history.state, "", `#page=${current.id}`);
    } catch {}
  }, [current, userId]);
  const move = useCallback(
    (delta: number) => {
      const next = visible[index + delta];
      if (next) {
        setSelected(next.id);
        setZoom(false);
      }
    },
    [visible, index],
  );
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,select,textarea,button,[contenteditable=true]"))
        return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [move]);
  if (status === "denied") return <AccessDenied area="The Gridiron Zero comic library" />;
  return (
    <main className="min-h-screen bg-[#0c1015] text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-6 lg:px-9">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-amber-300">
            Astralnaut Studios · Admin library
          </p>
          <h1 className="mt-2 text-3xl font-black italic tracking-tight">
            GRIDIRON <span className="text-amber-300">ZERO</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {catalog
              ? `${catalog.counts.total} produced pages · ${catalog.counts.current} latest pages · ${catalog.counts.earlier} earlier versions`
              : "Private comic production library"}
          </p>
        </div>
        <nav className="flex gap-2">
          <Link to="/admin/gridiron-zero" className={control}>
            Story Bible
          </Link>
          <Link to="/admin" className={control}>
            ← Admin
          </Link>
        </nav>
      </header>
      {status === "loading" && (
        <p role="status" className="p-12 text-center">
          Verifying admin access…
        </p>
      )}
      {status === "error" && (
        <div role="alert" className="p-12 text-center">
          <p>The comic library could not load.</p>
          <button className={control + " mt-4"} onClick={() => setRetry((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}
      {status === "ready" && catalog && (
        <div className="mx-auto grid max-w-[1800px] lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-white/10 p-5 lg:border-r">
            <h2 className="text-lg font-semibold">Your library</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
              <label className="text-xs text-slate-400">
                Season
                <select
                  className={control + " mt-1 w-full bg-slate-900 text-slate-100"}
                  value={season}
                  onChange={(e) => {
                    setSeason(e.target.value);
                    setEpisode("all");
                  }}
                >
                  <option value="all">All seasons</option>
                  {[...new Set(catalog.pages.map((p) => p.season))].map((s) => (
                    <option key={s} value={s}>
                      Season {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Episode
                <select
                  className={control + " mt-1 w-full bg-slate-900 text-slate-100"}
                  value={episode}
                  onChange={(e) => setEpisode(e.target.value)}
                >
                  <option value="all">All episodes</option>
                  {episodes.map((p) => (
                    <option key={`${p.season}-${p.episode}`} value={`${p.season}-${p.episode}`}>
                      S{p.season} E{p.episode} — {p.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-2 text-xs text-slate-400 lg:col-span-1">
                Edition
                <select
                  className={control + " mt-1 w-full bg-slate-900 text-slate-100"}
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                >
                  <option value="current">Latest produced pages</option>
                  <option value="earlier">Earlier versions & storyboards</option>
                  <option value="all">Every produced page</option>
                </select>
              </label>
            </div>
            <p className="my-4 text-xs text-slate-400">{visible.length} pages in this selection</p>
            <div
              className="flex max-h-48 gap-3 overflow-auto p-1 lg:grid lg:max-h-[65vh] lg:grid-cols-2"
              aria-label="Comic pages"
            >
              {visible.map((p) => (
                <button
                  key={p.id}
                  aria-label={`Season ${p.season}, episode ${p.episode}, page ${p.page}, ${p.edition}`}
                  aria-current={p.id === current?.id ? "page" : undefined}
                  onClick={() => {
                    setSelected(p.id);
                    setZoom(false);
                  }}
                  className={`w-24 shrink-0 overflow-hidden rounded-lg border text-left lg:w-auto ${p.id === current?.id ? "border-amber-300 ring-1 ring-amber-300" : "border-white/20"}`}
                >
                  <PrivateImage page={p} load={loadImage} thumbnail />
                  <span className="block p-2 text-[10px]">
                    S{p.season} E{p.episode} · P{p.page}
                    {p.current ? "" : " · Earlier"}
                  </span>
                </button>
              ))}
            </div>
          </aside>
          <section className="min-w-0">
            <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#101720]/95 p-3 backdrop-blur">
              <button className={control} disabled={index <= 0} onClick={() => move(-1)}>
                ← Previous
              </button>
              <span className="px-2 text-sm text-slate-400" aria-live="polite">
                {index + 1} / {visible.length}
              </span>
              <button
                className={control}
                disabled={index >= visible.length - 1}
                onClick={() => move(1)}
              >
                Next →
              </button>
              <button
                className={control + " ml-auto"}
                aria-pressed={zoom}
                onClick={() => setZoom((z) => !z)}
              >
                {zoom ? "Fit page" : "Zoom"}
              </button>
              <button className={control} onClick={() => setRetry((n) => n + 1)}>
                Refresh library
              </button>
            </div>
            {current ? (
              <>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[.18em] text-amber-300">
                    Season {current.season} / Episode {current.episode}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{current.title}</h2>
                  <p className="mt-2 text-xs text-slate-400">
                    Page {current.page} · {current.edition} ·{" "}
                    {current.current ? "latest produced" : "earlier version"}
                  </p>
                  {current.note && (
                    <p className="mt-3 border-l-2 border-amber-300 bg-amber-300/10 p-3 text-xs text-amber-100">
                      {current.note}
                    </p>
                  )}
                </div>
                <div className="overflow-auto px-2 pb-6 sm:px-5">
                  <div className={zoom ? "w-[1536px]" : "mx-auto max-w-[1024px]"}>
                    <PrivateImage key={current.id} page={current} load={loadImage} />
                  </div>
                </div>
                <div className="flex justify-center gap-4 pb-8">
                  <button className={control} disabled={index <= 0} onClick={() => move(-1)}>
                    ← Previous page
                  </button>
                  <button
                    className={control}
                    disabled={index >= visible.length - 1}
                    onClick={() => move(1)}
                  >
                    Next page →
                  </button>
                </div>
              </>
            ) : (
              <p className="p-10">No pages in this selection.</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
function PrivateImage({
  page,
  load,
  thumbnail = false,
}: {
  page: Page;
  load: (p: Page) => Promise<string>;
  thumbnail?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState(""),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let observer: IntersectionObserver | undefined;
    setSrc("");
    setError(false);
    const run = () => {
      observer?.disconnect();
      load(page)
        .then((url) => {
          if (active) setSrc(url);
        })
        .catch(() => {
          if (active) setError(true);
        });
    };
    if (thumbnail && ref.current && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) run();
        },
        { rootMargin: "100px" },
      );
      observer.observe(ref.current);
    } else run();
    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [page, load, thumbnail, retry]);
  return (
    <div
      ref={ref}
      className="relative min-h-12 bg-slate-900"
      style={{ aspectRatio: src ? undefined : "2 / 3" }}
    >
      {src ? (
        <img
          src={src}
          alt={
            thumbnail
              ? ""
              : `Season ${page.season}, episode ${page.episode}, page ${page.page}: ${page.title}`
          }
          onError={() => {
            setError(true);
            setSrc("");
          }}
          className="block h-auto w-full"
          draggable={false}
        />
      ) : error ? (
        <div role="alert" className="p-3 text-center text-xs">
          Page unavailable
          {!thumbnail && (
            <button className={control + " mt-3"} onClick={() => setRetry((n) => n + 1)}>
              Retry image
            </button>
          )}
        </div>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-xs text-slate-500"
          role={thumbnail ? undefined : "status"}
        >
          Loading page…
        </div>
      )}
    </div>
  );
}
