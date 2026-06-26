import { Link, useLocation } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import "./archive.css";

const NAV = [
  { to: "/archive/briefings", label: "Briefings" },
  { to: "/archive/personnel", label: "Personnel" },
  { to: "/archive/evidence", label: "Evidence" },
  { to: "/archive/documents", label: "Documents" },
  { to: "/archive/database", label: "Database" },
  { to: "/archive/timeline", label: "Timeline" },
  { to: "/archive/quartermaster", label: "Quartermaster" },
  { to: "/archive/clearance", label: "Clearance" },
  { to: "/archive/wallet", label: "Wallet" },
] as const;

export function ArchiveShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toUTCString().replace("GMT", "ZULU").split(" ").slice(-3).join(" "),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="archive-root">
      {/* Top status bar */}
      <header className="border-b border-[color:var(--hud-accent)]/30 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[10px] uppercase tracking-[0.25em] sm:text-xs">
          <Link to="/archive" className="flex items-center gap-2 text-[color:var(--hud-accent)]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[color:var(--hud-accent)]" />
            <span className="font-bold">ASTRALNAUT ARCHIVE</span>
            <span className="hidden text-[color:var(--hud-dim)] sm:inline">// SECURE TERMINAL</span>
          </Link>
          <div className="flex items-center gap-3 text-[color:var(--hud-dim)]">
            <span>CLR · OBSERVER</span>
            <span>{time}</span>
            <Link to="/" className="text-[color:var(--hud-dim)] hover:text-[color:var(--hud-accent)]">
              ↗ EXIT
            </Link>
          </div>
        </div>
        <nav className="border-t border-[color:var(--hud-accent)]/10">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-1 text-[10px] uppercase tracking-[0.2em] sm:text-xs">
            {NAV.map((n) => {
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`whitespace-nowrap px-3 py-1 transition-colors ${
                    active
                      ? "bg-[color:var(--hud-accent)]/15 text-[color:var(--hud-accent)]"
                      : "text-[color:var(--hud-dim)] hover:text-[color:var(--hud-fg)]"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>

      <footer className="mt-16 border-t border-[color:var(--hud-accent)]/20 bg-black/60 px-4 py-3 text-center text-[10px] uppercase tracking-[0.25em] text-[color:var(--hud-dim)]">
        Streamwalkers Corp · Astralnaut Studios · Archive build 0.1 · For authorized personnel
      </footer>
    </div>
  );
}

export function ArchivePageHeader({
  codename,
  title,
  classification = "UNCLASSIFIED // PUBLIC",
}: {
  codename: string;
  title: string;
  classification?: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-[color:var(--hud-dim)]">
        <span>FILE · {codename}</span>
        <span className="text-[color:var(--hud-warn)]">{classification}</span>
      </div>
      <h1 className="mt-2 font-mono text-3xl font-bold uppercase tracking-tight text-[color:var(--hud-fg)] sm:text-5xl">
        {title}
      </h1>
      <div className="mt-3 h-px w-full bg-gradient-to-r from-[color:var(--hud-accent)] via-[color:var(--hud-accent)]/30 to-transparent" />
    </div>
  );
}

export function ArchiveCard({
  title,
  children,
  stamp,
}: {
  title?: string;
  children: ReactNode;
  stamp?: string;
}) {
  return (
    <section className="archive-bracket relative p-5">
      {stamp && (
        <div className="absolute -top-3 right-4">
          <span className="archive-stamp">{stamp}</span>
        </div>
      )}
      {title && (
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--hud-accent)]">
          {title}
        </h3>
      )}
      <div className="text-sm leading-relaxed text-[color:var(--hud-fg)]/90">{children}</div>
    </section>
  );
}
