import { createFileRoute } from "@tanstack/react-router";
import { ArchiveShell, ArchivePageHeader, ArchiveCard } from "@/components/archive/ArchiveShell";

export const Route = createFileRoute("/archive/briefings")({
  head: () => ({ meta: [{ title: "Intelligence Briefings — Astralnaut Archive" }] }),
  component: () => (
    <ArchiveShell>
      <ArchivePageHeader codename="ARC-BRF" title="Intelligence Briefings" />
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--hud-fg)]/80">
        Periodic intelligence releases from the Astralnaut analyst pool. Subscribe to the
        Transmission Log to receive new briefings as they are declassified.
      </p>
      <ArchiveCard title="No briefings published yet" stamp="PENDING">
        <p>This channel will activate once the first transmission is cleared for release.</p>
      </ArchiveCard>
    </ArchiveShell>
  ),
});
