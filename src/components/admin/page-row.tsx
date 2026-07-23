import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreVertical, ArrowUp, ArrowDown, Image as ImageIcon, Pencil, Trash2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Smartphone, Tablet, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type PageRowData = {
  id: string;
  title: string;
  slug: string;
  page_number: number;
  image_path: string;
  published_at: string | null;
  is_free?: boolean | null;
  alt_text?: string | null;
  issue_id?: string | null;
};

type Props = {
  page: PageRowData;
  neighbors?: { up?: PageRowData; down?: PageRowData };
  siblings?: PageRowData[];
  initialIndex?: number;
  invalidateKeys: Array<readonly unknown[]>;
};

const publicUrl = (path: string) =>
  supabase.storage.from("comic-pages").getPublicUrl(path).data.publicUrl;

export function PageRow({ page, neighbors, siblings, initialIndex = 0, invalidateKeys }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);

  const hasSiblings = siblings && siblings.length > 1;
  const previewPage = hasSiblings && previewIndex >= 0 && previewIndex < siblings!.length
    ? siblings![previewIndex]
    : page;

  useEffect(() => {
    if (!previewOpen) return;
    setPreviewIndex(initialIndex);
    setZoom(1);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setPreviewIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setPreviewIndex((i) => Math.min((siblings?.length ?? 1) - 1, i + 1));
      if (e.key === "Escape") setPreviewOpen(false);
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(4, z + 0.25));
      if (e.key === "-" || e.key === "_") setZoom((z) => Math.max(0.25, z - 0.25));
      if (e.key === "0") setZoom(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen, initialIndex, siblings?.length]);

  const invalidate = () => {
    for (const k of invalidateKeys) qc.invalidateQueries({ queryKey: k as unknown[] });
  };


  // ----- Replace image -----
  const onReplace = async (file: File) => {
    setBusy(true);
    try {
      const oldPath = page.image_path;
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      // Append a version segment so we never collide with the old object.
      const base = oldPath.replace(/\.[^./]+$/, "");
      const newPath = `${base}.v${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("comic-pages")
        .upload(newPath, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase
        .from("comics")
        .update({ image_path: newPath })
        .eq("id", page.id);
      if (dbErr) {
        await supabase.storage.from("comic-pages").remove([newPath]);
        throw dbErr;
      }

      if (oldPath && oldPath !== newPath) {
        await supabase.storage.from("comic-pages").remove([oldPath]);
      }
      toast.success("Image replaced.");
      invalidate();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // ----- Delete -----
  const onDelete = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from("comics").delete().eq("id", page.id);
      if (error) throw error;
      if (page.image_path) {
        await supabase.storage.from("comic-pages").remove([page.image_path]);
      }
      toast.success("Page deleted.");
      invalidate();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      setDeleteOpen(false);
    }
  };

  // ----- Reorder (swap page_number with neighbor) -----
  const swapWith = async (other: PageRowData) => {
    setBusy(true);
    try {
      // 3-step swap in case a unique constraint exists on (issue_id, page_number).
      const tmp = -Math.abs(page.page_number) - Date.now() % 100000;
      let { error } = await supabase
        .from("comics")
        .update({ page_number: tmp })
        .eq("id", page.id);
      if (error) throw error;
      ({ error } = await supabase
        .from("comics")
        .update({ page_number: page.page_number })
        .eq("id", other.id));
      if (error) throw error;
      ({ error } = await supabase
        .from("comics")
        .update({ page_number: other.page_number })
        .eq("id", page.id));
      if (error) throw error;
      invalidate();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="group relative h-14 w-14 shrink-0 overflow-hidden rounded ring-offset-background transition hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Preview ${page.title}`}
      >
        <img
          src={publicUrl(page.image_path)}
          alt={page.alt_text ?? ""}
          className="h-14 w-14 object-cover transition group-hover:scale-105"
        />
      </button>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="truncate text-sm font-semibold hover:underline">{page.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {page.slug} · page {page.page_number} ·{" "}
          {page.published_at ? "published" : "draft"}
          {page.is_free ? " · free" : ""}
        </div>
      </button>


      {neighbors && (
        <div className="flex flex-col">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={busy || !neighbors.up}
            onClick={() => neighbors.up && swapWith(neighbors.up)}
            aria-label="Move up"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={busy || !neighbors.down}
            onClick={() => neighbors.down && swapWith(neighbors.down)}
            aria-label="Move down"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" disabled={busy}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
            <ImageIcon className="mr-2 h-4 w-4" /> Replace image
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onReplace(f);
          e.target.value = "";
        }}
      />

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        page={page}
        onSaved={invalidate}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this page?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes “{page.title}” (page {page.page_number}) and its image file.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="!max-w-[100vw] h-[100vh] w-screen gap-0 border-0 bg-black/95 p-0 sm:rounded-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="absolute left-0 right-0 top-0 z-10 flex-row items-center justify-between gap-3 border-b border-white/10 bg-black/60 px-4 py-2 backdrop-blur">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {hasSiblings && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={previewIndex === 0}
                    onClick={() => setPreviewIndex((i) => i - 1)}
                    className="h-8 w-8 shrink-0 text-white hover:bg-white/10 hover:text-white disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={previewIndex === (siblings?.length ?? 1) - 1}
                    onClick={() => setPreviewIndex((i) => i + 1)}
                    className="h-8 w-8 shrink-0 text-white hover:bg-white/10 hover:text-white disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
              <DialogTitle className="truncate text-sm font-semibold text-white">
                {previewPage.title}
                <span className="ml-2 text-xs font-normal text-white/60">
                  page {previewPage.page_number} · {previewPage.published_at ? "published" : "draft"}
                  {previewPage.is_free ? " · free" : ""}
                </span>
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasSiblings && (
                <span className="hidden text-xs text-white/60 sm:inline">
                  {previewIndex + 1} / {siblings?.length}
                </span>
              )}
              <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                  className="h-7 w-7 text-white hover:bg-white/10 hover:text-white disabled:opacity-30"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[3ch] text-center text-xs font-medium text-white/90">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                  className="h-7 w-7 text-white hover:bg-white/10 hover:text-white disabled:opacity-30"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setZoom(1)}
                className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
                aria-label="Reset zoom"
                title="Reset zoom (0)"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPreviewOpen(false)}
                className="h-8 border border-white/10 bg-white/10 px-2.5 text-xs font-medium text-white hover:bg-white/20 hover:text-white"
                aria-label="Close preview"
                title="Close (Esc)"
              >
                Esc
              </Button>
            </div>
          </DialogHeader>
          <div className="flex h-full w-full items-center justify-center overflow-auto p-4 pt-14">
            <img
              src={publicUrl(previewPage.image_path)}
              alt={previewPage.alt_text ?? previewPage.title}
              className="object-contain transition-all duration-200"
              style={{
                width: zoom === 1 ? "auto" : `${zoom * 100}%`,
                height: zoom === 1 ? "auto" : `${zoom * 100}%`,
                maxWidth: zoom === 1 ? "100%" : "none",
                maxHeight: zoom === 1 ? "100%" : "none",
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </li>
  );
}


function EditDialog({
  open,
  onOpenChange,
  page,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  page: PageRowData;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(page.title);
  const [pageNumber, setPageNumber] = useState(page.page_number);
  const [altText, setAltText] = useState(page.alt_text ?? "");
  const [isFree, setIsFree] = useState(!!page.is_free);
  const [published, setPublished] = useState(!!page.published_at);
  const [saving, setSaving] = useState(false);

  // Reset state when opened on a new page
  const onOpen = (v: boolean) => {
    if (v) {
      setTitle(page.title);
      setPageNumber(page.page_number);
      setAltText(page.alt_text ?? "");
      setIsFree(!!page.is_free);
      setPublished(!!page.published_at);
    }
    onOpenChange(v);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("comics")
        .update({
          title: title.trim() || `Page ${pageNumber}`,
          page_number: pageNumber,
          alt_text: altText.trim() || null,
          is_free: isFree,
          published_at: published
            ? page.published_at ?? new Date().toISOString()
            : null,
        })
        .eq("id", page.id);
      if (error) throw error;
      toast.success("Page updated.");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit page</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-page">Page number</Label>
            <Input
              id="edit-page"
              type="number"
              min={1}
              value={pageNumber}
              onChange={(e) => setPageNumber(Math.max(1, parseInt(e.target.value || "1", 10)))}
            />
          </div>
          <div>
            <Label htmlFor="edit-alt">Alt text</Label>
            <Input id="edit-alt" value={altText} onChange={(e) => setAltText(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <Label>Free preview</Label>
              <p className="text-xs text-muted-foreground">Visible to everyone.</p>
            </div>
            <Switch checked={isFree} onCheckedChange={setIsFree} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <Label>Published</Label>
              <p className="text-xs text-muted-foreground">
                Drafts are hidden from the public site.
              </p>
            </div>
            <Switch checked={published} onCheckedChange={setPublished} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
