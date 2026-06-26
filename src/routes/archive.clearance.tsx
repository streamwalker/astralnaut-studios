import { createFileRoute } from "@tanstack/react-router";
import { ArchiveShell, ArchivePageHeader, ArchiveCard } from "@/components/archive/ArchiveShell";

const RANKS = [
  { name: "Observer", xp: 0, desc: "Public access. Boot terminal, view all timelines." },
  { name: "Researcher", xp: 250, desc: "Higher-res evidence, briefing archive." },
  { name: "Field Agent", xp: 1000, desc: "Classified reader mode, redacted dossiers." },
  { name: "Operative", xp: 3000, desc: "ARG missions, hidden coordinates." },
  { name: "Director", xp: 8000, desc: "Production journals, dev commentary." },
  { name: "Founder's Circle", xp: -1, desc: "Kickstarter backers. Permanent clearance." },
];

export const Route = createFileRoute("/archive/clearance")({
  head: () => ({ meta: [{ title: "Clearance — Astralnaut Archive" }] }),
  component: () => (
    <ArchiveShell>
      <ArchivePageHeader codename="ARC-CLR" title="Your Clearance" />
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--hud-fg)]/80">
        Clearance is earned through XP and achievements. Reading documents, completing
        ARG missions, and contributing to the community all raise your rank. Founder's
        Circle is reserved for Kickstarter personnel and is permanent.
      </p>

      <ArchiveCard title="Current rank" stamp="OBSERVER">
        <div className="font-mono text-2xl font-bold">Observer · 0 XP</div>
        <div className="mt-2 h-2 w-full overflow-hidden border border-[color:var(--hud-dim)]">
          <div className="h-full w-[2%] bg-[color:var(--hud-accent)]" />
        </div>
        <div className="mt-2 text-xs text-[color:var(--hud-dim)]">Next rank: Researcher (250 XP)</div>
      </ArchiveCard>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {RANKS.map((r) => (
          <ArchiveCard key={r.name} title={r.name}>
            <div className="text-xs text-[color:var(--hud-dim)]">
              {r.xp < 0 ? "Backer-only" : `${r.xp} XP required`}
            </div>
            <p className="mt-1 text-sm">{r.desc}</p>
          </ArchiveCard>
        ))}
      </div>
    </ArchiveShell>
  ),
});
