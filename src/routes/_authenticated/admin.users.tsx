import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  listAdminUsers,
  getAdminUserDetail,
  inviteAdminUser,
  createAdminUser,
  updateAdminUser,
  setAdminUserRole,
  sendAdminPasswordReset,
  deleteAdminUser,
} from "@/lib/admin-users.functions";
import logo from "@/assets/astralnaut-logo.png";

type Search = { userId?: string };

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    userId: typeof s.userId === "string" ? s.userId : undefined,
  }),
  component: AdminUsersPage,
});

function fmtDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

function AdminUsersPage() {
  const { userId } = Route.useSearch();
  const nav = useNavigate({ from: "/admin/users" });

  // Admin gate
  const { data: me } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", me!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  if (roleLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Checking access…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-bold">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">Admin access required.</p>
          <Link to="/admin" className="mt-4 inline-block text-sm underline">Back to admin</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/admin" className="flex items-center gap-3">
            <img src={logo} alt="Astralnaut Studios" className="h-8 w-auto" />
            <span className="text-sm font-semibold tracking-[0.18em]">ADMIN · USERS</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/admin" className="rounded-md border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-muted-foreground hover:text-foreground">
              Back
            </Link>
            <span className="text-muted-foreground">{me?.email}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {userId ? (
          <UserDetail userId={userId} onBack={() => nav({ search: {} })} currentUserId={me?.id} />
        ) : (
          <UserDirectory onOpen={(id) => nav({ search: { userId: id } })} currentUserId={me?.id} />
        )}
      </main>
    </div>
  );
}

function UserDirectory({ onOpen, currentUserId }: { onOpen: (id: string) => void; currentUserId?: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const listFn = useServerFn(listAdminUsers);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => listFn({ data: { search: search || undefined } }),
  });

  const setRoleFn = useServerFn(setAdminUserRole);
  const deleteFn = useServerFn(deleteAdminUser);

  const toggleAdmin = async (id: string, grant: boolean) => {
    try {
      await setRoleFn({ data: { userId: id, grant } });
      toast.success(grant ? "Admin granted" : "Admin revoked");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const removeUser = async (id: string, email: string | null) => {
    if (!confirm(`Permanently delete ${email ?? id}? This cannot be undone.`)) return;
    try {
      await deleteFn({ data: { userId: id } });
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All accounts on the platform. Last-30-day engagement metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInviteOpen(true)}>Invite user</Button>
          <Button onClick={() => setCreateOpen(true)}>Add user</Button>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Input
          placeholder="Search email or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {(error as Error).message}
        </p>
      )}

      <div className="table-scroll mt-6 -mx-4 rounded-2xl border border-border bg-card px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 text-left text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">Last sign-in</th>
              <th className="px-4 py-3 text-right">Sessions 30d</th>
              <th className="px-4 py-3 text-right">Time on site 30d</th>
              <th className="px-4 py-3">Last seen</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {isLoading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {data?.users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <button onClick={() => onOpen(u.id)} className="text-left">
                    <div className="font-medium text-foreground hover:underline">{u.email ?? "(no email)"}</div>
                    {u.display_name && <div className="text-xs text-muted-foreground">{u.display_name}</div>}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {u.is_admin ? <Badge variant="default">admin</Badge> : <Badge variant="outline">user</Badge>}
                </td>
                <td className="px-4 py-3">
                  {u.subscription ? (
                    <div className="text-xs">
                      <div className="font-medium">{u.subscription.status}</div>
                      <div className="text-muted-foreground">{u.subscription.environment}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">{fmtDate(u.last_sign_in_at)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{u.metrics.sessions_30d}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{fmtDuration(u.metrics.total_time_ms_30d)}</td>
                <td className="px-4 py-3 text-xs">{fmtDate(u.metrics.last_seen)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => onOpen(u.id)}>View</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAdmin(u.id, !u.is_admin)}
                      disabled={u.id === currentUserId && u.is_admin}
                    >
                      {u.is_admin ? "Revoke" : "Grant"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeUser(u.id, u.email)}
                      disabled={u.id === currentUserId}
                      className="text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && data?.users.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const inviteFn = useServerFn(inviteAdminUser);
  const submit = async () => {
    setBusy(true);
    try {
      await inviteFn({ data: { email: email.trim() } });
      toast.success(`Invite sent to ${email}`);
      setEmail("");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Invite user</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" />
          <p className="text-xs text-muted-foreground">An email invite link will be sent. They'll set their own password.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!email || busy}>{busy ? "Sending…" : "Send invite"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const createFn = useServerFn(createAdminUser);
  const submit = async () => {
    setBusy(true);
    try {
      await createFn({ data: { email: email.trim(), password, display_name: displayName.trim() || undefined } });
      toast.success(`Account created for ${email}`);
      setEmail(""); setPassword(""); setDisplayName("");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add user</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Display name (optional)</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
          <div><Label>Temporary password</Label><Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></div>
          <p className="text-xs text-muted-foreground">Account is created confirmed. Share the password securely.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!email || password.length < 8 || busy}>{busy ? "Creating…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserDetail({ userId, onBack, currentUserId }: { userId: string; onBack: () => void; currentUserId?: string }) {
  const qc = useQueryClient();
  const detailFn = useServerFn(getAdminUserDetail);
  const updateFn = useServerFn(updateAdminUser);
  const setRoleFn = useServerFn(setAdminUserRole);
  const resetFn = useServerFn(sendAdminPasswordReset);
  const deleteFn = useServerFn(deleteAdminUser);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => detailFn({ data: { userId } }),
  });

  const [displayName, setDisplayName] = useState<string | null>(null);
  const effectiveName = displayName ?? data?.user.display_name ?? "";

  const save = async () => {
    try {
      await updateFn({ data: { userId, display_name: effectiveName } });
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) { toast.error((e as Error).message); }
  };

  const toggleAdmin = async () => {
    try {
      await setRoleFn({ data: { userId, grant: !data?.is_admin } });
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
    } catch (e) { toast.error((e as Error).message); }
  };

  const sendReset = async () => {
    if (!data?.user.email) return;
    try {
      await resetFn({ data: { email: data.user.email } });
      toast.success("Password reset email sent");
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async () => {
    if (!confirm("Permanently delete this user?")) return;
    try {
      await deleteFn({ data: { userId } });
      toast.success("User deleted");
      onBack();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;
  if (!data) return null;

  const u = data.user;
  const ov = data.overview;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-xs uppercase tracking-[2px] text-muted-foreground hover:text-foreground">← Back to users</button>
          <h1 className="mt-2 text-2xl font-bold">{u.email}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {data.is_admin && <Badge>admin</Badge>}
            {u.providers.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}
            <span>Joined {fmtDate(u.created_at)}</span>
            <span>· Last sign-in {fmtDate(u.last_sign_in_at)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={sendReset}>Send password reset</Button>
          <Button variant="outline" onClick={toggleAdmin} disabled={userId === currentUserId && data.is_admin}>
            {data.is_admin ? "Revoke admin" : "Grant admin"}
          </Button>
          <Button variant="outline" onClick={remove} disabled={userId === currentUserId} className="text-destructive">
            Delete user
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Sessions (30d)" value={ov.sessions.toLocaleString()} />
        <Stat label="Pageviews (30d)" value={ov.pageviews.toLocaleString()} />
        <Stat label="Total time" value={fmtDuration(ov.total_time_ms)} />
        <Stat label="Avg session" value={fmtDuration(ov.avg_session_ms)} />
        <Stat label="Last active" value={ov.last_seen ? fmtDate(ov.last_seen) : "—"} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-bold uppercase tracking-[2px] text-muted-foreground">Profile</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_auto]">
          <div>
            <Label>Display name</Label>
            <Input value={effectiveName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="flex items-end"><Button onClick={save}>Save</Button></div>
        </div>
      </section>

      {data.subscriptions.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[2px] text-muted-foreground">Subscriptions</h2>
          <ul className="mt-4 space-y-3">
            {data.subscriptions.map((s: any) => (
              <li key={s.id} className="rounded-lg border border-border/60 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <div className="font-medium">{s.product_id} <span className="text-muted-foreground">({s.environment})</span></div>
                    <div className="text-xs text-muted-foreground">Status: {s.status} · Period ends {fmtDate(s.current_period_end)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Stripe: {s.stripe_subscription_id}</div>
                </div>
                {s.shipping_name && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Ship to: {s.shipping_name}, {s.shipping_line1} {s.shipping_line2 ?? ""}, {s.shipping_city}, {s.shipping_state} {s.shipping_postal_code}, {s.shipping_country}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[2px] text-muted-foreground">What they lingered on</h2>
          {data.top_pages.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No data.</p> : (
            <div className="table-scroll mt-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">
                <th className="pb-2">Path</th><th className="pb-2 text-right">Views</th><th className="pb-2 text-right">Avg</th><th className="pb-2 text-right">Total</th>
              </tr></thead>
              <tbody className="divide-y divide-border/40">
                {data.top_pages.map((p) => (
                  <tr key={p.path}>
                    <td className="py-2 max-w-[260px] truncate" title={p.path}>{p.path}</td>
                    <td className="py-2 text-right font-mono text-xs">{p.views}</td>
                    <td className="py-2 text-right font-mono text-xs">{fmtDuration(p.avg_ms)}</td>
                    <td className="py-2 text-right font-mono text-xs">{fmtDuration(p.total_ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-[2px] text-muted-foreground">What they clicked</h2>
          {data.top_clicks.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No clicks recorded.</p> : (
            <ul className="mt-4 divide-y divide-border/40">
              {data.top_clicks.map((c) => (
                <li key={c.target} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate" title={c.target}>{c.target}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-bold uppercase tracking-[2px] text-muted-foreground">Sessions</h2>
        {data.sessions.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No sessions.</p> : (
          <div className="table-scroll mt-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">
              <th className="pb-2">Session</th><th className="pb-2">Start</th><th className="pb-2">End</th><th className="pb-2 text-right">Events</th><th className="pb-2 text-right">Time</th>
            </tr></thead>
            <tbody className="divide-y divide-border/40">
              {data.sessions.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 font-mono text-xs">{s.id.slice(0, 10)}…</td>
                  <td className="py-2 text-xs">{fmtDate(s.start)}</td>
                  <td className="py-2 text-xs">{fmtDate(s.end)}</td>
                  <td className="py-2 text-right font-mono text-xs">{s.events}</td>
                  <td className="py-2 text-right font-mono text-xs">{fmtDuration(s.duration_ms)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>


      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-bold uppercase tracking-[2px] text-muted-foreground">Recent activity</h2>
        <ul className="mt-4 divide-y divide-border/40">
          {data.recent_events.map((e: any, i: number) => (
            <li key={i} className="flex flex-wrap items-baseline justify-between gap-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <span className="mr-2 inline-block min-w-[80px] text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">{e.event_type}</span>
                <span className="text-foreground">{e.path}</span>
                {e.target && <span className="ml-2 text-xs text-muted-foreground">→ {e.target}</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {e.duration_ms ? `${fmtDuration(e.duration_ms)} · ` : ""}{fmtDate(e.created_at)}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}
