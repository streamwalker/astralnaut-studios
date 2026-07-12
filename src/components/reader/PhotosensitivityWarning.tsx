import { useEffect, useState } from "react";
import { useMotionPref } from "@/hooks/useMotionPref";

/**
 * One-time interstitial shown before a flagged issue renders. The user must
 * explicitly acknowledge before the reader mounts. The ack is session-scoped
 * per issueId so the warning re-appears on later visits.
 */
export function PhotosensitivityWarning({
  issueId,
  hasFlashing,
  children,
}: {
  issueId: string;
  hasFlashing: boolean;
  children: React.ReactNode;
}) {
  const [acked, setAcked] = useState(!hasFlashing);
  const [motionPref, setMotionPref] = useMotionPref();

  useEffect(() => {
    if (!hasFlashing) return;
    try {
      const key = `rwc-photosens-ack-${issueId}`;
      if (sessionStorage.getItem(key) === "1") setAcked(true);
    } catch { /* ignore */ }
  }, [hasFlashing, issueId]);

  if (acked) return <>{children}</>;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="photosens-title" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4">
      <div className="max-w-lg rounded-lg border border-[var(--border-line)] bg-[var(--bg-deep,#0a0a0a)] p-6">
        <h2 id="photosens-title" className="text-lg font-semibold">Photosensitivity warning</h2>
        <p className="mt-3 text-sm">
          This issue contains scenes with flashing or high-contrast strobing effects that may affect people with photosensitive epilepsy. You can continue as-is, or turn off non-essential motion effects (recommended).
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={motionPref === "off"}
            onChange={(e) => setMotionPref(e.target.checked ? "off" : "auto")}
          />
          <span>Reduce motion and disable non-essential animation in the reader</span>
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              try { sessionStorage.setItem(`rwc-photosens-ack-${issueId}`, "1"); } catch { /* ignore */ }
              setAcked(true);
            }}
            className="rounded bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black"
          >
            I understand, continue
          </button>
        </div>
      </div>
    </div>
  );
}
