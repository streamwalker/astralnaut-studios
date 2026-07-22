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
  adminListAuthorFaq,
  adminUpsertAuthorFaq,
  adminDeleteAuthorFaq,
} from "@/lib/author-faq.functions";

export const Route = createFileRoute("/_authenticated/admin/author-faq")({
  head: () => ({ meta: [{ title: "Author FAQ — Astralnaut Studios" }] }),
  component: AdminAuthorFaq,
});

type Row = Awaited<ReturnType<typeof adminListAuthorFaq>>[number];

type Draft = {
  id: string | null;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY: Draft = {
  id: null,
  question: "",
  answer: "",
  sort_order: 0,
  is_active: true,
};

function AdminAuthorFaq() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListAuthorFaq);
  const upsertFn = useServerFn(adminUpsertAuthorFaq);
  const deleteFn = useServerFn(adminDeleteAuthorFaq);

  const q = useQuery({
    queryKey: ["admin-author-faq"],
    queryFn: () => listFn(),
  });

  const [draft, setDraft] = useState<Draft>(EMPTY);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-author-faq"] });
    qc.invalidateQueries({ queryKey: ["author-faq"] });
  };

  const upsert = useMutation({
    mutationFn: (d: Draft) =>
      upsertFn({
        data: {
          id: d.id,
          question: d.question,
          answer: d.answer,
          sort_order: d.sort_order,
          is_active: d.is_active,
        },
      }),
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
      question: r.question,
      answer: r.answer,
      sort_order: r.sort_order,
      is_active: r.is_active,
    });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Author FAQ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit the “About the author” FAQ on <code>/children-of-aquarius</code>. Items appear in
            sort order; inactive items are hidden from readers.
          </p>
        </div>
        <Link to="/admin" className="text-xs text-muted-foreground hover:text-[var(--neon)]">← Admin</Link>
      </div>

      <section className="mt-8 space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {q.data?.map((r) => (
          <div key={r.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-base font-black">{r.question}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className={r.is_active ? "text-[var(--neon)]" : "text-muted-foreground"}>
                  {r.is_active ? "ACTIVE" : "HIDDEN"}
                </span>
                <span>sort <strong>{r.sort_order}</strong></span>
              </div>
            </div>
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{r.answer}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => editRow(r)}>Edit</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm(`Delete FAQ item "${r.question}"?`)) del.mutate(r.id);
                }}
                disabled={del.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {q.data?.length === 0 && (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No FAQ items yet. Create one below.
          </p>
        )}
      </section>

      <section className="mt-10 rounded-md border border-border bg-card p-6">
        <h2 className="text-lg font-black uppercase tracking-tight">
          {draft.id ? "Edit FAQ item" : "New FAQ item"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Tip: this is where you control the “neither confirm nor deny” language — edit any answer freely.
        </p>

        <div className="mt-5">
          <Label>Question *</Label>
          <Input
            value={draft.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
            maxLength={300}
          />
        </div>

        <div className="mt-4">
          <Label>Answer *</Label>
          <Textarea
            rows={7}
            value={draft.answer}
            onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
            maxLength={4000}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:max-w-sm">
          <div>
            <Label>Sort order</Label>
            <Input
              type="number"
              min={0}
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label className="mb-2 block">Active</Label>
            <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={() => {
              if (!draft.question.trim() || !draft.answer.trim()) {
                toast.error("Question and answer are required.");
                return;
              }
              upsert.mutate(draft);
            }}
            disabled={upsert.isPending}
          >
            {upsert.isPending ? "Saving…" : draft.id ? "Save changes" : "Create item"}
          </Button>
          {draft.id && (
            <Button variant="outline" onClick={() => setDraft(EMPTY)}>Cancel</Button>
          )}
        </div>
      </section>
    </div>
  );
}
