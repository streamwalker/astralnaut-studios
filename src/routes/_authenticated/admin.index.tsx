import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import logo from "@/assets/astralnaut-logo.png";
import { PageRow } from "@/components/admin/page-row";
import { AnalyticsPanel } from "@/components/admin/analytics-panel";
import { SerialMetadataPanel } from "@/components/admin/serial-metadata-panel";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — Astralnaut Studios" }] }),
  component: AdminPage,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function inferPageFromFilename(name: string, fallback: number): number {
  const base = name.replace(/\.[^.]+$/, "");
  const matches = base.match(/(\d+)(?!.*\d)/);
  if (matches) {
    const n = parseInt(matches[1], 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return fallback;
}

function AdminPage() {
  const nav = useNavigate();

  const { data: userData } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", userData?.id],
    enabled: !!userData?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const { data: comics } = useQuery({
    queryKey: ["admin-comics"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comics")
        .select("id, title, slug, page_number, image_path, published_at, created_at, is_free, alt_text, issue_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allSeries } = useQuery({
    queryKey: ["admin-mgr-series"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id, name, slug")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [mgrSeriesId, setMgrSeriesId] = useState<string>("");
  const [mgrIssueId, setMgrIssueId] = useState<string>("");

  const { data: mgrIssues } = useQuery({
    queryKey: ["admin-mgr-issues", mgrSeriesId],
    enabled: !!isAdmin && !!mgrSeriesId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("id, issue_number, title, slug")
        .eq("series_id", mgrSeriesId)
        .order("issue_number", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: issuePages } = useQuery({
    queryKey: ["admin-issue-pages", mgrIssueId],
    enabled: !!isAdmin && !!mgrIssueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comics")
        .select("id, title, slug, page_number, image_path, published_at, is_free, alt_text, issue_id")
        .eq("issue_id", mgrIssueId)
        .order("page_number", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

  if (roleLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Checking access…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-bold">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({userData?.email}) doesn't have admin access.
          </p>
          <Button onClick={handleSignOut} variant="outline" className="mt-6">Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Astralnaut Studios" className="h-8 w-auto" />
            <span className="text-sm font-semibold tracking-[0.18em]">ADMIN</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/admin/media" className="rounded-md border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-muted-foreground hover:text-foreground">
              Media
            </Link>
            <Link to="/admin/users" className="rounded-md border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-muted-foreground hover:text-foreground">
              Users
            </Link>
            <Link to="/admin/security" className="rounded-md border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-muted-foreground hover:text-foreground">
              Security
            </Link>
            <Link to="/admin/letters" className="rounded-md border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-muted-foreground hover:text-foreground">
              Letters
            </Link>
            <Link to="/admin/subscription-test" className="rounded-md border border-[var(--neon)]/40 px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-[var(--neon)] hover:bg-[var(--neon)]/10">
              Sub Test
            </Link>
            <Link to="/growth-package" className="rounded-md border border-[var(--gold)]/40 px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-[var(--gold)] hover:bg-[var(--gold)]/10">
              Growth Package
            </Link>
            <span className="text-muted-foreground">{userData?.email}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm">Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1fr_1.1fr]">
        <AnalyticsPanel />
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Upload comic pages</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload one page, or batch-upload an entire issue at once.
          </p>

          <Tabs defaultValue="batch" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single page</TabsTrigger>
              <TabsTrigger value="batch">Batch upload</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="mt-6">
              <SinglePageForm />
            </TabsContent>

            <TabsContent value="batch" className="mt-6">
              <BatchUploadForm />
            </TabsContent>
          </Tabs>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Manage pages</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick an issue to reorder, edit, replace, or delete pages. Leave blank
            to see the 30 most recent uploads.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Series</Label>
              <Select
                value={mgrSeriesId}
                onValueChange={(v) => { setMgrSeriesId(v); setMgrIssueId(""); }}
              >
                <SelectTrigger><SelectValue placeholder="All series" /></SelectTrigger>
                <SelectContent>
                  {allSeries?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Issue</Label>
              <Select
                value={mgrIssueId}
                onValueChange={setMgrIssueId}
                disabled={!mgrSeriesId}
              >
                <SelectTrigger><SelectValue placeholder={mgrSeriesId ? "Pick an issue" : "Pick a series first"} /></SelectTrigger>
                <SelectContent>
                  {mgrIssues?.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      #{i.issue_number} — {i.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {mgrIssueId ? (
            <>
              <p className="mt-6 text-xs text-muted-foreground">
                {issuePages?.length ?? 0} page{(issuePages?.length ?? 0) === 1 ? "" : "s"} in this issue.
              </p>
              <ul className="mt-3 space-y-3">
                {issuePages?.map((p, idx) => (
                  <PageRow
                    key={p.id}
                    page={p}
                    neighbors={{
                      up: issuePages[idx - 1],
                      down: issuePages[idx + 1],
                    }}
                    invalidateKeys={[
                      ["admin-issue-pages", mgrIssueId],
                      ["admin-comics"],
                    ]}
                  />
                ))}
                {issuePages?.length === 0 && (
                  <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    This issue has no pages yet.
                  </li>
                )}
              </ul>
            </>
          ) : (
            <>
              <p className="mt-6 text-xs text-muted-foreground">
                {comics?.length ?? 0} page{(comics?.length ?? 0) === 1 ? "" : "s"} total · showing 30 most recent.
              </p>
              <ul className="mt-3 space-y-3">
                {comics?.slice(0, 30).map((c) => (
                  <PageRow
                    key={c.id}
                    page={c}
                    invalidateKeys={[["admin-comics"]]}
                  />
                ))}
                {comics?.length === 0 && (
                  <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No pages yet. Upload your first on the left.
                  </li>
                )}
              </ul>
            </>
          )}
        </section>
        <SerialMetadataPanel />
      </main>
    </div>
  );
}

// ---------- Single page form (existing flow) ----------

function SinglePageForm() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [altText, setAltText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [publishNow, setPublishNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const autoSlug = useMemo(() => slugify(title), [title]);
  useEffect(() => {
    if (!slug || slug === autoSlug) setSlug(autoSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSlug]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Choose an image file."); return; }
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (!slug.trim()) { toast.error("Slug is required."); return; }
    if (!Number.isFinite(pageNumber) || pageNumber < 1) { toast.error("Page number must be ≥ 1."); return; }

    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${slug}/page-${String(pageNumber).padStart(3, "0")}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("comic-pages")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("comics").insert({
        title: title.trim(),
        slug: slug.trim(),
        page_number: pageNumber,
        image_path: path,
        alt_text: altText.trim() || null,
        transcript: transcript.trim() || null,
        published_at: publishNow ? new Date().toISOString() : null,
      });
      if (insErr) throw insErr;

      toast.success(`Uploaded "${title}" (page ${pageNumber}).`);
      setTitle(""); setSlug(""); setAltText(""); setTranscript("");
      setPageNumber((n) => n + 1);
      setFile(null);
      const el = document.getElementById("file-input") as HTMLInputElement | null;
      if (el) el.value = "";
      qc.invalidateQueries({ queryKey: ["admin-comics"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Battlefield Atlantis — Issue #1, Page 5" required />
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-3">
        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="battlefield-atlantis-1-5" required />
        </div>
        <div>
          <Label htmlFor="page">Page # *</Label>
          <Input id="page" type="number" min={1} value={pageNumber} onChange={(e) => setPageNumber(parseInt(e.target.value, 10) || 1)} required />
        </div>
      </div>

      <div>
        <Label htmlFor="file-input">Image *</Label>
        <Input id="file-input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      </div>

      <div>
        <Label htmlFor="alt">Alt text</Label>
        <Input id="alt" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Orion looks up as Zeus extends a glowing hand." />
      </div>

      <div>
        <Label htmlFor="transcript">Transcript (optional)</Label>
        <Textarea id="transcript" rows={3} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Panel 1: …" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
        Publish immediately
      </label>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Uploading…" : "Upload page"}
      </Button>
    </form>
  );
}

// ---------- Batch upload form ----------

type QueueStatus = "queued" | "uploading" | "done" | "error";

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  pageNumber: number;
  title: string;
  status: QueueStatus;
  error?: string;
};

function BatchUploadForm() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [seriesId, setSeriesId] = useState<string>("");
  const [issueId, setIssueId] = useState<string>(""); // "" | "__new__" | uuid
  const [startPage, setStartPage] = useState<number>(1);
  const [freePages, setFreePages] = useState<number>(9);
  const [publishNow, setPublishNow] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  // New issue fields
  const [newIssueNumber, setNewIssueNumber] = useState<number>(1);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueSlug, setNewIssueSlug] = useState("");

  const { data: seriesList } = useQuery({
    queryKey: ["admin-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id, name, slug")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: issuesList } = useQuery({
    queryKey: ["admin-issues", seriesId],
    enabled: !!seriesId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("id, issue_number, title, slug, free_pages")
        .eq("series_id", seriesId)
        .order("issue_number", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const selectedIssue = useMemo(
    () => issuesList?.find((i) => i.id === issueId),
    [issuesList, issueId],
  );
  const selectedSeries = useMemo(
    () => seriesList?.find((s) => s.id === seriesId),
    [seriesList, seriesId],
  );

  // Populate free pages default when issue changes
  useEffect(() => {
    if (selectedIssue?.free_pages != null) {
      setFreePages(Number(selectedIssue.free_pages));
    }
  }, [selectedIssue]);

  // Auto-slug for new issue
  useEffect(() => {
    setNewIssueSlug(slugify(newIssueTitle));
  }, [newIssueTitle]);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    arr.sort((a, b) => naturalSort(a.name, b.name));
    setQueue((prev) => {
      const baseStart = prev.length > 0
        ? Math.max(...prev.map((q) => q.pageNumber)) + 1
        : startPage;
      const next: QueueItem[] = arr.map((file, i) => ({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        previewUrl: URL.createObjectURL(file),
        pageNumber: inferPageFromFilename(file.name, baseStart + i),
        title: file.name.replace(/\.[^.]+$/, ""),
        status: "queued",
      }));
      return [...prev, ...next];
    });
  };

  // When startPage changes and no uploads in progress, renumber sequentially from startPage
  const renumberFromStart = () => {
    setQueue((prev) =>
      prev.map((q, i) => (q.status === "done" ? q : { ...q, pageNumber: startPage + i })),
    );
  };

  const removeItem = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((q) => q.id !== id);
    });
  };

  const updateItem = (id: string, patch: Partial<QueueItem>) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const moveItem = (id: string, dir: -1 | 1) => {
    setQueue((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx < 0) return prev;
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[j]] = [copy[j], copy[idx]];
      return copy;
    });
  };

  const ensureIssue = async (): Promise<{ id: string; slug: string; number: number } | null> => {
    if (!seriesId) { toast.error("Pick a series."); return null; }
    if (issueId && issueId !== "__new__") {
      const it = issuesList?.find((i) => i.id === issueId);
      if (!it) { toast.error("Issue not found."); return null; }
      return { id: it.id, slug: it.slug, number: it.issue_number };
    }
    // create new issue
    if (!newIssueTitle.trim()) { toast.error("New issue title required."); return null; }
    if (!Number.isFinite(newIssueNumber) || newIssueNumber < 1) { toast.error("Issue number must be ≥ 1."); return null; }
    const slug = newIssueSlug || slugify(newIssueTitle);
    const { data, error } = await supabase
      .from("issues")
      .insert({
        series_id: seriesId,
        issue_number: newIssueNumber,
        title: newIssueTitle.trim(),
        slug,
        free_pages: freePages,
      })
      .select("id, issue_number, slug")
      .single();
    if (error) { toast.error(error.message); return null; }
    return { id: data.id, slug: data.slug, number: data.issue_number };
  };

  const handleUploadAll = async () => {
    if (queue.length === 0) { toast.error("Add files first."); return; }
    if (!selectedSeries) { toast.error("Pick a series."); return; }

    const issue = await ensureIssue();
    if (!issue) return;

    setIsUploading(true);
    const pending = queue.filter((q) => q.status !== "done");
    setProgress({ done: 0, total: pending.length });

    let ok = 0;
    let fail = 0;

    for (const item of pending) {
      updateItem(item.id, { status: "uploading", error: undefined });
      try {
        const ext = item.file.name.split(".").pop()?.toLowerCase() || "png";
        const padded = String(item.pageNumber).padStart(3, "0");
        const path = `${selectedSeries.slug}/issue-${issue.number}/page-${padded}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("comic-pages")
          .upload(path, item.file, { contentType: item.file.type, upsert: true });
        if (upErr) throw upErr;

        const isFree = item.pageNumber <= freePages;
        const { error: insErr } = await supabase.from("comics").insert({
          issue_id: issue.id,
          title: item.title.trim() || `Page ${item.pageNumber}`,
          slug: `${issue.slug}-p${padded}`,
          page_number: item.pageNumber,
          image_path: path,
          is_free: isFree,
          published_at: publishNow ? new Date().toISOString() : null,
        });
        if (insErr) throw insErr;

        updateItem(item.id, { status: "done" });
        ok++;
      } catch (err) {
        updateItem(item.id, { status: "error", error: (err as Error).message });
        fail++;
      } finally {
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    }

    setIsUploading(false);
    qc.invalidateQueries({ queryKey: ["admin-comics"] });
    qc.invalidateQueries({ queryKey: ["admin-issues", seriesId] });
    if (fail === 0) toast.success(`Uploaded ${ok} page${ok === 1 ? "" : "s"}.`);
    else toast.warning(`${ok} uploaded, ${fail} failed.`);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Series *</Label>
          <Select value={seriesId} onValueChange={(v) => { setSeriesId(v); setIssueId(""); }}>
            <SelectTrigger><SelectValue placeholder="Pick a series" /></SelectTrigger>
            <SelectContent>
              {seriesList?.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Issue *</Label>
          <Select value={issueId} onValueChange={setIssueId} disabled={!seriesId}>
            <SelectTrigger><SelectValue placeholder={seriesId ? "Pick an issue" : "Pick a series first"} /></SelectTrigger>
            <SelectContent>
              {issuesList?.map((i) => (
                <SelectItem key={i.id} value={i.id}>#{i.issue_number} — {i.title}</SelectItem>
              ))}
              <SelectItem value="__new__">+ New issue…</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {issueId === "__new__" && (
        <div className="grid gap-3 rounded-lg border border-dashed border-border p-4 sm:grid-cols-[1fr_2fr_2fr]">
          <div>
            <Label>Issue #</Label>
            <Input type="number" min={1} value={newIssueNumber}
              onChange={(e) => setNewIssueNumber(parseInt(e.target.value, 10) || 1)} />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={newIssueTitle} onChange={(e) => setNewIssueTitle(e.target.value)} placeholder="The Trident Wakes" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={newIssueSlug} onChange={(e) => setNewIssueSlug(slugify(e.target.value))} placeholder="the-trident-wakes" />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label>Starting page #</Label>
          <Input type="number" min={1} value={startPage}
            onChange={(e) => setStartPage(parseInt(e.target.value, 10) || 1)}
            onBlur={renumberFromStart} />
        </div>
        <div>
          <Label>Free pages</Label>
          <Input type="number" min={0} value={freePages}
            onChange={(e) => setFreePages(parseInt(e.target.value, 10) || 0)} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
          Publish immediately
        </label>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-border bg-background/40 p-8 text-center text-sm text-muted-foreground hover:border-foreground/40"
      >
        Drag &amp; drop images here, or click to choose files
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{queue.length} file{queue.length === 1 ? "" : "s"} queued</span>
            {isUploading && <span>Uploading {progress.done} / {progress.total}…</span>}
          </div>
          <ul className="space-y-2">
            {queue.map((q, idx) => (
              <li key={q.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-2">
                <img src={q.previewUrl} alt="" className="h-12 w-12 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-muted-foreground">{q.file.name}</div>
                  <div className="mt-1 grid grid-cols-[80px_1fr] gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={q.pageNumber}
                      onChange={(e) => updateItem(q.id, { pageNumber: parseInt(e.target.value, 10) || 1 })}
                      className="h-8"
                    />
                    <Input
                      value={q.title}
                      onChange={(e) => updateItem(q.id, { title: e.target.value })}
                      placeholder="Title"
                      className="h-8"
                    />
                  </div>
                  {q.error && <div className="mt-1 text-xs text-destructive">{q.error}</div>}
                </div>
                <StatusBadge status={q.status} />
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => moveItem(q.id, -1)} disabled={idx === 0}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">▲</button>
                  <button type="button" onClick={() => moveItem(q.id, 1)} disabled={idx === queue.length - 1}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">▼</button>
                </div>
                <button type="button" onClick={() => removeItem(q.id)}
                  className="text-xs text-muted-foreground hover:text-destructive">✕</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" onClick={handleUploadAll} disabled={isUploading || queue.length === 0} className="flex-1">
          {isUploading ? `Uploading ${progress.done}/${progress.total}…` : `Upload ${queue.filter((q) => q.status !== "done").length} page(s)`}
        </Button>
        <Button type="button" variant="outline" disabled={isUploading} onClick={() => {
          queue.forEach((q) => URL.revokeObjectURL(q.previewUrl));
          setQueue([]);
        }}>Clear</Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: QueueStatus }) {
  const map: Record<QueueStatus, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
    queued: { label: "Queued", variant: "outline" },
    uploading: { label: "Uploading", variant: "secondary" },
    done: { label: "Done", variant: "default" },
    error: { label: "Error", variant: "destructive" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant} className="shrink-0">{label}</Badge>;
}
