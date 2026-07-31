// Persist the URL the user was on when an auth gate intercepted them, so we
// can restore it after login / verify-email / complete-profile even if the
// `?next=` query param gets dropped somewhere in the round-trip (email
// confirmation link, OAuth provider redirect, page refresh, etc.).
//
// Multi-tab safety
// ----------------
// sessionStorage is already per-tab, BUT a tab opened with target="_blank"
// (or "Duplicate tab") inherits a *copy* of the opener's sessionStorage. That
// copy would make the new tab redirect to the other tab's intended
// destination. To prevent that, every record is stamped with a tab id that
// lives in `window.name` — window.name survives same-tab navigations (so the
// full auth round-trip keeps working) but is NOT inherited by a duplicated or
// link-opened tab. Records stamped by another tab are ignored and discarded.
// Records also expire so an abandoned auth attempt can't hijack a later one.

const KEY = "auth_return_to_v1";
const TAB_NAME_PREFIX = "lv_tab:";
const TTL_MS = 30 * 60 * 1000; // 30 minutes

type Record_ = { path: string; tab: string; ts: number };

// Paths we should never bounce back to — they're part of the auth flow itself
// and would create loops.
const BLOCKED = ["/login", "/verify-email", "/complete-profile", "/auth"];

function isSafe(path: string): boolean {
  if (!path) return false;
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  return !BLOCKED.some((b) => path === b || path.startsWith(`${b}/`) || path.startsWith(`${b}?`));
}

/** Stable id for THIS browser tab; not inherited by duplicated/_blank tabs. */
function tabId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.name;
    if (existing && existing.startsWith(TAB_NAME_PREFIX)) return existing.slice(TAB_NAME_PREFIX.length);
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    // Only claim window.name when it isn't being used for something else
    // (e.g. a named popup target) to avoid breaking third-party flows.
    if (!existing) window.name = TAB_NAME_PREFIX + id;
    return id;
  } catch {
    return "";
  }
}

function readRecord(): Record_ | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let rec: Record_ | null = null;
  try {
    const parsed = JSON.parse(raw) as Partial<Record_>;
    if (parsed && typeof parsed.path === "string") {
      rec = { path: parsed.path, tab: String(parsed.tab ?? ""), ts: Number(parsed.ts ?? 0) };
    }
  } catch {
    rec = null;
  }
  if (!rec || !isSafe(rec.path)) {
    clearReturnTo();
    return null;
  }
  // Foreign tab (inherited copy) or expired → drop it so this tab keeps its
  // own intent and never redirects to another tab's destination.
  if (rec.tab !== tabId() || !rec.ts || Date.now() - rec.ts > TTL_MS) {
    clearReturnTo();
    return null;
  }
  return rec;
}

export function rememberReturnTo(path?: string) {
  if (typeof window === "undefined") return;
  const target =
    path ?? window.location.pathname + window.location.search + window.location.hash;
  if (!isSafe(target)) return;
  try {
    const rec: Record_ = { path: target, tab: tabId(), ts: Date.now() };
    sessionStorage.setItem(KEY, JSON.stringify(rec));
  } catch {
    /* storage disabled */
  }
}

export function consumeReturnTo(): string | null {
  const rec = readRecord();
  if (!rec) return null;
  clearReturnTo();
  return rec.path;
}

export function peekReturnTo(): string | null {
  return readRecord()?.path ?? null;
}

export function clearReturnTo() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
