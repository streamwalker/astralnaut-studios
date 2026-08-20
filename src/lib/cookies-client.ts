// Cookie-consent client helpers.
//
// Consent state model:
//   necessary   — always true, non-toggleable
//   functional  — opt-in
//   analytics   — opt-in
//   marketing   — opt-in
//
// State is persisted to `rwc-cookie-consent-v1` in localStorage and is
// mirrored to Supabase via the recordCookieConsent server fn (best effort;
// never blocks the UI). GPC (navigator.globalPrivacyControl) forces
// marketing (and analytics — treated as sale/share equivalent under state
// law) to false on first visit.

import type { CookieCategory } from "@/config/cookies";
import { LEGAL_CONFIG } from "@/config/legal";

export type ConsentSource =
  | "banner_accept_all"
  | "banner_reject_all"
  | "customize"
  | "withdraw"
  | "gpc"
  | "initial";

export type CookieConsentState = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  source: ConsentSource;
  gpcDerived: boolean;
  policyVersion: string;
  ts: number;
};

export const CONSENT_KEY = "rwc-cookie-consent-v1";
export const CONSENT_CHANGED_EVENT = "rwc:cookie-consent-change";
export const OPEN_PREFS_EVENT = "rwc:open-cookie-preferences";
const SESSION_ID_KEY = "rwc-cookie-session-id";

export function getConsentPolicyVersion(): string {
  return LEGAL_CONFIG.documents.cookies.version;
}

export function readConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentState;
    // If the policy version bumped, force re-consent.
    if (parsed.policyVersion !== getConsentPolicyVersion()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasConsent(category: CookieCategory): boolean {
  if (category === "necessary") return true;
  const s = readConsent();
  if (!s) return false;
  return s[category] === true;
}

export function isGpcOptOut(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

function getOrCreateSessionId(): string {
  if (typeof sessionStorage === "undefined") return "no-session";
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return "no-session";
  }
}

export function writeConsent(next: Omit<CookieConsentState, "necessary" | "policyVersion" | "ts"> & { policyVersion?: string; ts?: number }) {
  const state: CookieConsentState = {
    necessary: true,
    functional: next.functional,
    analytics: next.analytics,
    marketing: next.marketing,
    source: next.source,
    gpcDerived: next.gpcDerived,
    policyVersion: next.policyVersion ?? getConsentPolicyVersion(),
    ts: next.ts ?? Date.now(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }

  // Withdrawal: best-effort removal of category cookies we control.
  cleanupCookiesForWithdrawnCategories(state);

  // Broadcast to any live loadIfConsented listeners.
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: state }));
  } catch {
    /* ignore */
  }

  // Fire-and-forget server record. Import at call time to avoid pulling
  // server-fn RPC module into first paint.
  void (async () => {
    try {
      const { recordCookieConsentClient } = await import("./cookies-record");
      await recordCookieConsentClient(state, getOrCreateSessionId());
    } catch {
      /* swallow — logging must never break UX */
    }
  })();

  return state;
}

/**
 * Registers a callback that runs the first time the given category is
 * consented to (and again after any withdrawal-then-re-consent). If the
 * category is already consented, runs immediately. Returns an unsubscribe
 * function.
 *
 * Use this to gate the actual load of any analytics / marketing SDK — the
 * SDK must not be imported until the consent gate fires.
 */
export function loadIfConsented(
  category: Exclude<CookieCategory, "necessary">,
  load: () => void | Promise<void>,
): () => void {
  if (typeof window === "undefined") return () => {};

  let loaded = false;
  const maybeRun = () => {
    if (loaded) return;
    if (!hasConsent(category)) return;
    loaded = true;
    try {
      void load();
    } catch {
      /* swallow */
    }
  };

  maybeRun();
  const onChange = () => {
    // Re-arm on withdrawal. Without this the `loaded` latch is permanent and
    // the "again after any withdrawal-then-re-consent" half of the contract
    // above never happens — an SDK revoked on withdrawal would stay revoked
    // for the rest of the page's life even after the visitor opted back in.
    if (!hasConsent(category)) {
      loaded = false;
      return;
    }
    maybeRun();
  };
  window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
}

/**
 * Opens the cookie preferences dialog from anywhere in the app. The manager
 * component listens for this event.
 */
export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(OPEN_PREFS_EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * Expire one cookie across every domain scope it could plausibly have been set
 * on. A cookie is only overwritten when the domain and path of the deletion
 * match the ones used to set it, and third-party SDKs choose those themselves —
 * Meta's `_fbp`, for instance, is written to the registrable domain
 * (`.astralnautstudios.com`), which a bare host-only delete from `www.` will
 * not touch. Extra attempts against scopes that were never used are inert.
 */
function deleteCookieEverywhere(name: string) {
  const expired = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  document.cookie = expired;

  // hostname "www.example.com" -> ["www.example.com", "example.com"]
  const parts = window.location.hostname.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const domain = parts.slice(i).join(".");
    document.cookie = `${expired}; domain=${domain}`;
    document.cookie = `${expired}; domain=.${domain}`;
  }
}

/**
 * Delete first-party cookies whose category was just withdrawn. Only first-party
 * cookies scoped to this origin can be deleted by the browser; third-party
 * cookies (Stripe, etc.) unload themselves on the next page load if the SDK
 * that set them is no longer executed.
 */
function cleanupCookiesForWithdrawnCategories(state: CookieConsentState) {
  if (typeof document === "undefined") return;
  const withdrawn = new Set<CookieCategory>();
  if (!state.functional) withdrawn.add("functional");
  if (!state.analytics) withdrawn.add("analytics");
  if (!state.marketing) withdrawn.add("marketing");
  if (withdrawn.size === 0) return;

  // Import inventory lazily to avoid a cycle.
  void import("@/config/cookies").then(({ COOKIE_INVENTORY }) => {
    for (const row of COOKIE_INVENTORY) {
      if (!withdrawn.has(row.category)) continue;
      if (row.party !== "First-party") continue;
      if (row.storage === "cookie") {
        // Best-effort cookie deletion. Row `name` may be a display label
        // ("a / b" or a pattern); split on ' / ' and try each token.
        const names = row.name.split("/").map((n) => n.trim().split(" ")[0]);
        for (const n of names) deleteCookieEverywhere(n);
      } else if (row.storage === "localStorage" || row.storage === "sessionStorage") {
        // Never remove necessary items even if a future change re-categorises them.
        if (row.category === "necessary") continue;
        const store = row.storage === "localStorage" ? localStorage : sessionStorage;
        try {
          // Rows written as a pattern ("reader-lead-capture-<series>",
          // "meta_pixel_once:<checkout session>") stand for a family of keys,
          // so an exact removeItem would silently miss every real one. Treat
          // the text before the placeholder as a prefix.
          const placeholder = row.name.indexOf("<");
          if (placeholder === -1) {
            store.removeItem(row.name);
          } else {
            const prefix = row.name.slice(0, placeholder);
            for (let i = store.length - 1; i >= 0; i--) {
              const key = store.key(i);
              if (key && key.startsWith(prefix)) store.removeItem(key);
            }
          }
        } catch { /* ignore */ }
      }
    }
  });
}
