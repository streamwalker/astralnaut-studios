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
  if (typeof window === "undefined") return;
  const payload = { event, ...props, ts: Date.now() };
  try {
    (window.dataLayer ??= []).push(payload);
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, props);
    }
  } catch {
    /* swallow — analytics must never throw */
  }
}
