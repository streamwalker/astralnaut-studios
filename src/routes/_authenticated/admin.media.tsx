import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { pageUrl } from "@/lib/storage";
import {
  adminListCarouselSlides,
  upsertCarouselSlide,
  deleteCarouselSlide,
  adminListIssues,
  updateIssueCover,
  adminListCharacters,
  updateCharacterPortrait,
} from "@/lib/media-admin.functions";
import {
  UploadField,
  ASPECT_COVER,
  ASPECT_CAROUSEL,
  ASPECT_PORTRAIT,
} from "@/components/admin/upload-field";

export const Route = createFileRoute("/_authenticated/admin/media")({
  head: () => ({ meta: [{ title: "Media Manager — Admin" }] }),
  component: MediaManagerPage,
});

function MediaManagerPage() {
  const nav = useNavigate();

  const { data: userData } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", userData?.id],
    enabled: !!userData?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role")
        .eq("user_id", userData!.id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  if (roleLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Checking access…</div>;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-bold">Not authorized</h1>
          <Button onClick={() => nav({ to: "/" })} variant="outline" className="mt-6">Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/admin" className="text-sm font-semibold tracking-[0.18em]">← ADMIN</Link>
          <div className="text-sm font-bold">Media Manager</div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Tabs defaultValue="covers">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="covers">Book Covers</TabsTrigger>
            <TabsTrigger value="carousel">Landing Carousel</TabsTrigger>
            <TabsTrigger value="cast">Cast Portraits</TabsTrigger>
          </TabsList>
          <TabsContent value="covers" className="mt-6"><CoversPanel /></TabsContent>
          <TabsContent value="carousel" className="mt-6"><CarouselPanel /></TabsContent>
          <TabsContent value="cast" className="mt-6"><CastPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ---------- Shared image uploader ----------

async function uploadToBucket(bucket: "comic-pages" | "characters", pathPrefix: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/\.[^.]+$/, "");
  const path = `${pathPrefix}/${clean}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return `${bucket}/${path}`;
}

function ImagePreview({ path }: { path: string | null | undefined }) {
  const url = pageUrl(path);
  if (!url) return <div className="flex h-24 w-16 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted-foreground">None</div>;
  return <img src={url} alt="" className="h-24 w-16 rounded object-cover" loading="lazy" />;
}

// ---------- Covers Panel ----------

function CoversPanel() {
  const qc = useQueryClient();
  const { data: issues } = useQuery({
    queryKey: ["admin-media-issues"],
    queryFn: () => adminListIssues(),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, typeof issues>();
    (issues ?? []).forEach((i) => {
      const key = i.series?.name ?? "Unknown";
      if (!map.has(key)) map.set(key, [] as unknown as typeof issues);
      (map.get(key) as unknown as typeof issues)!.push(i);
    });
    return Array.from(map.entries());
  }, [issues]);

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Replace the cover of any issue. Uploaded images are stored in the <code>comic-pages</code> bucket.
      </p>
      {grouped.map(([series, list]) => (
        <section key={series} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-lg font-bold">{series}</h3>
          <ul className="mt-4 space-y-3">
            {list?.map((issue) => (
              <IssueCoverRow
                key={issue.id}
                issue={issue}
                onSaved={() => qc.invalidateQueries({ queryKey: ["admin-media-issues"] })}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function IssueCoverRow({
  issue,
  onSaved,
}: {
  issue: { id: string; issue_number: number; title: string; slug: string; cover_path: string | null };
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [pathOverride, setPathOverride] = useState(issue.cover_path ?? "");

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const path = await uploadToBucket("comic-pages", `${issue.slug.replace(/^.*?\//, "")}/covers`, file);
      await updateIssueCover({ data: { id: issue.id, cover_path: path } });
      setPathOverride(path);
      toast.success(`Updated cover for #${issue.issue_number} ${issue.title}`);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const handleSavePath = async () => {
    setBusy(true);
    try {
      await updateIssueCover({ data: { id: issue.id, cover_path: pathOverride.trim() } });
      toast.success("Cover path updated.");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-3">
      <ImagePreview path={pathOverride || issue.cover_path} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">#{issue.issue_number} — {issue.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Input
            value={pathOverride}
            onChange={(e) => setPathOverride(e.target.value)}
            className="h-8 min-w-[240px] flex-1 font-mono text-xs"
            placeholder="bucket/path/to/image.png"
          />
          <Button size="sm" variant="outline" onClick={handleSavePath} disabled={busy}>Save path</Button>
        </div>
      </div>
      <div>
        <Label htmlFor={`file-${issue.id}`} className="cursor-pointer">
          <span className="inline-flex items-center rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[2px]">
            {busy ? "Working…" : "Upload"}
          </span>
        </Label>
        <input
          id={`file-${issue.id}`}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }}
        />
      </div>
    </li>
  );
}

// ---------- Carousel Panel ----------

function CarouselPanel() {
  const qc = useQueryClient();
  const { data: slides } = useQuery({
    queryKey: ["admin-carousel-slides"],
    queryFn: () => adminListCarouselSlides(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-carousel-slides"] });
    qc.invalidateQueries({ queryKey: ["carousel-slides"] });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Manage the landing-page cover carousel. Slides render on the homepage in the order shown.
      </p>
      <ul className="space-y-3">
        {slides?.map((s) => (
          <SlideRow key={s.id} slide={s} onChanged={invalidate} />
        ))}
      </ul>
      <div className="rounded-2xl border border-dashed border-border p-5">
        <h4 className="text-sm font-bold uppercase tracking-[2px]">Add slide</h4>
        <NewSlideForm onCreated={invalidate} nextOrder={((slides?.length ?? 0) + 1) * 10} />
      </div>
    </div>
  );
}

function SlideRow({
  slide,
  onChanged,
}: {
  slide: { id: string; image_path: string; alt: string; sort_order: number; is_published: boolean };
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [alt, setAlt] = useState(slide.alt);
  const [order, setOrder] = useState<number>(slide.sort_order);
  const [imagePath, setImagePath] = useState(slide.image_path);
  const [published, setPublished] = useState(slide.is_published);

  const save = async () => {
    setBusy(true);
    try {
      await upsertCarouselSlide({ data: { id: slide.id, image_path: imagePath.trim(), alt, sort_order: order, is_published: published } });
      toast.success("Slide saved.");
      onChanged();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const path = await uploadToBucket("comic-pages", "carousel", file);
      setImagePath(path);
      await upsertCarouselSlide({ data: { id: slide.id, image_path: path, alt, sort_order: order, is_published: published } });
      toast.success("Slide image replaced.");
      onChanged();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirm("Delete this slide?")) return;
    setBusy(true);
    try {
      await deleteCarouselSlide({ data: { id: slide.id } });
      toast.success("Slide deleted.");
      onChanged();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <li className="flex flex-wrap items-start gap-4 rounded-lg border border-border p-3">
      <ImagePreview path={imagePath} />
      <div className="min-w-0 flex-1 space-y-2">
        <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Alt text" className="h-8 text-xs" />
        <Input value={imagePath} onChange={(e) => setImagePath(e.target.value)} placeholder="bucket/path.png or /__l5e/..." className="h-8 font-mono text-xs" />
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-1">
            Order
            <Input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} className="h-7 w-20" />
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published
          </label>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button size="sm" onClick={save} disabled={busy}>Save</Button>
        <Label htmlFor={`slide-file-${slide.id}`} className="cursor-pointer">
          <span className="inline-flex items-center rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[2px]">Upload</span>
        </Label>
        <input id={`slide-file-${slide.id}`} type="file" accept="image/*" className="sr-only" disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }} />
        <Button size="sm" variant="destructive" onClick={remove} disabled={busy}>Delete</Button>
      </div>
    </li>
  );
}

function NewSlideForm({ onCreated, nextOrder }: { onCreated: () => void; nextOrder: number }) {
  const [alt, setAlt] = useState("");
  const [order, setOrder] = useState(nextOrder);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const path = await uploadToBucket("comic-pages", "carousel", file);
      await upsertCarouselSlide({ data: { image_path: path, alt: alt || file.name, sort_order: order, is_published: true } });
      toast.success("Slide added.");
      setAlt("");
      onCreated();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Alt text" className="h-8 min-w-[220px] flex-1 text-xs" />
      <label className="flex items-center gap-1 text-xs">
        Order
        <Input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} className="h-8 w-20" />
      </label>
      <Label htmlFor="new-slide-file" className="cursor-pointer">
        <span className="inline-flex items-center rounded-md border border-border bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-primary-foreground">
          {busy ? "Uploading…" : "Upload image"}
        </span>
      </Label>
      <input id="new-slide-file" type="file" accept="image/*" className="sr-only" disabled={busy}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }} />
    </div>
  );
}

// ---------- Cast Panel ----------

function CastPanel() {
  const qc = useQueryClient();
  const { data: characters } = useQuery({
    queryKey: ["admin-media-characters"],
    queryFn: () => adminListCharacters(),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, typeof characters>();
    (characters ?? []).forEach((c) => {
      const key = c.series?.name ?? "Unassigned";
      if (!map.has(key)) map.set(key, [] as unknown as typeof characters);
      (map.get(key) as unknown as typeof characters)!.push(c);
    });
    return Array.from(map.entries());
  }, [characters]);

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Replace character portraits. Uploaded images are stored in the <code>characters</code> bucket.
      </p>
      {grouped.map(([series, list]) => (
        <section key={series} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-lg font-bold">{series}</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {list?.map((c) => (
              <CharacterRow key={c.id} character={c} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-media-characters"] })} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function CharacterRow({
  character,
  onSaved,
}: {
  character: { id: string; name: string; role: string | null; portrait_path: string | null };
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [portrait, setPortrait] = useState(character.portrait_path ?? "");

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const path = await uploadToBucket("characters", "portraits", file);
      await updateCharacterPortrait({ data: { id: character.id, portrait_path: path } });
      setPortrait(path);
      toast.success(`Updated portrait for ${character.name}`);
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const savePath = async () => {
    setBusy(true);
    try {
      await updateCharacterPortrait({ data: { id: character.id, portrait_path: portrait.trim() } });
      toast.success("Portrait path saved.");
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border p-3">
      <ImagePreview path={portrait || character.portrait_path} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{character.name}</div>
        <div className="text-xs text-muted-foreground">{character.role}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Input value={portrait} onChange={(e) => setPortrait(e.target.value)} className="h-7 min-w-[180px] flex-1 font-mono text-xs" placeholder="bucket/path.png" />
          <Button size="sm" variant="outline" onClick={savePath} disabled={busy}>Save</Button>
          <Label htmlFor={`char-file-${character.id}`} className="cursor-pointer">
            <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-1 text-[11px] font-bold uppercase tracking-[2px]">Upload</span>
          </Label>
          <input id={`char-file-${character.id}`} type="file" accept="image/*" className="sr-only" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }} />
        </div>
      </div>
    </li>
  );
}
