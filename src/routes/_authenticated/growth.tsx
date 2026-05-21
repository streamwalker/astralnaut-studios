import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/growth")({
  head: () => ({ meta: [{ title: "Growth Dashboard — Astralnaut Studios" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ export: s.export === "1" ? "1" : undefined }),
  component: GrowthDashboard,
});

type KpiRow = {
  id: string; recorded_at: string;
  subs: number | null; emails: number | null; ewr: number | null; discord: number | null; nps: number | null;
  cac: number | null; churn: number | null; mrr: number | null; notes: string | null;
};
type SprintWeek = { id: string; week: number; dates: string; outcome: string; done: boolean; done_at: string | null };

const PHASES = [
  { name: "Ignition", range: "0 → 1,000", dates: "Days 1–60", min: 0, max: 1000 },
  { name: "Validation", range: "1K → 10K", dates: "Days 60–180", min: 1000, max: 10000 },
  { name: "Velocity", range: "10K → 100K", dates: "Months 6–14", min: 10000, max: 100000 },
  { name: "Inflection", range: "100K → 1M", dates: "Months 14–24", min: 100000, max: 1000000 },
];

type FieldKey = "subs" | "emails" | "ewr" | "cac" | "churn" | "discord" | "mrr" | "nps";
const FIELDS: { key: FieldKey; label: string; format: "integer" | "usd" | "percent" }[] = [
  { key: "subs", label: "Paying subscribers", format: "integer" },
  { key: "emails", label: "Email list", format: "integer" },
  { key: "ewr", label: "Engaged Weekly Readers", format: "integer" },
  { key: "cac", label: "Blended CAC", format: "usd" },
  { key: "churn", label: "Monthly churn", format: "percent" },
  { key: "discord", label: "Discord members", format: "integer" },
  { key: "mrr", label: "MRR", format: "usd" },
  { key: "nps", label: "NPS", format: "integer" },
];

const CHANNELS = [
  { name: "TikTok (organic + paid)", share_pct: 30 },
  { name: "YouTube long-form", share_pct: 20 },
  { name: "Reddit (organic + paid)", share_pct: 15 },
  { name: "Search (Google + AEO)", share_pct: 12 },
  { name: "Influencer partnerships", share_pct: 10 },
  { name: "Email + referral", share_pct: 8 },
  { name: "Press + earned media", share_pct: 5 },
];

const MILESTONES = [100, 1000, 10000, 50000, 100000, 250000, 500000, 1000000];

const PHASE_TARGETS: { name: string; key?: FieldKey; targets: number[]; inverted?: boolean }[] = [
  { name: "Paying subscribers", key: "subs", targets: [1000, 10000, 100000, 1000000] },
  { name: "Email list", key: "emails", targets: [5000, 40000, 300000, 2500000] },
  { name: "Discord members", key: "discord", targets: [500, 4000, 40000, 180000] },
  { name: "Blended CAC", key: "cac", targets: [6, 9.5, 12, 18], inverted: true },
  { name: "Monthly churn", key: "churn", targets: [8, 7, 6, 5], inverted: true },
  { name: "MRR", key: "mrr", targets: [5000, 55000, 650000, 5500000] },
  { name: "NPS", key: "nps", targets: [45, 50, 55, 60] },
];

function fmt(v: number | null | undefined, format: "integer" | "usd" | "percent") {
  if (v == null || Number.isNaN(v)) return "—";
  if (format === "usd") return "$" + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (format === "percent") return v.toFixed(1) + "%";
  return Math.round(v).toLocaleString();
}

function GrowthDashboard() {
  const qc = useQueryClient();
  const search = Route.useSearch();

  const { data: isAdmin } = useQuery({
    queryKey: ["growth-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const { data: kpis } = useQuery({
    queryKey: ["growth_kpis"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("growth_kpis").select("*").order("recorded_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data as KpiRow[];
    },
  });

  const { data: weeks } = useQuery({
    queryKey: ["growth_sprint_weeks"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("growth_sprint_weeks").select("*").order("week");
      if (error) throw error;
      return data as SprintWeek[];
    },
  });

  const latest = kpis?.[0];
  const prior = kpis?.[1];

  const [form, setForm] = useState<Record<FieldKey | "notes", string>>({
    subs: "", emails: "", ewr: "", cac: "", churn: "", discord: "", mrr: "", nps: "", notes: "",
  });

  useEffect(() => {
    if (latest && form.subs === "") {
      setForm({
        subs: latest.subs?.toString() ?? "",
        emails: latest.emails?.toString() ?? "",
        ewr: latest.ewr?.toString() ?? "",
        cac: latest.cac?.toString() ?? "",
        churn: latest.churn?.toString() ?? "",
        discord: latest.discord?.toString() ?? "",
        mrr: latest.mrr?.toString() ?? "",
        nps: latest.nps?.toString() ?? "",
        notes: "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id]);

  const saveSnapshot = useMutation({
    mutationFn: async () => {
      const row: any = { notes: form.notes || null };
      for (const f of FIELDS) {
        const v = form[f.key].trim();
        row[f.key] = v === "" ? null : Number(v);
      }
      const { error } = await supabase.from("growth_kpis").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Snapshot saved");
      qc.invalidateQueries({ queryKey: ["growth_kpis"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleWeek = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("growth_sprint_weeks").update({ done, done_at: done ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["growth_sprint_weeks"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const activePhaseIdx = useMemo(() => {
    const subs = latest?.subs ?? 0;
    for (let i = PHASES.length - 1; i >= 0; i--) if (subs >= PHASES[i].min) return i;
    return 0;
  }, [latest]);

  // Auto-export when ?export=1
  useEffect(() => {
    if (search.export === "1" && kpis) {
      exportCsv(kpis);
    }
  }, [search.export, kpis]);

  if (isAdmin === false) {
    return <div className="flex min-h-screen items-center justify-center text-[var(--ink2)]">Admin access required.</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/growth-package" className="text-xs text-[var(--mute)] hover:text-[var(--neon)]">← Back to Growth Package</Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => kpis && exportCsv(kpis)}>Export CSV</Button>
            <Button size="sm" onClick={() => saveSnapshot.mutate()} disabled={saveSnapshot.isPending}>
              {saveSnapshot.isPending ? "Saving…" : "Save Snapshot"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <div>
          <div className="eyebrow text-[var(--gold)]">Path to 1M</div>
          <h1 className="mt-2 text-4xl font-black">Growth Dashboard</h1>
          <p className="mt-2 text-sm text-[var(--ink2)]">
            Last snapshot: {latest ? new Date(latest.recorded_at).toLocaleString() : "—"} · {kpis?.length ?? 0} total snapshots
          </p>
        </div>

        {/* PHASE RAIL */}
        <section>
          <h2 className="mb-4 text-lg font-bold">Phased Roadmap</h2>
          <div className="grid gap-3 md:grid-cols-4">
            {PHASES.map((p, i) => {
              const active = i === activePhaseIdx;
              const subs = latest?.subs ?? 0;
              const pct = Math.max(0, Math.min(100, ((subs - p.min) / (p.max - p.min)) * 100));
              return (
                <div key={p.name} className={`card-rwc p-4 ${active ? "ring-2 ring-[var(--neon)]" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold">{p.name}</div>
                    {active && <span className="rounded-full bg-[var(--neon)]/15 px-2 py-0.5 text-[10px] uppercase text-[var(--neon)]">Active</span>}
                  </div>
                  <div className="mt-1 text-xs text-[var(--mute)]">{p.range} · {p.dates}</div>
                  <div className="mt-3 h-2 rounded-full bg-white/5">
                    <div className="h-2 rounded-full bg-[var(--gold)]" style={{ width: `${active ? pct : i < activePhaseIdx ? 100 : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* LIVE KPIs */}
        <section>
          <h2 className="mb-4 text-lg font-bold">Live KPIs — Edit and Save Snapshot</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {FIELDS.map((f) => {
              const cur = latest?.[f.key];
              const prev = prior?.[f.key];
              const delta = cur != null && prev != null ? cur - prev : null;
              const goodUp = !(f.key === "cac" || f.key === "churn");
              const deltaColor = delta == null ? "text-[var(--mute)]" : (delta > 0 ? (goodUp ? "text-emerald-400" : "text-red-400") : delta < 0 ? (goodUp ? "text-red-400" : "text-emerald-400") : "text-[var(--mute)]");
              return (
                <div key={f.key} className="card-rwc p-4">
                  <Label className="text-xs uppercase tracking-[0.14em] text-[var(--mute)]">{f.label}</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form[f.key]}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    className="mt-2 bg-[var(--bg-input)]"
                  />
                  <div className="mt-2 text-xs text-[var(--ink2)]">
                    Current: <span className="font-bold text-[var(--ink)]">{fmt(cur ?? null, f.format)}</span>
                    {delta != null && (
                      <span className={`ml-2 ${deltaColor}`}>
                        {delta > 0 ? "▲" : delta < 0 ? "▼" : "·"} {fmt(Math.abs(delta), f.format)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <Label>Notes (optional)</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} className="mt-2 bg-[var(--bg-input)]" rows={2} />
          </div>
        </section>

        {/* CHANNELS */}
        <section>
          <h2 className="mb-4 text-lg font-bold">Growth Channel Allocation</h2>
          <div className="card-rwc space-y-3 p-5">
            {CHANNELS.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="text-[var(--mute)]">{c.share_pct}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white/5">
                  <div className="h-2 rounded-full bg-[var(--neon)]" style={{ width: `${c.share_pct * 2}%`, maxWidth: "100%" }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MILESTONES */}
        <section>
          <h2 className="mb-4 text-lg font-bold">Subscriber Milestones</h2>
          <div className="card-rwc overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.14em] text-[var(--mute)]">
                <tr><th className="px-4 py-3">Milestone</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {MILESTONES.map((m, i) => {
                  const subs = latest?.subs ?? 0;
                  const hit = subs >= m;
                  const isNext = !hit && (i === 0 || subs >= MILESTONES[i - 1]);
                  return (
                    <tr key={m} className="border-t border-white/5">
                      <td className="px-4 py-3">{m.toLocaleString()} subs</td>
                      <td className="px-4 py-3 text-[var(--mute)]">{m.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {hit ? <Pill tone="green">Hit</Pill> : isNext ? <Pill tone="amber">Next</Pill> : <Pill tone="mute">Upcoming</Pill>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* PHASE TARGETS */}
        <section>
          <h2 className="mb-2 text-lg font-bold">Phase Targets vs Current</h2>
          <div className="mb-3 flex gap-3 text-xs text-[var(--mute)]">
            <span><Pill tone="green">Green</Pill> On / ahead</span>
            <span><Pill tone="amber">Amber</Pill> Within 25%</span>
            <span><Pill tone="red">Red</Pill> &gt;25% behind</span>
          </div>
          <div className="card-rwc overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.14em] text-[var(--mute)]">
                <tr>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Current</th>
                  {PHASES.map((p) => <th key={p.name} className="px-4 py-3">{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {PHASE_TARGETS.map((m) => {
                  const cur = m.key ? (latest?.[m.key] ?? 0) : 0;
                  const fmtType: "integer" | "usd" | "percent" = m.key === "cac" || m.key === "mrr" ? "usd" : m.key === "churn" ? "percent" : "integer";
                  return (
                    <tr key={m.name} className="border-t border-white/5">
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3">{fmt(cur, fmtType)}</td>
                      {m.targets.map((t, i) => {
                        const ratio = m.inverted ? (cur === 0 ? 1 : t / cur) : cur / t;
                        const tone = ratio >= 1 ? "green" : ratio >= 0.75 ? "amber" : "red";
                        return (
                          <td key={i} className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-[var(--mute)]">{fmt(t, fmtType)}</span>
                              <Pill tone={tone}>{(ratio * 100).toFixed(0)}%</Pill>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* SPRINT CALENDAR */}
        <section>
          <h2 className="mb-4 text-lg font-bold">90-Day Sprint Calendar</h2>
          <div className="card-rwc overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.14em] text-[var(--mute)]">
                <tr>
                  <th className="px-4 py-3">Done</th>
                  <th className="px-4 py-3">Week</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {(weeks ?? []).map((w) => (
                  <tr key={w.id} className={`border-t border-white/5 ${w.done ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={w.done}
                        onChange={(e) => toggleWeek.mutate({ id: w.id, done: e.target.checked })}
                        className="h-4 w-4 accent-[var(--gold)]"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono">W{w.week}</td>
                    <td className="px-4 py-3 text-[var(--mute)]">{w.dates}</td>
                    <td className={`px-4 py-3 ${w.done ? "line-through" : ""}`}>{w.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Pill({ tone, children }: { tone: "green" | "amber" | "red" | "mute"; children: React.ReactNode }) {
  const map = {
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    red: "bg-red-500/15 text-red-300 border-red-500/30",
    mute: "bg-white/5 text-[var(--mute)] border-white/10",
  } as const;
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${map[tone]}`}>{children}</span>;
}

function exportCsv(rows: KpiRow[]) {
  const cols: (keyof KpiRow)[] = ["recorded_at", "subs", "emails", "ewr", "discord", "nps", "cac", "churn", "mrr", "notes"];
  const header = cols.join(",");
  const body = rows.map((r) => cols.map((c) => {
    const v = r[c];
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  const csv = header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `growth-kpis-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
