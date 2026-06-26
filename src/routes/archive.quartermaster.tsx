import { createFileRoute, Link } from "@tanstack/react-router";
import { ArchiveShell, ArchivePageHeader, ArchiveCard } from "@/components/archive/ArchiveShell";

export const Route = createFileRoute("/archive/quartermaster")({
  head: () => ({ meta: [{ title: "Quartermaster — Astralnaut Archive" }] }),
  component: () => (
    <ArchiveShell>
      <ArchivePageHeader codename="ARC-QM" title="Quartermaster" />
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--hud-fg)]/80">
        Field gear, challenge coins, classified folders, and credentials. Stock pulled from
        the standard storefront and re-issued through the Quartermaster.
      </p>
      <ArchiveCard title="Inventory link">
        <Link to="/shop" className="text-[color:var(--hud-accent)] hover:underline">
          → Open active inventory
        </Link>
      </ArchiveCard>
    </ArchiveShell>
  ),
});
