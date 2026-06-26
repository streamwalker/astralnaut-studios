import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArchiveShell, ArchivePageHeader, ArchiveCard } from "@/components/archive/ArchiveShell";
import { CHRONO_EVENTS, SERIES_COLOR, type ChronoEvent } from "@/components/archive/archive-data";

export const Route = createFileRoute("/archive/timeline")({
  head: () => ({
    meta: [
      { title: "Chronological Records — Astralnaut Archive" },
      { name: "description", content: "Plotted events across the connected timelines." },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  const sorted = useMemo(() => [...CHRONO_EVENTS].sort((a, b) => a.sortYear - b.sortYear), []);
  const [active, setActive] = useState<ChronoEvent>(sorted[0]);

  // Map sortYear to a 0..1 position along the rail using rank order so
  // BCE and modern events stay legible without log scaling.
  const positions = useMemo(() => {
    const n = sorted.length;
    return new Map(sorted.map((e, i) => [e.id, n === 1 ? 0.5 : i / (n - 1)]));
  }, [sorted]);

  return (
    <ArchiveShell>
      <ArchivePageHeader codename="ARC-CHR" title="Chronological Records" />
      <p className="mb-8 max-w-2xl text-sm text-[color:var(--hud-fg)]/80">
        Recovered events plotted across the connected timelines. Drag along the rail or
        tap an event to open its file. Linked artifacts open in Recovered Evidence.
      </p>

      <div className="archive-bracket relative mb-8 px-4 pb-10 pt-16">
        {/* Rail */}
        <div className="relative h-px w-full bg-gradient-to-r from-[color:var(--hud-accent)]/10 via-[color:var(--hud-accent)] to-[color:var(--hud-accent)]/10">
          {sorted.map((e) => {
            const left = (positions.get(e.id) ?? 0) * 100;
            const isActive = e.id === active.id;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setActive(e)}
                aria-label={`${e.date} — ${e.title}`}
                className="group absolute -top-2 -translate-x-1/2"
                style={{ left: `${left}%` }}
              >
                <span
                  className={`block h-4 w-4 rounded-full border-2 transition ${
                    isActive
                      ? "scale-125 border-white shadow-[0_0_12px_var(--hud-accent)]"
                      : "border-[color:var(--hud-accent)] group-hover:scale-110"
                  }`}
                  style={{ background: SERIES_COLOR[e.series] }}
                />
                <span
                  className={`absolute left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] transition ${
                    isActive
                      ? "text-[color:var(--hud-accent)]"
                      : "text-[color:var(--hud-dim)] group-hover:text-[color:var(--hud-fg)]"
                  }`}
                >
                  {e.date}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ArchiveCard title={`${active.date} · ${active.series}`} stamp="FILE">
          <h2 className="font-mono text-2xl font-bold uppercase tracking-tight">
            {active.title}
          </h2>
          <p className="mt-3 text-sm">{active.body}</p>
          {active.artifactId && (
            <Link
              to="/archive/evidence"
              className="mt-4 inline-block border border-[color:var(--hud-accent)] bg-[color:var(--hud-accent)]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.3em] text-[color:var(--hud-accent)] hover:bg-[color:var(--hud-accent)]/20"
            >
              → Open artifact {active.artifactId}
            </Link>
          )}
        </ArchiveCard>

        <div className="archive-bracket p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--hud-accent)]">
            Index
          </h3>
          <ul className="space-y-1 text-sm">
            {sorted.map((e) => {
              const isActive = e.id === active.id;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setActive(e)}
                    className={`flex w-full items-center gap-3 border-l-2 px-2 py-1.5 text-left transition ${
                      isActive
                        ? "border-[color:var(--hud-accent)] bg-[color:var(--hud-accent)]/10"
                        : "border-transparent hover:border-[color:var(--hud-accent)]/40 hover:bg-white/5"
                    }`}
                  >
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: SERIES_COLOR[e.series] }}
                    />
                    <span className="font-mono text-[10px] uppercase text-[color:var(--hud-dim)]">
                      {e.date}
                    </span>
                    <span className="truncate">{e.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </ArchiveShell>
  );
}
