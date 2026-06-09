import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { adminListLetters, adminSetLetterStatus } from "@/lib/admin-letters.functions";

export const Route = createFileRoute("/_authenticated/admin/letters")({
  head: () => ({ meta: [{ title: "Letters Admin — Astralnaut Studios" }] }),
  component: AdminLetters,
});

type Row = Awaited<ReturnType<typeof adminListLetters>>[number];

function AdminLetters() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListLetters);
  const [seriesSlug, setSeriesSlug] = useState<string>("all");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "hidden" | "all">("pending");

  const q = useQuery({
    queryKey: ["admin-letters", seriesSlug, status],
    queryFn: () => listFn({ data: { seriesSlug: seriesSlug === "all" ? undefined : seriesSlug, status } }),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight">Letters</h1>
        <Link to="/admin" className="text-xs text-muted-foreground hover:text-[var(--neon)]">← Admin</Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Curate reader mail. Approved letters become public when their issue's last page drops.</p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs uppercase tracking-[2px]">Series</Label>
          <Select value={seriesSlug} onValueChange={setSeriesSlug}>
            <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All series</SelectItem>
              <SelectItem value="battlefield-atlantis">Battlefield Atlantis</SelectItem>
              <SelectItem value="children-of-aquarius">Children of Aquarius</SelectItem>
              <SelectItem value="darker-ages">Darker Ages</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-[2px]">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {q.data?.length === 0 && <p className="text-sm text-muted-foreground">This is such an awesome comic</p>}
        {q.data?.map((row) => (
          <LetterAdminRow
            key={row.id}
            row={row}
            onChanged={() => qc.invalidateQueries({ queryKey: ["admin-letters"] })}
          />
        ))}
      </div>
    </div>
  );
}

function LetterAdminRow({ row, onChanged }: { row: Row; onChanged: () => void }) {
  const setStatusFn = useServerFn(adminSetLetterStatus);
  const [reply, setReply] = useState(row.editor_reply ?? "");
  const [order, setOrder] = useState<string>(row.feature_order != null ? String(row.feature_order) : "");

  const mutate = useMutation({
    mutationFn: (status: "pending" | "approved" | "rejected" | "hidden") =>
      setStatusFn({
        data: {
          id: row.id,
          status,
          editorReply: reply.trim() || null,
          featureOrder: order ? Number(order) : null,
        },
      }),
    onSuccess: () => { toast.success("Saved"); onChanged(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const issue = row.issue as { issue_number?: number; title?: string; series?: { slug?: string; name?: string } } | null;

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-[2px] text-muted-foreground">
            {issue?.series?.name} · Issue {issue?.issue_number}
          </div>
          <h3 className="mt-1 text-lg font-black">{row.subject}</h3>
          <div className="text-xs text-muted-foreground">
            — {row.display_name}{row.location ? `, ${row.location}` : ""} · {new Date(row.created_at).toLocaleString()}
          </div>
        </div>
        <span className="rounded-sm border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-[2px]">
          {row.status}
        </span>
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-sm border border-border/60 bg-background/50 p-3 text-sm">
        {row.body}
      </pre>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px]">
        <div>
          <Label className="text-xs uppercase tracking-[2px]">Editor reply</Label>
          <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-[2px]">Feature order</Label>
          <Input type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => mutate.mutate("approved")} disabled={mutate.isPending}>Approve</Button>
        <Button size="sm" variant="outline" onClick={() => mutate.mutate("pending")} disabled={mutate.isPending}>Mark pending</Button>
        <Button size="sm" variant="outline" onClick={() => mutate.mutate("rejected")} disabled={mutate.isPending}>Reject</Button>
        <Button size="sm" variant="outline" onClick={() => mutate.mutate("hidden")} disabled={mutate.isPending}>Hide</Button>
      </div>
    </div>
  );
}
