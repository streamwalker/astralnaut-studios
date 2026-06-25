import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "hero:autoplayMs";
const DEFAULT_SECONDS = 15;
const MIN_SECONDS = 3;
const MAX_SECONDS = 120;

function readSeconds(): number {
  if (typeof window === "undefined") return DEFAULT_SECONDS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_SECONDS;
  return Math.round(n / 1000);
}

export function HeroSettingsCard() {
  const [seconds, setSeconds] = useState<number>(DEFAULT_SECONDS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSeconds(readSeconds());
  }, []);

  const clamp = (n: number) => Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(n)));

  const save = () => {
    const v = clamp(seconds);
    setSeconds(v);
    window.localStorage.setItem(STORAGE_KEY, String(v * 1000));
    // Notify same-tab listeners (storage event only fires cross-tab).
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: String(v * 1000) }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const reset = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: null }));
    setSeconds(DEFAULT_SECONDS);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-bold">Landing carousel</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Control how long each landing-page hero slide stays on screen before advancing. Default is {DEFAULT_SECONDS} seconds.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[2px] text-muted-foreground">
          Slide duration (seconds)
          <input
            type="number"
            min={MIN_SECONDS}
            max={MAX_SECONDS}
            step={1}
            value={seconds}
            onChange={(e) => setSeconds(Number(e.target.value))}
            onBlur={() => setSeconds((v) => clamp(v))}
            className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm font-normal tracking-normal text-foreground"
          />
        </label>
        <Button onClick={save} size="sm">Save</Button>
        <Button onClick={reset} variant="outline" size="sm">Reset to {DEFAULT_SECONDS}s</Button>
        {saved && <span className="text-xs text-[var(--neon)]">Saved</span>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Stored per-browser. Visitors also get pause-on-hover and a manual play/pause toggle on the carousel.
      </p>
    </section>
  );
}
