import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  readConsent,
  writeConsent,
  isGpcOptOut,
  OPEN_PREFS_EVENT,
  type CookieConsentState,
} from "@/lib/cookies-client";

type Mode = "hidden" | "banner" | "customize";

type CategoryToggles = {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

// Legacy export names kept so existing imports (`CookieConsent`,
// `hasAnalyticsConsent`) don't break.
export function hasAnalyticsConsent(): boolean {
  return readConsent()?.analytics === true;
}

export function CookieConsent() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [toggles, setToggles] = useState<CategoryToggles>({
    functional: false,
    analytics: false,
    marketing: false,
  });
  const [gpcNoticed, setGpcNoticed] = useState(false);

  const initFromExisting = useCallback((existing: CookieConsentState | null) => {
    if (existing) {
      setToggles({
        functional: existing.functional,
        analytics: existing.analytics,
        marketing: existing.marketing,
      });
    }
  }, []);

  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      initFromExisting(existing);
      return;
    }
    if (isGpcOptOut()) {
      // Honor GPC: record a rejection derived from GPC and do not show banner.
      writeConsent({
        functional: false,
        analytics: false,
        marketing: false,
        source: "gpc",
        gpcDerived: true,
      });
      setGpcNoticed(true);
      return;
    }
    setMode("banner");
  }, [initFromExisting]);

  useEffect(() => {
    function onOpen() {
      const existing = readConsent();
      initFromExisting(existing);
      setMode("customize");
    }
    window.addEventListener(OPEN_PREFS_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(OPEN_PREFS_EVENT, onOpen as EventListener);
  }, [initFromExisting]);

  function acceptAll() {
    writeConsent({
      functional: true,
      analytics: true,
      marketing: true,
      source: "banner_accept_all",
      gpcDerived: false,
    });
    setMode("hidden");
  }
  function rejectAll() {
    writeConsent({
      functional: false,
      analytics: false,
      marketing: false,
      source: "banner_reject_all",
      gpcDerived: false,
    });
    setMode("hidden");
  }
  function saveCustomize() {
    // If GPC is on, force analytics + marketing off regardless of the UI state.
    const gpc = isGpcOptOut();
    writeConsent({
      functional: toggles.functional,
      analytics: gpc ? false : toggles.analytics,
      marketing: gpc ? false : toggles.marketing,
      source: readConsent() ? "customize" : "customize",
      gpcDerived: gpc,
    });
    setMode("hidden");
  }
  function withdrawAll() {
    writeConsent({
      functional: false,
      analytics: false,
      marketing: false,
      source: "withdraw",
      gpcDerived: isGpcOptOut(),
    });
    setToggles({ functional: false, analytics: false, marketing: false });
    setMode("hidden");
  }

  // GPC-only notice is optional; we don't render anything.
  if (mode === "hidden") {
    void gpcNoticed;
    return null;
  }

  const gpc = isGpcOptOut();

  return (
    <div
      role="dialog"
      aria-modal={mode === "customize" ? true : undefined}
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--border-line)] bg-[var(--bg-deep,#0a0a0a)]/95 text-[var(--ink,#fff)] backdrop-blur"
    >
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <h2 id="cookie-consent-title" className="text-sm font-semibold uppercase tracking-wider">
              Your privacy choices
            </h2>
            <p className="mt-1 text-sm leading-relaxed">
              We use necessary cookies to run the site. Functional, analytics, and marketing cookies are optional and stay off until you turn them on. See our{" "}
              <Link to="/cookies" className="underline">Cookie Policy</Link>{" "}and{" "}
              <Link to="/privacy" className="underline">Privacy Policy</Link>.
            </p>
            {gpc ? (
              <p className="mt-2 text-xs text-[var(--mute)]">
                Your browser sent a Global Privacy Control signal. Analytics and marketing are already opted out for you.
              </p>
            ) : null}
          </div>
          {mode === "banner" ? (
            <div className="flex shrink-0 flex-wrap gap-2 md:flex-nowrap">
              <ChoiceButton onClick={rejectAll} aria-label="Reject all optional cookies">Reject All</ChoiceButton>
              <ChoiceButton onClick={() => setMode("customize")} aria-label="Customize cookie categories">Customize</ChoiceButton>
              <ChoiceButton onClick={acceptAll} aria-label="Accept all cookies">Accept All</ChoiceButton>
            </div>
          ) : null}
        </div>

        {mode === "customize" ? (
          <div className="mt-4 border-t border-[var(--border-line)] pt-4">
            <fieldset className="grid gap-3 md:grid-cols-2">
              <CategoryToggle
                title="Necessary"
                description="Required for sign-in, security, cart, checkout, and remembering your consent choice. Cannot be disabled here."
                checked
                disabled
              />
              <CategoryToggle
                title="Functional"
                description="Remembers non-essential preferences such as language and whether you disabled non-essential animations."
                checked={toggles.functional}
                onChange={(v) => setToggles((t) => ({ ...t, functional: v }))}
              />
              <CategoryToggle
                title="Analytics"
                description="First-party aggregate usage measurement so we can see what pages are used and where the site is slow. Loads only if you consent."
                checked={gpc ? false : toggles.analytics}
                disabled={gpc}
                onChange={(v) => setToggles((t) => ({ ...t, analytics: v }))}
              />
              <CategoryToggle
                title="Marketing"
                description="Advertising or cross-site tracking. None are currently deployed; this control governs any future addition."
                checked={gpc ? false : toggles.marketing}
                disabled={gpc}
                onChange={(v) => setToggles((t) => ({ ...t, marketing: v }))}
              />
            </fieldset>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ChoiceButton onClick={saveCustomize} aria-label="Save cookie preferences">Save preferences</ChoiceButton>
              {readConsent() ? (
                <button
                  type="button"
                  onClick={withdrawAll}
                  className="rounded border border-[var(--border-line)] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink)] hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--neon)]"
                >
                  Withdraw all optional
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setMode("banner")}
                className="ml-auto text-xs text-[var(--mute)] hover:text-[var(--neon)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--neon)]"
              >
                Back
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ChoiceButton({
  onClick,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  // All three top-level choices share the same visual weight — no dark pattern.
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 min-w-[7.5rem] rounded border border-[var(--border-line)] bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink)] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--neon)]"
      {...rest}
    >
      {children}
    </button>
  );
}

function CategoryToggle({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded border border-[var(--border-line)] bg-black/30 p-3 ${disabled ? "opacity-70" : "hover:bg-black/40"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1"
        aria-describedby={`${title.toLowerCase()}-desc`}
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span id={`${title.toLowerCase()}-desc`} className="mt-1 block text-xs text-[var(--mute)]">
          {description}
        </span>
      </span>
    </label>
  );
}
