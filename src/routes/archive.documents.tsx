import { createFileRoute, Link } from "@tanstack/react-router";
import { ArchiveShell, ArchivePageHeader, ArchiveCard } from "@/components/archive/ArchiveShell";

export const Route = createFileRoute("/archive/documents")({
  head: () => ({ meta: [{ title: "Recovered Documents — Astralnaut Archive" }] }),
  component: () => (
    <ArchiveShell>
      <ArchivePageHeader codename="ARC-DOC" title="Recovered Documents" />
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--hud-fg)]/80">
        Primary-source narratives recovered from each timeline. The standard reader is
        available now; classified reader mode unlocks at Field Agent clearance.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/battlefield-atlantis"><ArchiveCard title="BA-001" stamp="ACTIVE"><div className="font-mono text-lg font-bold">Battlefield Atlantis</div></ArchiveCard></Link>
        <Link to="/darker-ages"><ArchiveCard title="DA-001" stamp="ACTIVE"><div className="font-mono text-lg font-bold">Darker Ages</div></ArchiveCard></Link>
        <Link to="/children-of-aquarius"><ArchiveCard title="CA-001" stamp="ACTIVE"><div className="font-mono text-lg font-bold">Children of Aquarius</div></ArchiveCard></Link>
      </div>
    </ArchiveShell>
  ),
});
