import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/visitors")({
  head: () => ({ meta: [{ title: "Visitors — Admin" }] }),
  component: VisitorsPage,
});

type Hit = {
  id: string;
  ip: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  path: string | null;
  referrer: string | null;
  country: string | null;
  user_id: string | null;
  created_at: string;
};

function VisitorsPage() {
  const [hideIp, setHideIp] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["visitor-hits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visitor_hits" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as unknown as Hit[]) ?? [];
    },
  });

  const filtered = useMemo(() => {
    const ip = hideIp.trim();
    if (!ip) return data ?? [];
    return (data ?? []).filter((h) => h.ip !== ip);
  }, [data, hideIp]);

  const stats = useMemo(() => {
    const now = Date.now();
    const day = 86_400_000;
    const ips = (data ?? []).map((h) => ({ ip: h.ip, t: new Date(h.created_at).getTime() }));
    const uniq = (since: number) =>
      new Set(ips.filter((x) => x.ip && x.t >= now - since).map((x) => x.ip)).size;
    return {
      total: data?.length ?? 0,
      uniq1: uniq(day),
      uniq7: uniq(day * 7),
      uniq30: uniq(day * 30),
    };
  }, [data]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/admin" className="text-sm text-muted-foreground hover:underline">
            ← Admin
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Visitor IPs</h1>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching} variant="outline">
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Hits (last 500)" value={stats.total} />
        <Stat label="Unique IPs · 24h" value={stats.uniq1} />
        <Stat label="Unique IPs · 7d" value={stats.uniq7} />
        <Stat label="Unique IPs · 30d" value={stats.uniq30} />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Input
          placeholder="Hide an IP (e.g. your own)"
          value={hideIp}
          onChange={(e) => setHideIp(e.target.value)}
          className="max-w-xs"
        />
        {hideIp && (
          <Button variant="ghost" size="sm" onClick={() => setHideIp("")}>
            Clear
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2">Time</th>
              <th className="p-2">IP</th>
              <th className="p-2">Country</th>
              <th className="p-2">Path</th>
              <th className="p-2">Referrer</th>
              <th className="p-2">User Agent</th>
              <th className="p-2">User</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  No visits yet.
                </td>
              </tr>
            ) : (
              filtered.map((h) => (
                <tr key={h.id} className="border-t">
                  <td className="whitespace-nowrap p-2 text-muted-foreground">
                    {new Date(h.created_at).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap p-2 font-mono">{h.ip ?? "—"}</td>
                  <td className="p-2">{h.country ?? "—"}</td>
                  <td className="p-2">{h.path ?? "—"}</td>
                  <td className="max-w-[16rem] truncate p-2 text-muted-foreground" title={h.referrer ?? ""}>
                    {h.referrer ?? "—"}
                  </td>
                  <td className="max-w-[20rem] truncate p-2 text-muted-foreground" title={h.user_agent ?? ""}>
                    {h.user_agent ?? "—"}
                  </td>
                  <td className="whitespace-nowrap p-2 font-mono text-xs">
                    {h.user_id ? h.user_id.slice(0, 8) : "anon"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
