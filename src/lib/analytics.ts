import { hasConsent } from "@/lib/cookies-client";
import { supabase } from "@/integrations/supabase/client";
/**
 * Thin client-side analytics wrapper. Sends events to:
 *  - `window.dataLayer.push(...)` (Google Tag Manager / GA4 sink)
 *  - `console.debug` in dev so events are inspectable in the browser console
 *
 * Server-rendered safety: all calls no-op when `window` is undefined.
 */
export type TrackProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(event: string, props: TrackProps = {}) {
  if (typeof window === "undefined" || !hasConsent("analytics")) return;
  const payload = { event, ...props, ts: Date.now() };
  try {
    (window.dataLayer ??= []).push(payload);
    if (["preview_started", "preview_page_viewed", "preview_last_page_viewed", "paywall_viewed", "subscribe_clicked", "checkout_started"].includes(event)) {
      let sid = sessionStorage.getItem("as_analytics_sid");
      if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem("as_analytics_sid", sid); }
      void supabase.from("analytics_events").insert({
        session_id: sid, event_type: "click", path: window.location.pathname,
        target: event, metadata: { ...props, funnel_event: event, device: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop" },
      } as never).then(() => {}, () => {});
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, props);
    }
  } catch {
    /* swallow — analytics must never throw */
  }
}
