import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SeriesRow = { id: string; slug: string; name: string; issn: string | null };
type IssueRow = {
  id: string;
  series_id: string;
  issue_number: number;
  title: string;
  internal_identifier: string | null;
  volume: number;
  publication_year: number;
};

const SERIES_CODES: Record<string, string> = {
  "battlefield-atlantis": "BFA",
  "darker-ages": "DA",
  "children-of-aquarius": "COA",
};

function suggestIdentifier(seriesSlug: string, volume: number, issueNumber: number) {
  const code = SERIES_CODES[seriesSlug] ?? seriesSlug.slice(0, 3).toUpperCase();
  const v = String(volume).padStart(2, "0");
  const i = String(issueNumber).padStart(3, "0");
  return `${code}-V${v}-I${i}-WEB`;
}

export function SerialMetadataPanel() {
  const qc = useQueryClient();

  const { data: series } = useQuery({
    queryKey: ["admin-serial-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id, slug, name, issn")
        .order("sort_order");
      if (error) throw error;
      return data as SeriesRow[];
    },
  });

  const { data: issues } = useQuery({
    queryKey: ["admin-serial-issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("id, series_id, issue_number, title, internal_identifier, volume, publication_year")
        .order("series_id")
        .order("issue_number");
      if (error) throw error;
      return data as IssueRow[];
    },
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
      <h2 className="text-xl font-bold">Serial publication metadata</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Set the per-series online ISSN (leave blank until the Library of Congress
        assigns it) and per-issue internal catalog identifier. Identifiers appear
        only inside admin; readers never see them.
      </p>

      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Series ISSN</h3>
        {series?.map((s) => (
          <SeriesIssnRow key={s.id} row={s} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-serial-series"] })} />
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Issue identifiers</h3>
        {series?.map((s) => {
          const rows = (issues ?? []).filter((i) => i.series_id === s.id);
          return (
            <div key={s.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 font-semibold">{s.name}</div>
              {rows.length === 0 && (
                <p className="text-xs text-muted-foreground">No issues yet.</p>
              )}
              {rows.map((row) => (
                <IssueMetaRow
                  key={row.id}
                  row={row}
                  seriesSlug={s.slug}
                  onSaved={() => qc.invalidateQueries({ queryKey: ["admin-serial-issues"] })}
                />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SeriesIssnRow({ row, onSaved }: { row: SeriesRow; onSaved: () => void }) {
  const [issn, setIssn] = useState(row.issn ?? "");
  const [saving, setSaving] = useState(false);
  useEffect(() => setIssn(row.issn ?? ""), [row.issn]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("series")
      .update({ issn: issn.trim() || null })
      .eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${row.name} ISSN updated`);
    onSaved();
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
      <div className="text-sm font-medium">{row.name}</div>
      <div>
        <Label className="text-xs">ISSN (Online)</Label>
        <Input
          value={issn}
          onChange={(e) => setIssn(e.target.value)}
          placeholder="pending assignment"
        />
      </div>
      <Button onClick={save} disabled={saving} size="sm">
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function IssueMetaRow({
  row,
  seriesSlug,
  onSaved,
}: {
  row: IssueRow;
  seriesSlug: string;
  onSaved: () => void;
}) {
  const [volume, setVolume] = useState(String(row.volume ?? 1));
  const [year, setYear] = useState(String(row.publication_year ?? 2026));
  const [identifier, setIdentifier] = useState(row.internal_identifier ?? "");
  const [saving, setSaving] = useState(false);

  const suggestion = useMemo(
    () => suggestIdentifier(seriesSlug, Number(volume) || 1, row.issue_number),
    [seriesSlug, volume, row.issue_number],
  );

  useEffect(() => {
    setVolume(String(row.volume ?? 1));
    setYear(String(row.publication_year ?? 2026));
    setIdentifier(row.internal_identifier ?? "");
  }, [row.id, row.volume, row.publication_year, row.internal_identifier]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("issues")
      .update({
        volume: Number(volume) || 1,
        publication_year: Number(year) || 2026,
        internal_identifier: identifier.trim() || null,
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Issue #${row.issue_number} updated`);
    onSaved();
  }

  return (
    <div className="mt-3 grid gap-2 border-t border-border pt-3 sm:grid-cols-[auto_80px_100px_1fr_auto] sm:items-end">
      <div className="text-sm">
        <div className="font-medium">#{row.issue_number} · {row.title}</div>
      </div>
      <div>
        <Label className="text-xs">Volume</Label>
        <Input value={volume} onChange={(e) => setVolume(e.target.value)} inputMode="numeric" />
      </div>
      <div>
        <Label className="text-xs">Year</Label>
        <Input value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" />
      </div>
      <div>
        <Label className="text-xs">Internal identifier</Label>
        <div className="flex gap-2">
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={suggestion}
            className="font-mono"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => setIdentifier(suggestion)}>
            Auto
          </Button>
        </div>
      </div>
      <Button onClick={save} disabled={saving} size="sm">
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
