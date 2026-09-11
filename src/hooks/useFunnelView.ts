import { useEffect, useRef } from "react";
import { hasConsent, CONSENT_CHANGED_EVENT } from "@/lib/cookies-client";
import { track, type TrackProps } from "@/lib/analytics";

/** Report a rendered section only when it enters the viewport with consent. */
export function useFunnelView(event: string, props: TrackProps) {
  const ref = useRef<HTMLDivElement>(null);
  const propsKey = JSON.stringify(props);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let seen = false;
    let visible = false;
    const report = () => {
      if (seen || !visible || !hasConsent("analytics")) return;
      seen = true;
      track(event, JSON.parse(propsKey));
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      report();
    }, { threshold: 0 });
    observer.observe(element);
    window.addEventListener(CONSENT_CHANGED_EVENT, report);
    return () => { observer.disconnect(); window.removeEventListener(CONSENT_CHANGED_EVENT, report); };
  }, [event, propsKey]);
  return ref;
}
