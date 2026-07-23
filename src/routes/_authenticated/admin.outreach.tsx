import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  listOutreachProspects,
  upsertOutreachProspect,
  deleteOutreachProspect,
  runBacklinkCheckNow,
} from "@/lib/outreach.functions";

export const Route = createFileRoute("/_authenticated/admin/outreach")({
  head: () => ({ meta: [{ title: "Outreach Tracker — Astralnaut Studios" }] }),
  component: AdminOutreach,
});

type Row = Awaited<ReturnType<typeof listOutreachProspects>>[number];

const STATUSES = [
  "prospect",
  "contacted",
  "replied",
  "negotiating",
  "published",
  "declined",
  "dead",
] as const;
type Status = (typeof STATUSES)[number];

type Draft = {
  id: string | null;
  url: string;
  site_name: string;
  contact_name: string;
  contact_email: string;
  tier: 1 | 2 | 3;
  category: string;
  status: Status;
  notes: string;
  link_acquired: boolean;
  link_acquired_url: string;
};

const EMPTY: Draft = {
  id: null,
  url: "",
  site_name: "",
  contact_name: "",
  contact_email: "",
  tier: 2,
  category: "",
  status: "prospect",
  notes: "",
  link_acquired: false,
  link_acquired_url: "",
};

const STATUS_COLORS: Record<Status, string> = {
  prospect: "text-muted-foreground",
  contacted: "text-[var(--neon)]",
  replied: "text-[var(--neon)]",
  negotiating: "text-[var(--gold)]",
  published: "text-emerald-400",
  declined: "text-muted-foreground",
  dead: "text-muted-foreground line-through",
};

function AdminOutreach() {
  const qc = useQueryClient();
  const listFn = useServerFn(listOutreachProspects);
  const upsertFn = useServerFn(upsertOutreachProspect);
  const deleteFn = useServerFn(deleteOutreachProspect);

  const q = useQuery({ queryKey: ["admin-outreach"], queryFn: () => listFn() });

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");
  const [filterTier, setFilterTier] = useState<"all" | "1" | "2" | "3">("all");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-outreach"] });

  const upsert = useMutation({
    mutationFn: (d: Draft) => upsertFn({ data: d }),
    onSuccess: () => {
      toast.success("Saved");
      setDraft(EMPTY);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const editRow = (r: Row) =>
    setDraft({
      id: r.id,
      url: r.url,
      site_name: r.site_name ?? "",
      contact_name: r.contact_name ?? "",
      contact_email: r.contact_email ?? "",
      tier: (r.tier as 1 | 2 | 3) ?? 2,
      category: r.category ?? "",
      status: (r.status as Status) ?? "prospect",
      notes: r.notes ?? "",
      link_acquired: !!r.link_acquired,
      link_acquired_url: r.link_acquired_url ?? "",
    });

  const rows = q.data ?? [];
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (filterStatus === "all" || r.status === filterStatus) &&
          (filterTier === "all" || String(r.tier) === filterTier),
      ),
    [rows, filterStatus, filterTier],
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const contacted = rows.filter((r) =>
      ["contacted", "replied", "negotiating", "published"].includes(r.status),
    ).length;
    const acquired = rows.filter((r) => r.link_acquired).length;
    return { total, contacted, acquired };
  }, [rows]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Outreach Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage backlink prospects. Track URLs, contacts, tier, status, and acquired links.
          </p>
        </div>
        <Link to="/admin" className="text-xs text-muted-foreground hover:text-[var(--neon)]">
          ← Admin
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Stat label="Prospects" value={stats.total} />
        <Stat label="Contacted+" value={stats.contacted} />
        <Stat label="Links acquired" value={stats.acquired} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Tier</Label>
          <Select value={filterTier} onValueChange={(v) => setFilterTier(v as typeof filterTier)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="1">Tier 1</SelectItem>
              <SelectItem value="2">Tier 2</SelectItem>
              <SelectItem value="3">Tier 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="mt-6 space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {filtered.map((r) => (
          <div key={r.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-bold text-[var(--gold)]">T{r.tier}</span>
                  <h3 className="text-base font-black">{r.site_name || new URL(r.url).hostname}</h3>
                  {r.category && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.category}
                    </span>
                  )}
                </div>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate text-xs text-[var(--neon)] hover:underline"
                >
                  {r.url}
                </a>
                {(r.contact_name || r.contact_email) && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.contact_name}
                    {r.contact_name && r.contact_email ? " · " : ""}
                    {r.contact_email}
                  </div>
                )}
                {r.notes && (
                  <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
                    {r.notes}
                  </p>
                )}
                {r.link_acquired && r.link_acquired_url && (
                  <a
                    href={r.link_acquired_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-emerald-400 hover:underline"
                  >
                    ✔ Link: {r.link_acquired_url}
                  </a>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 text-xs">
                <span className={`font-bold uppercase ${STATUS_COLORS[r.status as Status]}`}>
                  {r.status}
                </span>
                {r.link_acquired && <span className="text-emerald-400">✔ acquired</span>}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => editRow(r)}>Edit</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm(`Delete prospect "${r.site_name || r.url}"?`)) del.mutate(r.id);
                }}
                disabled={del.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {!q.isLoading && filtered.length === 0 && (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No prospects match. Add one below.
          </p>
        )}
      </section>

      <section className="mt-10 rounded-md border border-border bg-card p-6">
        <h2 className="text-lg font-black uppercase tracking-tight">
          {draft.id ? "Edit prospect" : "New prospect"}
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>URL *</Label>
            <Input
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              placeholder="https://example.com/write-for-us"
              maxLength={500}
            />
          </div>
          <div>
            <Label>Site name</Label>
            <Input
              value={draft.site_name}
              onChange={(e) => setDraft({ ...draft, site_name: e.target.value })}
              maxLength={200}
            />
          </div>
          <div>
            <Label>Category</Label>
            <Input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="UAP / Comics review / Mystery blog"
              maxLength={100}
            />
          </div>
          <div>
            <Label>Contact name</Label>
            <Input
              value={draft.contact_name}
              onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })}
              maxLength={200}
            />
          </div>
          <div>
            <Label>Contact email</Label>
            <Input
              type="email"
              value={draft.contact_email}
              onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })}
              maxLength={255}
            />
          </div>
          <div>
            <Label>Tier</Label>
            <Select
              value={String(draft.tier)}
              onValueChange={(v) => setDraft({ ...draft, tier: Number(v) as 1 | 2 | 3 })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Tier 1 — Direct match</SelectItem>
                <SelectItem value="2">Tier 2 — Thematic</SelectItem>
                <SelectItem value="3">Tier 3 — Review sites</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => setDraft({ ...draft, status: v as Status })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              rows={4}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Pitch angle, submission guidelines, follow-up dates…"
              maxLength={4000}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={draft.link_acquired}
              onCheckedChange={(v) => setDraft({ ...draft, link_acquired: v })}
            />
            <Label className="!m-0">Link acquired</Label>
          </div>
          <div>
            <Label>Acquired link URL</Label>
            <Input
              value={draft.link_acquired_url}
              onChange={(e) => setDraft({ ...draft, link_acquired_url: e.target.value })}
              placeholder="https://siteX.com/post-that-links-to-us"
              maxLength={500}
              disabled={!draft.link_acquired}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={() => {
              if (!draft.url.trim()) {
                toast.error("URL is required.");
                return;
              }
              upsert.mutate(draft);
            }}
            disabled={upsert.isPending}
          >
            {upsert.isPending ? "Saving…" : draft.id ? "Save changes" : "Add prospect"}
          </Button>
          {draft.id && (
            <Button variant="outline" onClick={() => setDraft(EMPTY)}>Cancel</Button>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="font-mono text-2xl font-black text-[var(--gold)]">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[3px] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
