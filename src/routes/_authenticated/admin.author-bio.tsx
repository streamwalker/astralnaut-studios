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
  adminListAuthorBioVariants,
  adminUpsertAuthorBioVariant,
  adminDeleteAuthorBioVariant,
} from "@/lib/author-bio.functions";

export const Route = createFileRoute("/_authenticated/admin/author-bio")({
  head: () => ({ meta: [{ title: "Author Bio A/B — Astralnaut Studios" }] }),
  component: AdminAuthorBio,
});

type Row = Awaited<ReturnType<typeof adminListAuthorBioVariants>>[number];

const EMPTY: Draft = {
  id: null,
  slug: "",
  label: "",
  eyebrow: "About the author",
  pull_quote: "",
  body: "",
  disclaimer: "",
  cta_label: "",
  cta_href: "",
  weight: 1,
  is_active: true,
  sort_order: 0,
};

type Draft = {
  id: string | null;
  slug: string;
  label: string;
  eyebrow: string;
  pull_quote: string;
  body: string;
  disclaimer: string;
  cta_label: string;
  cta_href: string;
  weight: number;
  is_active: boolean;
  sort_order: number;
};

function AdminAuthorBio() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListAuthorBioVariants);
  const upsertFn = useServerFn(adminUpsertAuthorBioVariant);
  const deleteFn = useServerFn(adminDeleteAuthorBioVariant);

  const q = useQuery({
    queryKey: ["admin-author-bio"],
    queryFn: () => listFn(),
  });

  const [draft, setDraft] = useState<Draft>(EMPTY);

  const totalWeight = useMemo(
    () => (q.data ?? []).filter((v) => v.is_active).reduce((s, v) => s + v.weight, 0),
    [q.data],
  );

  const upsert = useMutation({
    mutationFn: (d: Draft) => upsertFn({
      data: {
        id: d.id,
        slug: d.slug.trim(),
        label: d.label.trim(),
        eyebrow: d.eyebrow.trim(),
        pull_quote: d.pull_quote,
        body: d.body,
        disclaimer: d.disclaimer,
        cta_label: d.cta_label,
        cta_href: d.cta_href,
        weight: d.weight,
        is_active: d.is_active,
        sort_order: d.sort_order,
      },
    }),
    onSuccess: () => {
      toast.success("Saved");
      setDraft(EMPTY);
      qc.invalidateQueries({ queryKey: ["admin-author-bio"] });
      qc.invalidateQueries({ queryKey: ["author-bio-variants"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-author-bio"] });
      qc.invalidateQueries({ queryKey: ["author-bio-variants"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const editRow = (r: Row) => setDraft({
    id: r.id,
    slug: r.slug,
    label: r.label,
    eyebrow: r.eyebrow,
    pull_quote: r.pull_quote ?? "",
    body: r.body,
    disclaimer: r.disclaimer ?? "",
    cta_label: r.cta_label ?? "",
    cta_href: r.cta_href ?? "",
    weight: r.weight,
    is_active: r.is_active,
    sort_order: r.sort_order,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Author bio — A/B test</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live on <code>/children-of-aquarius</code>. Traffic splits by weight across active variants.
            Total active weight: <strong>{totalWeight}</strong>.
          </p>
        </div>
        <Link to="/admin" className="text-xs text-muted-foreground hover:text-[var(--neon)]">← Admin</Link>
      </div>

      <section className="mt-8 space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {q.data?.map((r) => {
          const cr = r.impressions > 0 ? (r.conversions / r.impressions) * 100 : 0;
          return (
            <div key={r.id} className="rounded-md border border-border bg-card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[2px] text-muted-foreground">{r.slug}</div>
                  <h3 className="mt-1 text-lg font-black">{r.label}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className={r.is_active ? "text-[var(--neon)]" : "text-muted-foreground"}>
                    {r.is_active ? "ACTIVE" : "PAUSED"}
                  </span>
                  <span>weight <strong>{r.weight}</strong></span>
                  <span>impressions <strong>{r.impressions}</strong></span>
                  <span>conversions <strong>{r.conversions}</strong></span>
                  <span>CR <strong>{cr.toFixed(2)}%</strong></span>
                </div>
              </div>
              {r.pull_quote && (
                <p className="mt-3 border-l-2 border-[var(--gold)] pl-3 text-sm italic text-[var(--gold)]">“{r.pull_quote}”</p>
              )}
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{r.body}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => editRow(r)}>Edit</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Delete variant "${r.label}"? This also deletes its event history.`)) {
                      del.mutate(r.id);
                    }
                  }}
                  disabled={del.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
        {q.data?.length === 0 && (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No variants yet. Create one below.
          </p>
        )}
      </section>

      <section className="mt-10 rounded-md border border-border bg-card p-6">
        <h2 className="text-lg font-black uppercase tracking-tight">
          {draft.id ? "Edit variant" : "New variant"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Body / disclaimer support light Markdown: <code>**bold**</code>, <code>*italic*</code>, blank line = new paragraph.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <Label>Slug *</Label>
            <Input
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
              placeholder="promo-v2"
            />
          </div>
          <div>
            <Label>Label *</Label>
            <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="Promotional (stronger)" />
          </div>
          <div>
            <Label>Eyebrow *</Label>
            <Input value={draft.eyebrow} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Weight</Label>
              <Input type="number" min={0} max={100} value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Sort</Label>
              <Input type="number" min={0} value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <Label className="mb-2 block">Active</Label>
              <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Label>Pull quote</Label>
          <Textarea rows={2} value={draft.pull_quote} onChange={(e) => setDraft({ ...draft, pull_quote: e.target.value })} maxLength={500} />
        </div>

        <div className="mt-4">
          <Label>Body *</Label>
          <Textarea rows={7} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} maxLength={4000} />
        </div>

        <div className="mt-4">
          <Label>Disclaimer</Label>
          <Textarea rows={3} value={draft.disclaimer} onChange={(e) => setDraft({ ...draft, disclaimer: e.target.value })} maxLength={1000} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label>CTA label</Label>
            <Input value={draft.cta_label} onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })} placeholder="Read Issue #1" />
          </div>
          <div>
            <Label>CTA link</Label>
            <Input value={draft.cta_href} onChange={(e) => setDraft({ ...draft, cta_href: e.target.value })} placeholder="/reader/children-of-aquarius/1" />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={() => {
              if (!draft.slug || !draft.label || !draft.body) {
                toast.error("Slug, label, and body are required.");
                return;
              }
              upsert.mutate(draft);
            }}
            disabled={upsert.isPending}
          >
            {upsert.isPending ? "Saving…" : draft.id ? "Save changes" : "Create variant"}
          </Button>
          {draft.id && (
            <Button variant="outline" onClick={() => setDraft(EMPTY)}>Cancel</Button>
          )}
        </div>
      </section>
    </div>
  );
}
