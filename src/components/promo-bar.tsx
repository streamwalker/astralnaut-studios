import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "rwc.promo.dismissed.v1";

interface PromoBarProps {
  text?: string;
  href?: string;
  cta?: string;
}

/**
 * Thin sitewide announcement bar above the main nav.
 * Per-session dismissible. SSR-safe: visibility decided after mount to avoid hydration mismatch.
 */
export function PromoBar({
  text = "BATTLEFIELD ATLANTIS #1 IS LIVE — READ THE FIRST ACT FREE",
  href = "/reader/battlefield-atlantis/1",
  cta = "Start reading",
}: PromoBarProps) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!mounted || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    track("promo_bar_dismiss", {});
  };

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className="relative w-full"
      style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-2 pr-12 text-center">
        <a
          href={href}
          onClick={() => track("promo_bar_click", { href })}
          className="text-[11px] font-black uppercase tracking-[2.5px] text-white transition-colors hover:text-[var(--neon)]"
        >
          {text}
          <span className="ml-3 hidden text-[var(--neon)] sm:inline">{cta} →</span>
        </a>
      </div>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/60 hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 6L18 18M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
