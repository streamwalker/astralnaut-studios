const seen = new Set<string>();

export function trackVisit(path: string, userId?: string | null) {
  if (typeof window === "undefined") return;
  const key = `${path}|${userId ?? ""}`;
  if (seen.has(key)) return;
  seen.add(key);

  const payload = JSON.stringify({
    path,
    referrer: document.referrer || null,
    user_id: userId ?? null,
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/public/track", blob)) return;
    }
  } catch {
    // fall through
  }
  try {
    void fetch("/api/public/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  } catch {
    // ignore
  }
}
