// Meta (Facebook) Pixel — consent-gated loader.
//
// The pixel is a MARKETING technology under src/config/cookies.ts. Nothing in
// this module runs on its own: src/components/meta-pixel.tsx drives it through
// loadIfConsented("marketing", ...) from src/lib/cookies-client.ts, so the
// script is never fetched and no fbq call is ever made until the visitor opts
// in. A GPC signal forces marketing to false, which means GPC visitors never
// load it at all.
//
// Two parts of Meta's stock snippet are deliberately NOT implemented:
//
//   1. The <noscript><img src="facebook.com/tr?..."></noscript> fallback.
//      A noscript tag cannot be consent-gated — the browser fetches it during
//      first paint for every visitor, including anyone who rejected marketing
//      or sent GPC. Shipping it would silently defeat the gate this whole file
//      exists to honor. The tradeoff is that visitors with JavaScript disabled
//      are not counted, which is correct: they also cannot consent.
//
//   2. Advanced Matching — fbq("init", id, { em, ph, ... }). That sends hashed
//      customer email/phone to Meta, a materially broader disclosure than what
//      /cookies and /subprocessors currently make. Adding it requires updating
//      both pages first.

import { hasConsent } from "@/lib/cookies-client";

const SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";
const SCRIPT_ID = "meta-pixel-sdk";

/**
 * Pixel ID. Publishable — it appears in the page source of every site running
 * a pixel — so it lives in `.env.production` alongside VITE_PAYMENTS_CLIENT_TOKEN
 * rather than in a Worker secret.
 *
 * It is intentionally absent from `.env` / `.env.development`, so `vite dev`
 * and any development build resolve it to "" and every function here no-ops.
 * Local traffic must not pollute the ad account's optimization data.
 */
export const META_PIXEL_ID: string = String(import.meta.env.VITE_META_PIXEL_ID ?? "").trim();

export function isMetaPixelConfigured(): boolean {
  return META_PIXEL_ID.length > 0;
}

/** Standard events Meta recognizes for optimization and attribution. */
export type MetaStandardEvent =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "AddToWishlist"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"
  | "Subscribe"
  | "StartTrial"
  | "Contact"
  | "Schedule"
  | "SubmitApplication";

type FbqFn = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

let initialized = false;

/**
 * Meta's stub. Calls made before fbevents.js finishes downloading are pushed
 * onto `queue` and replayed once the real implementation attaches `callMethod`.
 * This is why trackMetaEvent() can fire immediately after loadMetaPixel().
 */
function installStub(): FbqFn {
  if (window.fbq) return window.fbq;

  const fbq = function (this: unknown, ...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue!.push(args);
  } as FbqFn;

  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;

  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  return fbq;
}

function injectScript() {
  if (document.getElementById(SCRIPT_ID)) return;
  const el = document.createElement("script");
  el.id = SCRIPT_ID;
  el.async = true;
  el.src = SCRIPT_SRC;
  document.head.appendChild(el);
}

/**
 * Initializes the pixel and records the first PageView. Idempotent.
 *
 * Only ever called from the marketing consent gate. Calling it a second time
 * (re-consent after a withdrawal) re-grants rather than re-initializing,
 * because fbevents.js is already resident and cannot be unloaded.
 */
export function loadMetaPixel(): void {
  if (typeof window === "undefined") return;
  if (!isMetaPixelConfigured()) return;

  if (initialized) {
    grantMetaPixelConsent();
    trackMetaEvent("PageView");
    return;
  }
  initialized = true;

  const fbq = installStub();
  injectScript();
  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView");
}

/**
 * Stops the pixel from sending on consent withdrawal.
 *
 * A loaded third-party script cannot be removed from a live page, so this is
 * the strongest available client-side stop: fbq("consent", "revoke") suppresses
 * every subsequent send. The `_fbp` / `_fbc` first-party cookies are separately
 * deleted by cleanupCookiesForWithdrawnCategories() in cookies-client.ts,
 * which reads their rows out of COOKIE_INVENTORY.
 */
export function revokeMetaPixel(): void {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("consent", "revoke");
  } catch {
    /* swallow — consent bookkeeping must never break the app */
  }
}

function grantMetaPixelConsent(): void {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("consent", "grant");
  } catch {
    /* swallow */
  }
}

/**
 * Sends a standard event. Silently does nothing unless the pixel is configured,
 * has been initialized through the consent gate, and marketing consent is still
 * live at call time — so call sites never need to check consent themselves.
 *
 * `eventID` is passed through for deduplication against a future server-side
 * Conversions API send of the same event.
 */
export function trackMetaEvent(
  event: MetaStandardEvent,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
): void {
  if (typeof window === "undefined") return;
  if (!isMetaPixelConfigured() || !initialized) return;
  if (!hasConsent("marketing")) return;
  const fbq = window.fbq;
  if (!fbq) return;
  try {
    if (options?.eventID) fbq("track", event, params ?? {}, { eventID: options.eventID });
    else fbq("track", event, params ?? {});
  } catch {
    /* swallow — analytics must never break the app */
  }
}

/**
 * Fires `event` at most once per browser session.
 *
 * Needed for Purchase: the confirmation lives at a bookmarkable, refreshable
 * URL (/account?checkout=success&session_id=...), so a naive fire-on-render
 * would double-count revenue every time the reader reloads that page.
 */
export function trackMetaEventOnce(
  key: string,
  event: MetaStandardEvent,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
): void {
  if (typeof window === "undefined") return;
  const storageKey = `meta_pixel_once:${key}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
  } catch {
    // Private mode / storage disabled: fall through and send. Over-counting a
    // conversion is a better failure than losing it entirely.
  }
  trackMetaEvent(event, params, options);
}
