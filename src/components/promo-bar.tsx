import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { track } from "@/lib/analytics";
import { getLivePromo } from "@/lib/promos.functions";

// Dismissal is keyed per announcement. With a single shared key, a reader who
// dismissed one announcement would never see the next one either — which turns
// a scheduled announcement into a silent no-op for exactly the returning
// readers it is aimed at.
const STORAGE_PREFIX = "rwc.promo.dismissed.v2:";

// Shown when the queue is empty. Evergreen on purpose: no dates, nothing that
// can rot. Anything date-stamped belongs in the promos table with an end date.
const FALLBACK = {
  message: "BATTLEFIELD ATLANTIS #1 IS LIVE — READ THE FIRST ACT FREE",
  href: "/reader/battlefield-atlantis/1" as string | null,
  cta: "Start reading" as string | null,
};

/**
 * Thin sitewide announcement bar above the main nav.
 *
 * Content comes from the promos queue, highest-priority row whose window
 * contains now(); falls back to evergreen copy when nothing is scheduled.
 * Per-session dismissible, keyed on the promo id.
 * SSR-safe: visibility decided after mount to avoid hydration mismatch.
 */
export function PromoBar() {
  const promoFn = useServerFn(getLivePromo);
  const { data: promo } = useQuery({
    queryKey: ["live-promo"],
    queryFn: () => promoFn({}),
    staleTime: 300_000,
  });

  const content = promo
    ? { message: promo.message, href: promo.href, cta: promo.cta }
    : FALLBACK;
  const storageKey = STORAGE_PREFIX + (promo?.id ?? "fallback");

  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  // Re-runs when the promo resolves, so dismissal is re-evaluated against the
  // key that actually applies rather than the placeholder one.
  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(sessionStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (!mounted || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(storageKey, "1"); } catch { /* ignore */ }
    track("promo_bar_dismiss", { promoId: promo?.id ?? null });
  };

  const label = (
    <>
      {content.message}
      {content.cta ? (
        <span className="ml-3 hidden text-[var(--neon)] sm:inline">{content.cta} →</span>
      ) : null}
    </>
  );

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className="relative w-full"
      style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-2 pr-12 text-center">
        {content.href ? (
          <a
            href={content.href}
            onClick={() => track("promo_bar_click", { href: content.href })}
            className="text-[11px] font-black uppercase tracking-[2.5px] text-white transition-colors hover:text-[var(--neon)]"
          >
            {label}
          </a>
        ) : (
          // An announcement with nowhere to send people is still a valid
          // announcement ("pages 11-14 drop October 7"), so render it as text
          // rather than forcing a link that would go somewhere unrelated.
          <span className="text-[11px] font-black uppercase tracking-[2.5px] text-white">
            {label}
          </span>
        )}
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
