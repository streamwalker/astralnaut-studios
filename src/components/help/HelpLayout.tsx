import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, GraduationCap, Compass } from "lucide-react";
import type { HelpTrack } from "@/content/help/types";
import { writeLS } from "@/lib/useLocalStorage";

type Props = {
  track: HelpTrack;
  activeSlug?: string;
  children: React.ReactNode;
  /** Path to the matching training course. */
  coursePath: string;
};

export function HelpLayout({ track, activeSlug, children, coursePath }: Props) {
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const filter = q.trim().toLowerCase();
    const filtered = !filter
      ? track.articles
      : track.articles.filter(
          (a) =>
            a.title.toLowerCase().includes(filter) ||
            a.summary.toLowerCase().includes(filter) ||
            a.body.toLowerCase().includes(filter),
        );
    const map = new Map<string, typeof filtered>();
    filtered.forEach((a) => {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    });
    return Array.from(map.entries());
  }, [q, track.articles]);

  const restartTour = () => {
    writeLS(`tour:${track.id === "admin" ? "admin" : "home"}:done`, false);
    if (typeof window !== "undefined") {
      window.location.href = track.id === "admin" ? "/admin" : "/";
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse at top, rgba(34,211,255,0.06), transparent 60%)" }}
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--gold)]">
              {track.label}
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-[var(--ink)]">
              Find what you need
            </h1>
          </div>

          <label className="relative block">
            <Search
              width={14}
              height={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink2)]"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles…"
              className="w-full rounded-md border border-[var(--border-line)] bg-black/40 py-2 pl-8 pr-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink2)] focus:border-[var(--neon)] focus:outline-none"
            />
          </label>

          <div className="space-y-1">
            <button
              onClick={restartTour}
              className="flex w-full items-center gap-2 rounded-md border border-[var(--border-line)] px-3 py-2 text-left text-xs font-semibold text-[var(--ink2)] hover:border-[var(--neon)] hover:text-[var(--neon)]"
            >
              <Compass width={14} height={14} /> Restart guided tour
            </button>
            <Link
              to={coursePath}
              className="flex w-full items-center gap-2 rounded-md border border-[var(--border-line)] px-3 py-2 text-left text-xs font-semibold text-[var(--ink2)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              <GraduationCap width={14} height={14} /> Training course
            </Link>
          </div>

          <nav className="space-y-4">
            {groups.length === 0 && (
              <div className="text-sm text-[var(--ink2)]">No articles match "{q}".</div>
            )}
            {groups.map(([cat, items]) => (
              <div key={cat}>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-[2px] text-[var(--ink2)]">
                  {cat}
                </div>
                <ul className="space-y-0.5">
                  {items.map((a) => {
                    const active = a.slug === activeSlug;
                    return (
                      <li key={a.slug}>
                        <Link
                          to={`${track.basePath}/$slug` as "/help/$slug"}
                          params={{ slug: a.slug }}
                          className={`block rounded px-2 py-1.5 text-sm ${
                            active
                              ? "bg-white/5 font-semibold text-[var(--neon)]"
                              : "text-[var(--ink2)] hover:bg-white/5 hover:text-[var(--ink)]"
                          }`}
                        >
                          {a.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
