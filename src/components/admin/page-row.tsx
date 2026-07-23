import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreVertical, ArrowUp, ArrowDown, Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
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
  invalidateKeys: Array<readonly unknown[]>;
};

const publicUrl = (path: string) =>
  supabase.storage.from("comic-pages").getPublicUrl(path).data.publicUrl;

export function PageRow({ page, neighbors, invalidateKeys }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);

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
      <img
        src={publicUrl(page.image_path)}
        alt={page.alt_text ?? ""}
        className="h-14 w-14 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{page.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {page.slug} · page {page.page_number} ·{" "}
          {page.published_at ? "published" : "draft"}
          {page.is_free ? " · free" : ""}
        </div>
      </div>

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
