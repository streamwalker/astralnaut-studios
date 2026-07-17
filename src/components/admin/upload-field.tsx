import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";

export type AspectTarget = {
  label: string;
  /** width / height */
  ratio: number;
  /** allowed relative deviation, e.g. 0.1 = ±10% */
  tolerance?: number;
};

type Props = {
  id: string;
  target: AspectTarget;
  busy?: boolean;
  buttonLabel?: string;
  variant?: "secondary" | "primary";
  onUpload: (file: File) => Promise<void> | void;
};

/**
 * File picker with an instant local preview and an aspect-ratio warning
 * shown before the upload begins. The upload is not blocked — the user
 * can proceed even when the ratio is off.
 */
export function UploadField({
  id,
  target,
  busy,
  buttonLabel = "Upload",
  variant = "secondary",
  onUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); setDims(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const tol = target.tolerance ?? 0.1;
  const actual = dims ? dims.w / dims.h : null;
  const deviation = actual != null ? Math.abs(actual - target.ratio) / target.ratio : 0;
  const ratioOk = actual == null || deviation <= tol;

  const btnClass =
    variant === "primary"
      ? "inline-flex items-center rounded-md border border-border bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-primary-foreground"
      : "inline-flex items-center rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[2px]";

  const confirm = async () => {
    if (!file) return;
    try {
      await onUpload(file);
    } finally {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const cancel = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="cursor-pointer">
        <span className={btnClass}>{busy ? "Working…" : buttonLabel}</span>
      </Label>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setFile(f);
        }}
      />
      {file && previewUrl && (
        <div className="rounded-md border border-border bg-background/60 p-2">
          <div className="flex items-start gap-2">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-24 w-16 rounded object-cover"
            />
            <div className="min-w-0 flex-1 text-[11px] leading-tight">
              <div className="font-mono truncate">{file.name}</div>
              <div className="text-muted-foreground">
                {dims ? `${dims.w}×${dims.h}` : "Reading…"}
                {actual != null && (
                  <> · ratio {actual.toFixed(2)} <span className="opacity-60">(target {target.label} ≈ {target.ratio.toFixed(2)})</span></>
                )}
              </div>
              {actual != null && !ratioOk && (
                <div className="mt-1 rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-1 text-amber-600 dark:text-amber-300">
                  ⚠ Off target by {(deviation * 100).toFixed(0)}%. Image may crop or letterbox.
                </div>
              )}
              {actual != null && ratioOk && (
                <div className="mt-1 text-emerald-600 dark:text-emerald-400">✓ Ratio looks good.</div>
              )}
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-[1.5px] text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Confirm upload"}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="rounded-md border border-border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[1.5px] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const ASPECT_COVER: AspectTarget = { label: "2:3", ratio: 2 / 3 };
export const ASPECT_CAROUSEL: AspectTarget = { label: "16:9", ratio: 16 / 9 };
export const ASPECT_PORTRAIT: AspectTarget = { label: "3:4", ratio: 3 / 4 };
