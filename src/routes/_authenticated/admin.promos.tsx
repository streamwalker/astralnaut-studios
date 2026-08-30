import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  adminListPromos,
  adminUpsertPromo,
  adminDeletePromo,
  adminListSiteCopy,
  adminUpdateSiteCopy,
  adminListIssueDrops,
  adminUpsertIssueDrop,
  adminDeleteIssueDrop,
} from "@/lib/promos.functions";

export const Route = createFileRoute("/_authenticated/admin/promos")({
  head: () => ({ meta: [{ title: "Announcements & schedule — Astralnaut Studios" }] }),
  component: AdminPromos,
});

// ---------------------------------------------------------------- helpers ---

/**
 * Stored timestamptz → the value a <input type="datetime-local"> wants, in the
 * admin's own zone. The round trip is deliberate: they type a wall-clock time,
 * it is stored as that instant, and it comes back as the same wall-clock time.
 */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function windowLabel(starts: string | null, ends: string | null, active: boolean): {
  text: string;
  tone: string;
} {
  if (!active) return { text: "PAUSED", tone: "text-muted-foreground" };
  const now = Date.now();
  if (starts && new Date(starts).getTime() > now) {
    return { text: `SCHEDULED · ${new Date(starts).toLocaleString()}`, tone: "text-[var(--gold)]" };
  }
  if (ends && new Date(ends).getTime() <= now) return { text: "EXPIRED", tone: "text-muted-foreground" };
  return { text: "LIVE NOW", tone: "text-[var(--neon)]" };
}

// ------------------------------------------------------------------ types ---

type PromoRow = Awaited<ReturnType<typeof adminListPromos>>[number];

type PromoDraft = {
  id: string | null;
  message: string;
  href: string;
  cta: string;
  starts_at: string;
  ends_at: string;
  priority: number;
  is_active: boolean;
};

const EMPTY_PROMO: PromoDraft = {
  id: null,
  message: "",
  href: "",
  cta: "",
  starts_at: "",
  ends_at: "",
  priority: 0,
  is_active: true,
};

type DropDraft = {
  id: string | null;
  issue_id: string;
  week: number;
  pages: string;
  patron_date: string;
  initiate_date: string;
  reader_date: string;
};

const EMPTY_DROP: DropDraft = {
  id: null,
  issue_id: "",
  week: 1,
  pages: "",
  patron_date: "",
  initiate_date: "",
  reader_date: "",
};

// ============================================================== component ===

function AdminPromos() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Announcements &amp; schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything on this page used to be hardcoded in the site's source. Dated claims belong in
            the queue or the schedule so they retire themselves.
          </p>
        </div>
        <Link to="/admin" className="text-xs text-muted-foreground hover:text-[var(--neon)]">← Admin</Link>
      </div>

      <PromoQueue />
      <ReleaseSchedule />
      <SiteCopyEditor />
    </div>
  );
}

// ------------------------------------------------------------ promo queue ---

function PromoQueue() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListPromos);
  const upsertFn = useServerFn(adminUpsertPromo);
  const deleteFn = useServerFn(adminDeletePromo);

  const q = useQuery({ queryKey: ["admin-promos"], queryFn: () => listFn() });
  const [draft, setDraft] = useState<PromoDraft>(EMPTY_PROMO);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-promos"] });
    // The bar itself. Without this the admin saves, looks at the site, and sees
    // the old announcement for up to the 5-minute staleTime.
    qc.invalidateQueries({ queryKey: ["live-promo"] });
  };

  const upsert = useMutation({
    mutationFn: (d: PromoDraft) =>
      upsertFn({
        data: {
          id: d.id,
          message: d.message.trim(),
          href: d.href.trim() || null,
          cta: d.cta.trim() || null,
          starts_at: d.starts_at || null,
          ends_at: d.ends_at || null,
          priority: d.priority,
          is_active: d.is_active,
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      setDraft(EMPTY_PROMO);
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

  const editRow = (r: PromoRow) =>
    setDraft({
      id: r.id,
      message: r.message,
      href: r.href ?? "",
      cta: r.cta ?? "",
      starts_at: toLocalInput(r.starts_at),
      ends_at: toLocalInput(r.ends_at),
      priority: r.priority,
      is_active: r.is_active,
    });

  return (
    <>
      <section className="mt-10">
        <h2 className="text-lg font-black uppercase tracking-tight">Announcement bar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The black strip above the nav, sitewide. The site shows the highest-priority row whose window
          contains right now. When nothing is scheduled it falls back to evergreen copy.
        </p>

        <div className="mt-5 space-y-3">
          {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {q.data?.map((r) => {
            const w = windowLabel(r.starts_at, r.ends_at, r.is_active);
            return (
              <div key={r.id} className="rounded-md border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-[2px] ${w.tone}`}>{w.text}</span>
                  <span className="text-xs text-muted-foreground">priority <strong>{r.priority}</strong></span>
                </div>
                <p className="mt-2 text-sm font-bold uppercase tracking-[1.5px]">{r.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.href ? `${r.cta ? `${r.cta} → ` : ""}${r.href}` : "No link — renders as plain text"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.starts_at ? new Date(r.starts_at).toLocaleString() : "runs now"} →{" "}
                  {r.ends_at ? new Date(r.ends_at).toLocaleString() : "until paused"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => editRow(r)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={del.isPending}
                    onClick={() => {
                      if (confirm("Delete this announcement?")) del.mutate(r.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
          {q.data?.length === 0 && (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nothing scheduled. The bar is showing its evergreen fallback.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-md border border-border bg-card p-6">
        <h3 className="text-base font-black uppercase tracking-tight">
          {draft.id ? "Edit announcement" : "New announcement"}
        </h3>

        <div className="mt-4">
          <Label>Message *</Label>
          <Textarea
            rows={2}
            maxLength={300}
            value={draft.message}
            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
            placeholder="BATTLEFIELD ATLANTIS PAGES 11–14 DROP OCTOBER 7"
          />
          <p className="mt-1 text-xs text-muted-foreground">Rendered in caps. {draft.message.length}/300.</p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label>Link</Label>
            <Input
              value={draft.href}
              onChange={(e) => setDraft({ ...draft, href: e.target.value })}
              placeholder="/battlefield-atlantis"
            />
            <p className="mt-1 text-xs text-muted-foreground">Leave blank for an announcement with nowhere to go.</p>
          </div>
          <div>
            <Label>CTA</Label>
            <Input
              value={draft.cta}
              onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
              placeholder="See the schedule"
            />
            <p className="mt-1 text-xs text-muted-foreground">Shown after the message on wider screens.</p>
          </div>
          <div>
            <Label>Starts</Label>
            <Input
              type="datetime-local"
              value={draft.starts_at}
              onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted-foreground">Blank = already running.</p>
          </div>
          <div>
            <Label>Ends</Label>
            <Input
              type="datetime-local"
              value={draft.ends_at}
              onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Blank = runs until paused. Set this on anything with a date in it.
            </p>
          </div>
          <div>
            <Label>Priority</Label>
            <Input
              type="number"
              min={0}
              max={1000}
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) || 0 })}
            />
            <p className="mt-1 text-xs text-muted-foreground">Higher wins when two windows overlap.</p>
          </div>
          <div>
            <Label className="mb-2 block">Active</Label>
            <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            disabled={upsert.isPending}
            onClick={() => {
              if (!draft.message.trim()) {
                toast.error("Message is required.");
                return;
              }
              upsert.mutate(draft);
            }}
          >
            {upsert.isPending ? "Saving…" : draft.id ? "Save changes" : "Schedule announcement"}
          </Button>
          {draft.id && <Button variant="outline" onClick={() => setDraft(EMPTY_PROMO)}>Cancel</Button>}
        </div>
      </section>
    </>
  );
}

// -------------------------------------------------------- release schedule ---

function ReleaseSchedule() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListIssueDrops);
  const upsertFn = useServerFn(adminUpsertIssueDrop);
  const deleteFn = useServerFn(adminDeleteIssueDrop);

  const q = useQuery({ queryKey: ["admin-issue-drops"], queryFn: () => listFn() });
  const [draft, setDraft] = useState<DropDraft>(EMPTY_DROP);

  const issues = q.data?.issues ?? [];
  const drops = q.data?.drops ?? [];
  const issueLabel = (id: string) => {
    const i = issues.find((x) => x.id === id);
    return i ? `${i.slug} · #${i.issue_number}` : id;
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-issue-drops"] });
  };

  const upsert = useMutation({
    mutationFn: (d: DropDraft) => {
      const pages = d.pages
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number);
      if (pages.some((n) => !Number.isInteger(n) || n < 0)) {
        throw new Error("Pages must be whole numbers, e.g. 11, 12, 13, 14");
      }
      return upsertFn({
        data: {
          id: d.id,
          issue_id: d.issue_id,
          week: d.week,
          pages,
          patron_date: d.patron_date,
          initiate_date: d.initiate_date || null,
          reader_date: d.reader_date,
        },
      });
    },
    onSuccess: () => {
      toast.success("Saved");
      setDraft(EMPTY_DROP);
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

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <section className="mt-14">
        <h2 className="text-lg font-black uppercase tracking-tight">Release schedule</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drives the per-page drop labels, the “next drop” card, and “issue completes” on each series
          page. Only drops dated today or later are shown to readers — a past date is never presented
          as upcoming. An issue with no future drops reads “Schedule to be announced”.
        </p>

        <div className="mt-5 space-y-3">
          {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {drops.map((r) => {
            const past = r.patron_date < today;
            return (
              <div key={r.id} className="rounded-md border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[2px] text-muted-foreground">
                      {issueLabel(r.issue_id)} · week {r.week}
                    </div>
                    <h3 className="mt-1 text-sm font-black">Pages {(r.pages ?? []).join(", ")}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-[2px] ${past ? "text-muted-foreground" : "text-[var(--neon)]"}`}
                  >
                    {past ? "RELEASED" : "UPCOMING"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Patron {r.patron_date} · Initiate {r.initiate_date ?? `${r.patron_date} +1 day`} · Reader{" "}
                  {r.reader_date}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDraft({
                        id: r.id,
                        issue_id: r.issue_id,
                        week: r.week,
                        pages: (r.pages ?? []).join(", "),
                        patron_date: r.patron_date,
                        initiate_date: r.initiate_date ?? "",
                        reader_date: r.reader_date,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={del.isPending}
                    onClick={() => {
                      if (confirm(`Delete week ${r.week} of ${issueLabel(r.issue_id)}?`)) del.mutate(r.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
          {drops.length === 0 && (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No drops scheduled for any issue.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-md border border-border bg-card p-6">
        <h3 className="text-base font-black uppercase tracking-tight">
          {draft.id ? "Edit drop" : "New drop"}
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label>Issue *</Label>
            <select
              value={draft.issue_id}
              onChange={(e) => setDraft({ ...draft, issue_id: e.target.value })}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select an issue…</option>
              {issues.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.slug} · #{i.issue_number} — {i.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Week *</Label>
            <Input
              type="number"
              min={1}
              max={52}
              value={draft.week}
              onChange={(e) => setDraft({ ...draft, week: Number(e.target.value) || 1 })}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Pages *</Label>
            <Input
              value={draft.pages}
              onChange={(e) => setDraft({ ...draft, pages: e.target.value })}
              placeholder="11, 12, 13, 14"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Comma-separated. These page numbers get the drop label on the series page.
            </p>
          </div>
          <div>
            <Label>Patron date *</Label>
            <Input
              type="date"
              value={draft.patron_date}
              onChange={(e) => setDraft({ ...draft, patron_date: e.target.value })}
            />
          </div>
          <div>
            <Label>Initiate date</Label>
            <Input
              type="date"
              value={draft.initiate_date}
              onChange={(e) => setDraft({ ...draft, initiate_date: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted-foreground">Blank = the day after the patron date.</p>
          </div>
          <div>
            <Label>Reader date *</Label>
            <Input
              type="date"
              value={draft.reader_date}
              onChange={(e) => setDraft({ ...draft, reader_date: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            disabled={upsert.isPending}
            onClick={() => {
              if (!draft.issue_id || !draft.pages.trim() || !draft.patron_date || !draft.reader_date) {
                toast.error("Issue, pages, patron date, and reader date are required.");
                return;
              }
              upsert.mutate(draft);
            }}
          >
            {upsert.isPending ? "Saving…" : draft.id ? "Save changes" : "Add drop"}
          </Button>
          {draft.id && <Button variant="outline" onClick={() => setDraft(EMPTY_DROP)}>Cancel</Button>}
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------- site copy ---

function SiteCopyEditor() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListSiteCopy);
  const updateFn = useServerFn(adminUpdateSiteCopy);

  const q = useQuery({ queryKey: ["admin-site-copy"], queryFn: () => listFn() });
  const [edits, setEdits] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: (v: { key: string; value: string }) => updateFn({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(`Saved ${v.key}`);
      setEdits((e) => {
        const next = { ...e };
        delete next[v.key];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["admin-site-copy"] });
      qc.invalidateQueries({ queryKey: ["site-copy"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  return (
    <section className="mt-14">
      <h2 className="text-lg font-black uppercase tracking-tight">Site copy</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Keyed strings the homepage and studio pages read at render. Keys are fixed — a key the site
        does not read would save fine and change nothing, so new ones are not creatable here.
      </p>

      <div className="mt-5 space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {q.data?.map((r) => {
          const dirty = edits[r.key] !== undefined && edits[r.key] !== r.value;
          return (
            <div key={r.key} className="rounded-md border border-border bg-card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <code className="text-xs text-[var(--neon)]">{r.key}</code>
                <span className="text-xs text-muted-foreground">
                  updated {new Date(r.updated_at).toLocaleDateString()}
                </span>
              </div>
              <Textarea
                rows={2}
                maxLength={4000}
                className="mt-2"
                value={edits[r.key] ?? r.value}
                onChange={(e) => setEdits({ ...edits, [r.key]: e.target.value })}
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  disabled={!dirty || save.isPending}
                  onClick={() => save.mutate({ key: r.key, value: edits[r.key] })}
                >
                  {dirty ? "Save" : "Saved"}
                </Button>
                {dirty && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEdits((e) => {
                        const next = { ...e };
                        delete next[r.key];
                        return next;
                      })
                    }
                  >
                    Revert
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {q.data?.length === 0 && (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No site_copy rows.
          </p>
        )}
      </div>
    </section>
  );
}
