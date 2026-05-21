import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/growth-package")({
  head: () => ({ meta: [{ title: "Growth Package — Astralnaut Studios" }] }),
  component: GrowthPackagePage,
});

const STRATEGY_SECTIONS = [
  "Executive Summary",
  "The Core Thesis",
  "The Three Phases",
  "North Star Metric & Funnel Math",
  "Phased Roadmap T0 → 1M (4 phases)",
  "Seven Growth Channels",
  "Content Engine",
  "Conversion Architecture",
  "Retention Engine",
  "Brand & PR Strategy",
  "90-Day Sprint Calendar",
  "KPI Dashboard",
  "Budget Models (Bootstrap / Lean / Capitalized)",
  "Risk Register",
  "Execution Principles",
];

const PLAYBOOK_PHASES = [
  { name: "Phase 1 — Ignition", range: "Tactics 1–10", ship: "Ship by week 4" },
  { name: "Phase 2 — Validation", range: "Tactics 11–20", ship: "Ship by month 4" },
  { name: "Phase 3 — Velocity", range: "Tactics 21–30", ship: "Ship by month 9" },
  { name: "Phase 4 — Inflection", range: "Tactics 31–40", ship: "Ship by month 15" },
];
const PLAYBOOK_FIELDS = ["Phase", "Channel", "Cost", "Cadence", "Owner", "Why", "How", "KPI"];

function GrowthPackagePage() {
  const [openCard, setOpenCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/admin" className="text-xs text-[var(--mute)] hover:text-[var(--neon)]">
            ← Back to admin
          </Link>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--mute)]">Growth Package</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="eyebrow text-[var(--gold)]">Astralnaut Studios</div>
        <h1 className="mt-2 text-4xl font-black md:text-5xl">Growth Package</h1>
        <p className="mt-3 max-w-2xl text-[var(--ink2)]">
          Strategy. Tactics. Brand. Dashboard. Four deliverables for the path to one million paying subscribers.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          {["Target: 1M subs", "Horizon: 24 months", "Channels: 7", "Tactics: 40"].map((k) => (
            <span key={k} className="rounded-full border border-[var(--gold)]/40 px-3 py-1 text-[var(--gold)]">{k}</span>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {/* Master Strategy */}
          <Card
            title="Master Strategy"
            subtitle="24-month roadmap · 21 tables · 4 phases"
            primary={{ label: "Download .docx", href: "/growth-package/1M-Subscriber-Strategy.docx", download: true }}
            secondary={{ label: openCard === "strategy" ? "Hide summary" : "View summary inline", onClick: () => setOpenCard(openCard === "strategy" ? null : "strategy") }}
          >
            {openCard === "strategy" && (
              <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-[var(--ink2)]">
                {STRATEGY_SECTIONS.map((s) => <li key={s}>{s}</li>)}
              </ol>
            )}
          </Card>

          {/* Tactical Playbook */}
          <Card
            title="Tactical Playbook"
            subtitle="40 tactics · phase-sequenced · executable"
            primary={{ label: "Download .docx", href: "/growth-package/1M-Subscriber-Tactical-Playbook.docx", download: true }}
            secondary={{ label: openCard === "playbook" ? "Hide phases" : "View phase breakdown", onClick: () => setOpenCard(openCard === "playbook" ? null : "playbook") }}
          >
            {openCard === "playbook" && (
              <div className="mt-4 space-y-3 text-sm">
                {PLAYBOOK_PHASES.map((p) => (
                  <div key={p.name} className="rounded-md border border-white/10 bg-[var(--bg2)] p-3">
                    <div className="font-bold">{p.name}</div>
                    <div className="text-[var(--ink2)]">{p.range} · {p.ship}</div>
                  </div>
                ))}
                <div className="pt-2 text-xs text-[var(--mute)]">
                  Each tactic includes: {PLAYBOOK_FIELDS.join(" · ")}
                </div>
              </div>
            )}
          </Card>

          {/* Studio Landing */}
          <Card
            title="Studio Brand Landing Page"
            subtitle="Public · /astralnaut-studios"
            primary={{ label: "Preview", to: "/astralnaut-studios" }}
            secondary={{ label: "Open in new tab", href: "/astralnaut-studios", target: "_blank" }}
          />

          {/* Dashboard */}
          <Card
            title="Growth Dashboard"
            subtitle="Internal · /admin/growth · auth required"
            primary={{ label: "Open dashboard", to: "/growth" }}
            secondary={{ label: "Export KPI history (CSV)", to: "/growth", search: { export: "1" } as any }}
          />
        </div>

        <footer className="mt-16 flex flex-wrap items-center gap-6 border-t border-white/10 pt-6 text-sm text-[var(--mute)]">
          <a href="https://realworldcomics.com" target="_blank" rel="noreferrer" className="hover:text-[var(--neon)]">Companion site →</a>
          <a href="mailto:streamwalkersceo@gmail.com" className="hover:text-[var(--neon)]">Contact</a>
        </footer>
      </main>
    </div>
  );
}

type Action =
  | { label: string; href: string; download?: boolean; target?: string; to?: undefined; onClick?: undefined; search?: undefined }
  | { label: string; to: string; search?: any; href?: undefined; download?: undefined; target?: undefined; onClick?: undefined }
  | { label: string; onClick: () => void; href?: undefined; to?: undefined; download?: undefined; target?: undefined; search?: undefined };

function Card({
  title, subtitle, primary, secondary, children,
}: { title: string; subtitle: string; primary: Action; secondary: Action; children?: React.ReactNode }) {
  return (
    <div className="card-rwc p-6">
      <div className="text-xs uppercase tracking-[0.16em] text-[var(--mute)]">{subtitle}</div>
      <h3 className="mt-1 text-2xl font-bold">{title}</h3>
      <div className="mt-5 flex flex-wrap gap-3">
        <ActionBtn action={primary} primary />
        <ActionBtn action={secondary} />
      </div>
      {children}
    </div>
  );
}

function ActionBtn({ action, primary }: { action: Action; primary?: boolean }) {
  const cls = primary
    ? "rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black hover:brightness-110"
    : "rounded-md border border-white/15 px-4 py-2 text-sm text-[var(--ink)] hover:border-[var(--neon)] hover:text-[var(--neon)]";
  if ("onClick" in action && action.onClick) {
    return <button type="button" onClick={action.onClick} className={cls}>{action.label}</button>;
  }
  if ("to" in action && action.to) {
    return <Link to={action.to as any} search={action.search} className={cls}>{action.label}</Link>;
  }
  return (
    <a href={action.href} download={action.download} target={action.target} rel={action.target ? "noreferrer" : undefined} className={cls}>
      {action.label}
    </a>
  );
}
