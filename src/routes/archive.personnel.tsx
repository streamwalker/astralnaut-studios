import { createFileRoute } from "@tanstack/react-router";
import { ArchiveShell, ArchivePageHeader, ArchiveCard } from "@/components/archive/ArchiveShell";

export const Route = createFileRoute("/archive/personnel")({
  head: () => ({ meta: [{ title: "Personnel Files — Astralnaut Archive" }] }),
  component: () => (
    <ArchiveShell>
      <ArchivePageHeader codename="ARC-PSF" title="Personnel Files" classification="RESTRICTED // PARTIAL ACCESS" />
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--hud-fg)]/80">
        Identified individuals across all three known timelines. Records below your clearance
        level appear <span className="archive-redacted">REDACTED</span>.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Jon Monarch", "Father Blaire", "The Anääh", "Project Lazarus", "Subject 7", "Director ??"].map((n) => (
          <ArchiveCard key={n} title="DOSSIER">
            <div className="font-mono text-lg font-bold">{n}</div>
            <div className="mt-2 text-xs text-[color:var(--hud-dim)]">Status: <span className="archive-redacted">CLASSIFIED</span></div>
          </ArchiveCard>
        ))}
      </div>
    </ArchiveShell>
  ),
});
