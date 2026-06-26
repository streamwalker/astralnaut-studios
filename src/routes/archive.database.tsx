import { createFileRoute } from "@tanstack/react-router";
import { ArchiveShell, ArchivePageHeader, ArchiveCard } from "@/components/archive/ArchiveShell";

export const Route = createFileRoute("/archive/database")({
  head: () => ({ meta: [{ title: "Intelligence Database — Astralnaut Archive" }] }),
  component: () => (
    <ArchiveShell>
      <ArchivePageHeader codename="ARC-DB" title="Intelligence Database" />
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--hud-fg)]/80">
        Cross-referenced lore index. A natural-language terminal (callsign: ARCHIVE) comes
        online in a future build.
      </p>
      <ArchiveCard title="Terminal offline" stamp="OFFLINE">
        <p>ARCHIVE AI is undergoing calibration. Queries will queue locally until uplink is restored.</p>
      </ArchiveCard>
    </ArchiveShell>
  ),
});
