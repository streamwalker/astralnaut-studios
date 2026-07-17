import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { pageUrl } from "@/lib/storage";
import { listMediaVersions, restoreMediaVersion } from "@/lib/media-admin.functions";

type AssetType = "issue_cover" | "carousel_slide" | "character_portrait";

export function HistoryButton({
  assetType,
  assetId,
  label = "History",
  invalidateKeys = [],
}: {
  assetType: AssetType;
  assetId: string;
  label?: string;
  invalidateKeys?: readonly string[][];
}) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: versions, isLoading, refetch } = useQuery({
    queryKey: ["media-versions", assetType, assetId],
    enabled: open,
    queryFn: () => listMediaVersions({ data: { asset_type: assetType, asset_id: assetId } }),
  });

  const handleRestore = async (versionId: string) => {
    setBusyId(versionId);
    try {
      await restoreMediaVersion({ data: { version_id: versionId } });
      toast.success("Restored previous version.");
      await refetch();
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">{label}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Version history</DialogTitle>
          <DialogDescription>
            Previous images for this asset. Restoring will replace the current image and add a new history entry.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !versions || versions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No previous versions yet.</div>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {versions.map((v) => {
              const url = pageUrl(v.image_path);
              const canRestore = !!v.image_path;
              return (
                <li key={v.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                  {url ? (
                    <img src={url} alt="" className="h-16 w-12 rounded object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-16 w-12 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted-foreground">
                      Empty
                    </div>
                  )}
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                    {v.note && <div className="text-[10px] uppercase tracking-wide text-muted-foreground/80">{v.note}</div>}
                    <div className="mt-1 truncate font-mono text-[10px]">{v.image_path ?? "—"}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!canRestore || busyId === v.id}
                    onClick={() => handleRestore(v.id)}
                  >
                    {busyId === v.id ? "Restoring…" : "Restore"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
