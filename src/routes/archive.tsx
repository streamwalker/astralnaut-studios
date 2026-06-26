import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArchiveShell, ArchiveCard } from "@/components/archive/ArchiveShell";
import { BootSequence } from "@/components/archive/BootSequence";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Astralnaut Archive — Secure Terminal" },
      { name: "description", content: "Classified archive of three connected fictional universes. Access requires clearance. You have been granted PUBLIC level." },
      { property: "og:title", content: "The Astralnaut Archive" },
      { property: "og:description", content: "A secure terminal into the Astralnaut Studios universes." },
    ],
  }),
  component: ArchiveLanding,
});

const TIMELINES = [
  { code: "BA-001", name: "Battlefield Atlantis", status: "ACTIVE", to: "/battlefield-atlantis" },
  { code: "DA-001", name: "Darker Ages", status: "ACTIVE", to: "/darker-ages" },
  { code: "CA-001", name: "Children of Aquarius", status: "ACTIVE", to: "/children-of-aquarius" },
] as const;

function ArchiveLanding() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("archive-booted") === "1") setBooted(true);
  }, []);

  const finishBoot = () => {
    if (typeof window !== "undefined") sessionStorage.setItem("archive-booted", "1");
    setBooted(true);
  };

  if (!booted) {
    return (
      <div className="archive-root">
        <BootSequence onDone={finishBoot} />
      </div>
    );
  }

  return (
    <ArchiveShell>
      <section className="mb-12">
        <div className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--hud-dim)]">
          // welcome, observer
        </div>
        <h1 className="mt-2 font-mono text-4xl font-bold uppercase tracking-tight sm:text-6xl">
          The Astralnaut <span className="text-[color:var(--hud-accent)]">Archive</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-[color:var(--hud-fg)]/80 sm:text-base">
          You have entered a public-access terminal of the Streamwalkers intelligence network.
          Three connected timelines are currently visible at your clearance level. Higher
          clearance unlocks recovered evidence, redacted personnel files, and field reports.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.25em]">
          <Link
            to="/archive/documents"
            className="border border-[color:var(--hud-accent)] bg-[color:var(--hud-accent)]/10 px-4 py-2 text-[color:var(--hud-accent)] transition hover:bg-[color:var(--hud-accent)]/25"
          >
            Open Documents
          </Link>
          <Link
            to="/archive/clearance"
            className="border border-[color:var(--hud-dim)] px-4 py-2 text-[color:var(--hud-fg)] transition hover:border-[color:var(--hud-accent)]"
          >
            Raise Clearance
          </Link>
        </div>
      </section>

      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-[color:var(--hud-dim)]">
          <span>Known Timelines</span>
          <span>{TIMELINES.length} detected</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {TIMELINES.map((t) => (
            <Link key={t.code} to={t.to} className="block">
              <ArchiveCard title={t.code} stamp={t.status}>
                <div className="font-mono text-lg font-bold uppercase tracking-tight">
                  {t.name}
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-[color:var(--hud-dim)]">
                  Tap to open dossier →
                </div>
              </ArchiveCard>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ArchiveCard title="Latest Briefing">
          <p>Transmission queue empty. Awaiting analyst upload.</p>
          <Link to="/archive/briefings" className="mt-3 inline-block text-xs uppercase tracking-[0.25em] text-[color:var(--hud-accent)] hover:underline">
            → All briefings
          </Link>
        </ArchiveCard>
        <ArchiveCard title="Recent Activity" stamp="LIVE">
          <ul className="space-y-1 text-xs">
            <li>· Observer count steady</li>
            <li>· Timeline integrity nominal</li>
            <li>· No incident reports filed</li>
          </ul>
        </ArchiveCard>
      </div>
    </ArchiveShell>
  );
}
