import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "rwc-cookie-consent-v1";

type Consent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Consent;
  } catch {
    return null;
  }
}

function writeConsent(c: Consent) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
    window.dispatchEvent(new CustomEvent("rwc:consent", { detail: c }));
  } catch {
    /* ignore */
  }
}

function gpcOptedOut(): boolean {
  if (typeof navigator === "undefined") return false;
  // Sec-GPC / Global Privacy Control: treat as opt-out of analytics + marketing.
  return (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (existing) return;
    if (gpcOptedOut()) {
      // Honor GPC silently: deny non-essential without showing the banner.
      writeConsent({ essential: true, analytics: false, marketing: false, ts: Date.now() });
      return;
    }
    setVisible(true);
  }, []);

  function accept(all: boolean) {
    writeConsent({
      essential: true,
      analytics: all,
      marketing: all,
      ts: Date.now(),
    });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--border-line)] bg-[var(--bg-deep,#0a0a0a)]/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 text-sm text-[var(--ink,#fff)] md:flex-row md:items-center md:justify-between">
        <p className="leading-relaxed">
          We use essential cookies to run the site. Optional cookies help us understand usage so we can improve it. You can change this anytime in our{" "}
          <Link to="/cookies" className="underline">Cookie Policy</Link>.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            onClick={() => accept(false)}
            className="rounded border border-[var(--border-line)] px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/5"
          >
            Essential only
          </button>
          <button
            onClick={() => accept(true)}
            className="rounded bg-[var(--neon,#22d3ee)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

export function hasAnalyticsConsent(): boolean {
  const c = readConsent();
  return !!c?.analytics;
}
