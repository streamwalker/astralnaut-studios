import { createFileRoute } from "@tanstack/react-router";
import { ArchiveShell, ArchivePageHeader, ArchiveCard } from "@/components/archive/ArchiveShell";

export const Route = createFileRoute("/archive/evidence")({
  head: () => ({ meta: [{ title: "Recovered Evidence — Astralnaut Archive" }] }),
  component: () => (
    <ArchiveShell>
      <ArchivePageHeader codename="ARC-EVD" title="Recovered Evidence" />
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--hud-fg)]/80">
        Concept renderings, artifact scans, and field photography catalogued by the
        recovery teams. Higher-resolution scans unlock at Researcher clearance.
      </p>
      <ArchiveCard title="Vault empty" stamp="SECURE">
        <p>The first evidence drop is queued for the next briefing cycle.</p>
      </ArchiveCard>
    </ArchiveShell>
  ),
});
