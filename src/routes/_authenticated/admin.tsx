import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import logo from "@/assets/astralnaut-logo.png";

export const Route = createFileRoute("/_authenticated/admin")({
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

function AdminPage() {
  const nav = useNavigate();
  const qc = useQueryClient();

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

  const { data: comics, refetch } = useQuery({
    queryKey: ["admin-comics"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comics")
        .select("id, title, slug, page_number, image_path, published_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [altText, setAltText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [publishNow, setPublishNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Auto-slug from title
  const autoSlug = useMemo(() => slugify(title), [title]);
  useEffect(() => {
    if (!slug || slug === autoSlug) setSlug(autoSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSlug]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

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
      (document.getElementById("file-input") as HTMLInputElement | null)?.value && ((document.getElementById("file-input") as HTMLInputElement).value = "");
      qc.invalidateQueries({ queryKey: ["admin-comics"] });
      refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const publicUrl = (path: string) =>
    supabase.storage.from("comic-pages").getPublicUrl(path).data.publicUrl;

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
            <span className="text-muted-foreground">{userData?.email}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm">Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1fr_1.1fr]">
        {/* Upload form */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Upload comic page</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Give each page a title and number. Pages with a publish date appear on the public site.
          </p>

          <form onSubmit={handleUpload} className="mt-6 space-y-4">
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
        </section>

        {/* Recent uploads */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Recent uploads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {comics?.length ?? 0} page{(comics?.length ?? 0) === 1 ? "" : "s"} in the library.
          </p>
          <ul className="mt-6 space-y-3">
            {comics?.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
                <img src={publicUrl(c.image_path)} alt="" className="h-14 w-14 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{c.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {c.slug} · page {c.page_number} ·{" "}
                    {c.published_at ? "published" : "draft"}
                  </div>
                </div>
              </li>
            ))}
            {comics?.length === 0 && (
              <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No pages yet. Upload your first on the left.
              </li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
