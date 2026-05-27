import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  session_id: string;
  user_id: string | null;
  event_type: string;
  path: string;
  target: string | null;
  duration_ms: number | null;
  created_at: string;
};

const RANGES = [
  { key: "24h", label: "Last 24h", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
] as const;

function fmtDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function AnalyticsPanel() {
  const [rangeKey, setRangeKey] = useState<typeof RANGES[number]["key"]>("7d");
  const range = RANGES.find((r) => r.key === rangeKey)!;

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-analytics", rangeKey],
    queryFn: async (): Promise<Row[]> => {
      const since = new Date(Date.now() - range.days * 86400000).toISOString();
      const { data, error } = await supabase
        .from("analytics_events")
        .select("session_id,user_id,event_type,path,target,duration_ms,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const stats = useMemo(() => {
    const rows = data ?? [];
    const sessions = new Set<string>();
    const users = new Set<string>();
    let pageviews = 0;
    let totalLeaveMs = 0;
    let leaveCount = 0;
    const pageDur = new Map<string, { total: number; count: number; views: number }>();
    const clickCounts = new Map<string, number>();
    const sessionDur = new Map<string, number>();

    for (const r of rows) {
      sessions.add(r.session_id);
      if (r.user_id) users.add(r.user_id);
      if (r.event_type === "pageview") {
        pageviews++;
        const cur = pageDur.get(r.path) ?? { total: 0, count: 0, views: 0 };
        cur.views++;
        pageDur.set(r.path, cur);
      }
      if (r.event_type === "page_leave" && r.duration_ms) {
        totalLeaveMs += r.duration_ms;
        leaveCount++;
        const cur = pageDur.get(r.path) ?? { total: 0, count: 0, views: 0 };
        cur.total += r.duration_ms;
        cur.count++;
        pageDur.set(r.path, cur);
        sessionDur.set(r.session_id, (sessionDur.get(r.session_id) ?? 0) + r.duration_ms);
      }
      if (r.event_type === "click" && r.target) {
        clickCounts.set(r.target, (clickCounts.get(r.target) ?? 0) + 1);
      }
    }

    const avgSession = sessionDur.size
      ? Array.from(sessionDur.values()).reduce((a, b) => a + b, 0) / sessionDur.size
      : 0;

    const topClicks = Array.from(clickCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    const topPages = Array.from(pageDur.entries())
      .map(([path, v]) => ({
        path,
        views: v.views,
        avgMs: v.count ? v.total / v.count : 0,
        totalMs: v.total,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    const comicPages = Array.from(pageDur.entries())
      .filter(([path]) => /\/(battlefield-atlantis|children-of-aquarius|comic|issue|read)/i.test(path))
      .map(([path, v]) => ({
        path,
        views: v.views,
        avgMs: v.count ? v.total / v.count : 0,
        totalMs: v.total,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    return {
      visitors: sessions.size,
      signedIn: users.size,
      pageviews,
      avgTimeOnPage: leaveCount ? totalLeaveMs / leaveCount : 0,
      avgSession,
      topClicks,
      topPages,
      comicPages,
    };
  }, [data]);

  return (
    <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Visitor analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Visits, clicks, and time-on-page across the site.
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-border p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRangeKey(r.key)}
              className={`rounded px-3 py-1 text-xs font-bold uppercase tracking-[2px] transition ${
                rangeKey === r.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {(error as Error).message}
        </p>
      )}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Unique visitors" value={stats.visitors.toLocaleString()} />
            <Stat label="Signed-in" value={stats.signedIn.toLocaleString()} />
            <Stat label="Pageviews" value={stats.pageviews.toLocaleString()} />
            <Stat label="Avg session" value={fmtDuration(stats.avgSession)} />
            <Stat label="Avg time/page" value={fmtDuration(stats.avgTimeOnPage)} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Block title="Most-visited pages">
              <PageTable rows={stats.topPages} />
            </Block>
            <Block title="Top clicks">
              {stats.topClicks.length === 0 ? (
                <Empty>No clicks recorded yet.</Empty>
              ) : (
                <ul className="divide-y divide-border/40">
                  {stats.topClicks.map(([target, count]) => (
                    <li key={target} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="truncate text-foreground" title={target}>{target}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Block>
          </div>

          <div className="mt-8">
            <Block title="Comic pages — time spent">
              <PageTable rows={stats.comicPages} emptyText="No comic-page activity in this range yet." />
            </Block>
          </div>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[2px] text-muted-foreground">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function PageTable({
  rows,
  emptyText = "No pageviews recorded yet.",
}: {
  rows: { path: string; views: number; avgMs: number; totalMs: number }[];
  emptyText?: string;
}) {
  if (!rows.length) return <Empty>{emptyText}</Empty>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">
          <th className="pb-2 pr-3">Path</th>
          <th className="pb-2 pr-3 text-right">Views</th>
          <th className="pb-2 pr-3 text-right">Avg time</th>
          <th className="pb-2 text-right">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {rows.map((r) => (
          <tr key={r.path}>
            <td className="py-2 pr-3 truncate max-w-[220px]" title={r.path}>{r.path}</td>
            <td className="py-2 pr-3 text-right font-mono text-xs">{r.views}</td>
            <td className="py-2 pr-3 text-right font-mono text-xs">{fmtDuration(r.avgMs)}</td>
            <td className="py-2 text-right font-mono text-xs text-muted-foreground">{fmtDuration(r.totalMs)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
