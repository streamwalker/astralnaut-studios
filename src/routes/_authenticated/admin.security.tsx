import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/security")({
  head: () => ({ meta: [{ title: "Security — Admin" }] }),
  component: SecurityPage,
});

type AlertRow = {
  id: string;
  created_at: string;
  kind: string;
  severity: string;
  actor_user_id: string | null;
  actor_ip: string | null;
  details: Record<string, unknown> | null;
  acknowledged_at: string | null;
};

type AccessRow = {
  id: string;
  created_at: string;
  bucket: string;
  path: string;
  user_id: string | null;
  ip: string | null;
  user_agent: string | null;
  is_free: boolean | null;
};

function SecurityPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [windowMins, setWindowMins] = useState(60);

  const { data: userData } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", userData?.id],
    enabled: !!userData?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  useEffect(() => {
    if (!roleLoading && isAdmin === false) nav({ to: "/" });
  }, [isAdmin, roleLoading, nav]);

  const sinceIso = useMemo(
    () => new Date(Date.now() - windowMins * 60_000).toISOString(),
    [windowMins],
  );

  const alertsQ = useQuery({
    queryKey: ["security-alerts", sinceIso],
    enabled: !!isAdmin,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_alerts")
        .select("*")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as AlertRow[];
    },
  });

  const logsQ = useQuery({
    queryKey: ["storage-access-logs", sinceIso],
    enabled: !!isAdmin,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_access_logs")
        .select("id,created_at,bucket,path,user_id,ip,user_agent,is_free")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as AccessRow[];
    },
  });

  const stats = useMemo(() => {
    const rows = logsQ.data ?? [];
    const ips = new Set(rows.map((r) => r.ip).filter(Boolean));
    const users = new Set(rows.map((r) => r.user_id).filter(Boolean));
    const paths = new Set(rows.map((r) => r.path));
    return { total: rows.length, ips: ips.size, users: users.size, paths: paths.size };
  }, [logsQ.data]);

  async function acknowledge(id: string) {
    const { error } = await supabase
      .from("security_alerts")
      .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: userData?.id })
      .eq("id", id);
    if (!error) qc.invalidateQueries({ queryKey: ["security-alerts"] });
  }

  if (roleLoading || !isAdmin) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Checking access…</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-xs uppercase tracking-[2px] text-muted-foreground hover:text-foreground">
              ← Admin
            </Link>
            <h1 className="text-xl font-bold">Security</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {[60, 360, 1440].map((m) => (
              <Button
                key={m}
                size="sm"
                variant={windowMins === m ? "default" : "outline"}
                onClick={() => setWindowMins(m)}
              >
                {m === 60 ? "1h" : m === 360 ? "6h" : "24h"}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <section className="grid gap-4 sm:grid-cols-4">
          <Stat label="Access events" value={stats.total} />
          <Stat label="Unique paths" value={stats.paths} />
          <Stat label="Unique users" value={stats.users} />
          <Stat label="Unique IPs" value={stats.ips} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Active alerts</h2>
            <span className="text-xs text-muted-foreground">
              {alertsQ.data?.filter((a) => !a.acknowledged_at).length ?? 0} unacknowledged
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {(alertsQ.data ?? []).length === 0 && (
              <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No alerts in this window. Good.
              </li>
            )}
            {(alertsQ.data ?? []).map((a) => (
              <li
                key={a.id}
                className={`rounded-lg border p-3 ${
                  a.acknowledged_at ? "border-border/60 opacity-60" : "border-destructive/60 bg-destructive/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={a.severity === "high" ? "destructive" : "secondary"}>
                        {a.severity}
                      </Badge>
                      <span className="font-mono text-xs">{a.kind}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 text-sm">
                      {a.actor_user_id && <span className="font-mono">user:{a.actor_user_id.slice(0, 8)}…</span>}
                      {a.actor_ip && <span className="font-mono">ip:{a.actor_ip}</span>}
                      {a.details && (
                        <span className="ml-2 text-muted-foreground">
                          {JSON.stringify(a.details)}
                        </span>
                      )}
                    </div>
                  </div>
                  {!a.acknowledged_at && (
                    <Button size="sm" variant="outline" onClick={() => acknowledge(a.id)}>
                      Acknowledge
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Recent storage access</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Best-effort log of in-app paid-page requests. Direct CDN hits bypass this.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Path</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">IP</th>
                  <th className="py-2 pr-3">Free</th>
                </tr>
              </thead>
              <tbody>
                {(logsQ.data ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2 pr-3 font-mono">{r.path}</td>
                    <td className="py-2 pr-3 font-mono">{r.user_id ? r.user_id.slice(0, 8) + "…" : "—"}</td>
                    <td className="py-2 pr-3 font-mono">{r.ip ?? "—"}</td>
                    <td className="py-2 pr-3">{r.is_free ? "yes" : "no"}</td>
                  </tr>
                ))}
                {(logsQ.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      No access events recorded in this window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-[2px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
