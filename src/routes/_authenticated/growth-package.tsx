import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STRATEGY, type Block } from "@/content/growth-strategy";
import { PLAYBOOK } from "@/content/growth-playbook";

type Tab = "strategy" | "playbook" | "studio" | "dashboard";

export const Route = createFileRoute("/_authenticated/growth-package")({
  head: () => ({ meta: [{ title: "Growth Package — Astralnaut Studios" }] }),
  validateSearch: (s: Record<string, unknown>): { tab: Tab } => {
    const t = s.tab;
    return { tab: t === "playbook" || t === "studio" || t === "dashboard" ? t : "strategy" };
  },
  component: GrowthPackagePage,
});

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "strategy", label: "Master Strategy", sub: "24-month roadmap" },
  { id: "playbook", label: "Tactical Playbook", sub: "40 tactics" },
  { id: "studio", label: "Studio Landing", sub: "/astralnaut-studios" },
  { id: "dashboard", label: "Growth Dashboard", sub: "Live KPIs" },
];

function GrowthPackagePage() {
  const { tab } = Route.useSearch();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["growth-package-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  if (roleLoading) {
    return <div className="flex min-h-screen items-center justify-center text-[var(--mute)]">Checking access…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[var(--bg2)] p-8 text-center">
          <h1 className="text-xl font-bold text-[var(--ink)]">Not authorized</h1>
          <p className="mt-2 text-sm text-[var(--mute)]">Admin access is required to view the Growth Package.</p>
          <Link to="/" className="mt-6 inline-block rounded-md border border-white/15 px-4 py-2 text-xs text-[var(--ink2)] hover:border-[var(--neon)] hover:text-[var(--neon)]">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[var(--bg)]/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/admin" className="text-xs text-[var(--mute)] hover:text-[var(--neon)]">
            ← Admin
          </Link>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--mute)]">Growth Package</div>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-6 pb-3">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <Link
                key={t.id}
                to="/growth-package"
                search={{ tab: t.id }}
                className={
                  "rounded-md px-3 py-2 text-sm transition-colors " +
                  (active
                    ? "bg-[var(--gold)] text-black"
                    : "text-[var(--ink2)] hover:bg-white/5 hover:text-[var(--ink)]")
                }
              >
                <div className="font-semibold leading-tight">{t.label}</div>
                <div className={"text-[10px] uppercase tracking-wider " + (active ? "text-black/70" : "text-[var(--mute)]")}>
                  {t.sub}
                </div>
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "strategy" && <DocumentReader title="Master Strategy" blocks={STRATEGY} />}
        {tab === "playbook" && <DocumentReader title="Tactical Playbook" blocks={PLAYBOOK} />}
        {tab === "studio" && <Embedded src="/astralnaut-studios" label="Studio Landing Page" />}
        {tab === "dashboard" && <Embedded src="/growth" label="Growth Dashboard" />}
      </main>
    </div>
  );
}

function DocumentReader({ title, blocks }: { title: string; blocks: Block[] }) {
  const toc = useMemo(
    () =>
      blocks
        .map((b, i) => ({ b, i }))
        .filter(({ b }) => b.k === "h1" || b.k === "h2")
        .map(({ b, i }) => ({ id: `s-${i}`, level: b.k as "h1" | "h2", text: (b as { t: string }).t })),
    [blocks],
  );

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <aside className="hidden md:block">
        <div className="sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto pr-2">
          <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[var(--mute)]">Contents</div>
          <ul className="space-y-1 text-sm">
            {toc.map((t) => (
              <li key={t.id} className={t.level === "h2" ? "pl-3" : ""}>
                <a href={`#${t.id}`} className="text-[var(--ink2)] hover:text-[var(--neon)]">
                  {t.text}
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-6 rounded-md border border-white/15 px-3 py-1.5 text-xs text-[var(--ink2)] hover:border-[var(--neon)] hover:text-[var(--neon)]"
          >
            Print / Save as PDF
          </button>
        </div>
      </aside>

      <article className="min-w-0 max-w-3xl space-y-4 leading-relaxed">
        <div className="eyebrow text-[var(--gold)]">Astralnaut Studios</div>
        <h1 className="text-3xl font-black md:text-4xl">{title}</h1>
        <div className="h-px w-full bg-white/10" />
        {blocks.map((b, i) => renderBlock(b, i))}
      </article>
    </div>
  );
}

function renderBlock(b: Block, i: number) {
  const id = `s-${i}`;
  if (b.k === "h1")
    return (
      <h2 key={i} id={id} className="mt-10 scroll-mt-32 text-2xl font-black text-[var(--gold)] md:text-3xl">
        {b.t}
      </h2>
    );
  if (b.k === "h2")
    return (
      <h3 key={i} id={id} className="mt-8 scroll-mt-32 text-xl font-bold text-[var(--ink)]">
        {b.t}
      </h3>
    );
  if (b.k === "h3")
    return (
      <h4 key={i} className="mt-4 text-base font-bold uppercase tracking-wide text-[var(--ink2)]">
        {b.t}
      </h4>
    );
  if (b.k === "li")
    return (
      <li key={i} className="ml-6 list-disc text-[var(--ink2)]">
        {b.t}
      </li>
    );
  if (b.k === "table")
    return (
      <div key={i} className="table-scroll my-4 -mx-4 rounded-md border border-white/10 px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {b.rows.map((row, ri) => (
              <tr key={ri} className={ri === 0 ? "bg-[var(--bg2)] font-semibold text-[var(--ink)]" : "border-t border-white/10"}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 align-top text-[var(--ink2)]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <p key={i} className="text-[var(--ink2)]">
      {b.t}
    </p>
  );
}

function Embedded({ src, label }: { src: string; label: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--mute)]">Embedded preview · {label}</div>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-[var(--ink)] hover:border-[var(--neon)] hover:text-[var(--neon)]"
        >
          Open in new tab ↗
        </a>
      </div>
      <div className="overflow-hidden rounded-lg border border-white/10 bg-[var(--bg2)]">
        <iframe
          src={src}
          title={label}
          className="h-[calc(100vh-14rem)] w-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}
