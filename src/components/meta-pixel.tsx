import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { CONSENT_CHANGED_EVENT, hasConsent, loadIfConsented } from "@/lib/cookies-client";
import { loadMetaPixel, revokeMetaPixel, trackMetaEvent } from "@/lib/meta-pixel";

/**
 * Mounts the Meta Pixel behind the marketing consent gate and keeps its
 * PageView count honest across client-side navigation.
 *
 * Renders nothing. Three responsibilities:
 *
 *   1. Load. loadIfConsented("marketing", ...) is the only thing that ever
 *      calls loadMetaPixel(), so fbevents.js is not fetched — and no fbq call
 *      is made — until the visitor opts in. GPC visitors never reach it,
 *      because isGpcOptOut() forces marketing to false in readConsent().
 *
 *   2. Revoke. A third-party script cannot be unloaded from a live page, so on
 *      withdrawal we call fbq("consent", "revoke"), which suppresses every
 *      subsequent send. The _fbp / _fbc cookies are deleted separately by
 *      cleanupCookiesForWithdrawnCategories() off their COOKIE_INVENTORY rows.
 *
 *   3. SPA pageviews. This is an SSR app with client-side routing: after the
 *      first paint the browser never reloads, so Meta's stock snippet would
 *      record exactly one PageView per session. We mirror analytics-tracker.tsx
 *      and re-fire on each resolved route change.
 *
 * The router subscription is unconditional. trackMetaEvent() already refuses to
 * send unless the pixel is configured, initialized, and marketing consent is
 * live at call time, so there is no second gate to keep in sync here.
 */
export function MetaPixel() {
  const router = useRouter();
  const currentPath = useRef<string>(typeof window !== "undefined" ? window.location.pathname : "/");
  const marketingWasOn = useRef<boolean>(false);

  useEffect(() => {
    marketingWasOn.current = hasConsent("marketing");
    const unsubConsent = loadIfConsented("marketing", loadMetaPixel);

    // loadIfConsented only fires on grant. Withdrawal is the other edge.
    const onConsentChange = () => {
      const on = hasConsent("marketing");
      if (marketingWasOn.current && !on) revokeMetaPixel();
      marketingWasOn.current = on;
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, onConsentChange);

    // loadMetaPixel() sends the first PageView itself; this covers every
    // subsequent in-app navigation.
    const unsubRouter = router.subscribe("onResolved", ({ toLocation }) => {
      const nextPath = toLocation.pathname;
      if (nextPath === currentPath.current) return;
      currentPath.current = nextPath;
      trackMetaEvent("PageView");
    });

    return () => {
      unsubConsent();
      unsubRouter();
      window.removeEventListener(CONSENT_CHANGED_EVENT, onConsentChange);
    };
  }, [router]);

  return null;
}
