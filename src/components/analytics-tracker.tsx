import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { hasConsent, CONSENT_CHANGED_EVENT } from "@/lib/cookies-client";

const SESSION_KEY = "as_analytics_sid";
const SESSION_START_KEY = "as_analytics_sstart";

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, sid);
      sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    }
    return sid;
  } catch {
    return "anon0000";
  }
}

async function logEvent(payload: {
  event_type: "pageview" | "click" | "page_leave" | "session_end";
  path: string;
  target?: string | null;
  duration_ms?: number | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const session_id = getSessionId();
    const { data: userData } = await supabase.auth.getUser();
    const row = {
      session_id,
      user_id: userData.user?.id ?? null,
      event_type: payload.event_type,
      path: payload.path.slice(0, 500),
      target: payload.target ? payload.target.slice(0, 300) : null,
      duration_ms: payload.duration_ms ?? null,
      referrer: typeof document !== "undefined" ? document.referrer.slice(0, 500) || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
      metadata: payload.metadata ?? {},
    };
    await supabase.from("analytics_events").insert(row as never);
  } catch {
    /* swallow — analytics must never break the app */
  }
}

function sendBeaconLeave(path: string, duration_ms: number, session_id: string, user_id: string | null) {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics_events`;
    const body = JSON.stringify({
      session_id,
      user_id,
      event_type: "page_leave",
      path: path.slice(0, 500),
      duration_ms,
      referrer: document.referrer.slice(0, 500) || null,
      user_agent: navigator.userAgent.slice(0, 500),
      metadata: {},
    });
    const blob = new Blob([body], { type: "application/json" });
    // sendBeacon can't set headers, but PostgREST requires apikey + content-type.
    // Fallback to fetch with keepalive which does support headers.
    fetch(url, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body,
    }).catch(() => {});
    void blob; // suppress unused
  } catch {
    /* ignore */
  }
}

function describeTarget(el: Element): string {
  const a = el.closest("a, button, [role='button']") as HTMLElement | null;
  if (!a) return el.tagName.toLowerCase();
  const text = (a.innerText || a.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
  const tag = a.tagName.toLowerCase();
  const href = a.getAttribute("href");
  const label = text ? text.slice(0, 80) : a.getAttribute("aria-label")?.slice(0, 80) ?? "";
  return `${tag}${href ? ` → ${href}` : ""}${label ? ` · "${label}"` : ""}`;
}

export function AnalyticsTracker() {
  const router = useRouter();
  const currentPath = useRef<string>(typeof window !== "undefined" ? window.location.pathname : "/");
  const pageEnter = useRef<number>(Date.now());
  const userId = useRef<string | null>(null);
  const [consented, setConsented] = useState<boolean>(() => hasConsent("analytics"));

  useEffect(() => {
    const onChange = () => setConsented(hasConsent("analytics"));
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!consented) return;
    supabase.auth.getUser().then(({ data }) => {
      userId.current = data.user?.id ?? null;
    });

    // Initial pageview
    getSessionId();
    logEvent({ event_type: "pageview", path: currentPath.current });
    pageEnter.current = Date.now();

    // Route change tracker
    const unsub = router.subscribe("onResolved", ({ toLocation }) => {
      const newPath = toLocation.pathname;
      if (newPath === currentPath.current) return;
      const duration = Date.now() - pageEnter.current;
      // Log time spent on previous page
      logEvent({
        event_type: "page_leave",
        path: currentPath.current,
        duration_ms: duration,
      });
      currentPath.current = newPath;
      pageEnter.current = Date.now();
      logEvent({ event_type: "pageview", path: newPath });
    });

    // Click tracking (delegated)
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      const interactive = t.closest("a, button, [role='button']") as HTMLElement | null;
      if (!interactive) return;
      logEvent({
        event_type: "click",
        path: window.location.pathname,
        target: describeTarget(interactive),
      });
    };
    document.addEventListener("click", onClick, { capture: true });

    // Visibility / unload — flush page time
    const flush = () => {
      const duration = Date.now() - pageEnter.current;
      if (duration < 500) return;
      sendBeaconLeave(currentPath.current, duration, getSessionId(), userId.current);
      pageEnter.current = Date.now();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else pageEnter.current = Date.now();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsub();
      document.removeEventListener("click", onClick, { capture: true } as any);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return null;
}
