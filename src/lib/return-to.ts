// Persist the URL the user was on when an auth gate intercepted them, so we
// can restore it after login / verify-email / complete-profile even if the
// `?next=` query param gets dropped somewhere in the round-trip (email
// confirmation link, OAuth provider redirect, page refresh, etc.).

const KEY = "auth_return_to_v1";

// Paths we should never bounce back to — they're part of the auth flow itself
// and would create loops.
const BLOCKED = ["/login", "/verify-email", "/complete-profile", "/auth"];

function isSafe(path: string): boolean {
  if (!path) return false;
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  return !BLOCKED.some((b) => path === b || path.startsWith(`${b}/`) || path.startsWith(`${b}?`));
}

export function rememberReturnTo(path?: string) {
  if (typeof window === "undefined") return;
  const target =
    path ?? window.location.pathname + window.location.search + window.location.hash;
  if (!isSafe(target)) return;
  try {
    sessionStorage.setItem(KEY, target);
  } catch {
    /* storage disabled */
  }
}

export function consumeReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(KEY);
    if (v) sessionStorage.removeItem(KEY);
    return v && isSafe(v) ? v : null;
  } catch {
    return null;
  }
}

export function peekReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(KEY);
    return v && isSafe(v) ? v : null;
  } catch {
    return null;
  }
}

export function clearReturnTo() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
