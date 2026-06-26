import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArchiveShell, ArchivePageHeader, ArchiveCard } from "@/components/archive/ArchiveShell";
import { ArtifactGlobe } from "@/components/archive/ArtifactGlobe";
import { ARTIFACTS, type Artifact, SERIES_COLOR } from "@/components/archive/archive-data";

export const Route = createFileRoute("/archive/evidence")({
  head: () => ({
    meta: [
      { title: "Recovered Evidence — Astralnaut Archive" },
      {
        name: "description",
        content:
          "Interactive recovery map. Browse pinned artifacts across the Astralnaut timelines.",
      },
    ],
  }),
  component: EvidencePage,
  ssr: false,
});

const ALL = "All timelines" as const;
type SeriesFilter = typeof ALL | Artifact["series"];

function EvidencePage() {
  const [filter, setFilter] = useState<SeriesFilter>(ALL);
  const [selected, setSelected] = useState<Artifact | null>(null);

  const filtered = useMemo(
    () => (filter === ALL ? ARTIFACTS : ARTIFACTS.filter((a) => a.series === filter)),
    [filter],
  );

  return (
    <ArchiveShell>
      <ArchivePageHeader codename="ARC-EVD" title="Recovered Evidence" />
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--hud-fg)]/80">
        Live recovery map of catalogued artifacts. Rotate the globe, click a pin to open
        the dossier. Items above your clearance are visible but redacted.
      </p>

      <div className="mb-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.25em]">
        {[ALL, "Battlefield Atlantis", "Darker Ages", "Children of Aquarius", "Cross-Timeline"].map(
          (label) => {
            const active = label === filter;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setFilter(label as SeriesFilter)}
                className={`border px-3 py-1 transition ${
                  active
                    ? "border-[color:var(--hud-accent)] bg-[color:var(--hud-accent)]/15 text-[color:var(--hud-accent)]"
                    : "border-[color:var(--hud-dim)]/40 text-[color:var(--hud-dim)] hover:border-[color:var(--hud-accent)] hover:text-[color:var(--hud-fg)]"
                }`}
              >
                {label}
              </button>
            );
          },
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <ArtifactGlobe onSelect={setSelected} selectedId={selected?.id} />

        <div className="space-y-3">
          <ArchiveCard title={selected ? `${selected.code} · Dossier` : "Awaiting selection"} stamp={selected?.classification}>
            {selected ? (
              <>
                <div className="font-mono text-lg font-bold uppercase tracking-tight">
                  {selected.name}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[color:var(--hud-dim)]">
                  {selected.year} · {selected.series}
                </div>
                {selected.classification === "PUBLIC" || selected.classification === "RESEARCHER" ? (
                  <p className="mt-3 text-sm">{selected.summary}</p>
                ) : (
                  <p className="mt-3 text-sm text-[color:var(--hud-dim)]">
                    ████████ {selected.classification.replace("_", " ")} clearance required to
                    decrypt. Visit{" "}
                    <a href="/archive/clearance" className="text-[color:var(--hud-accent)] underline">
                      /clearance
                    </a>{" "}
                    to request escalation.
                  </p>
                )}
              </>
            ) : (
              <p>Click a pin on the globe to open its dossier.</p>
            )}
          </ArchiveCard>

          <div className="archive-bracket p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--hud-accent)]">
              Catalog ({filtered.length})
            </h3>
            <ul className="max-h-[360px] space-y-1 overflow-y-auto pr-1 text-sm">
              {filtered.map((a) => {
                const active = selected?.id === a.id;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(a)}
                      className={`flex w-full items-center gap-3 border-l-2 px-2 py-1.5 text-left transition ${
                        active
                          ? "border-[color:var(--hud-accent)] bg-[color:var(--hud-accent)]/10"
                          : "border-transparent hover:border-[color:var(--hud-accent)]/40 hover:bg-white/5"
                      }`}
                    >
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ background: SERIES_COLOR[a.series] }}
                      />
                      <span className="font-mono text-[10px] uppercase text-[color:var(--hud-dim)]">
                        {a.code}
                      </span>
                      <span className="truncate">{a.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </ArchiveShell>
  );
}
