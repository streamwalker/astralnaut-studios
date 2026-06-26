import { createFileRoute } from "@tanstack/react-router";
import { ArchiveShell, ArchivePageHeader, ArchiveCard } from "@/components/archive/ArchiveShell";

export const Route = createFileRoute("/archive/timeline")({
  head: () => ({ meta: [{ title: "Chronological Records — Astralnaut Archive" }] }),
  component: () => (
    <ArchiveShell>
      <ArchivePageHeader codename="ARC-CHR" title="Chronological Records" />
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--hud-fg)]/80">
        Events plotted across the connected timelines. An interactive globe and zoomable
        timeline land in Phase III.
      </p>
      <div className="space-y-3">
        {[
          { d: "—25,000 BCE", t: "The Nerrian Galaxy falls silent." },
          { d: "—12,000 BCE", t: "Last verified Atlantean transmission." },
          { d: "1947 CE", t: "Recovery event. Roswell, NM." },
          { d: "Present day", t: "The Archive opens to the public." },
        ].map((e) => (
          <ArchiveCard key={e.d} title={e.d}>
            <p>{e.t}</p>
          </ArchiveCard>
        ))}
      </div>
    </ArchiveShell>
  ),
});
