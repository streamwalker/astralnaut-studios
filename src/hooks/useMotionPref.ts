import { useEffect, useSyncExternalStore } from "react";

const KEY = "rwc-motion-off-v1";
const EVENT = "rwc:motion-pref-change";
const DATA_ATTR = "data-motion";

type MotionPref = "auto" | "off";

function readSystemPref(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readStoredPref(): MotionPref {
  if (typeof window === "undefined") return "auto";
  try {
    const v = localStorage.getItem(KEY);
    return v === "off" ? "off" : "auto";
  } catch {
    return "auto";
  }
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const onChange = () => cb();
  window.addEventListener(EVENT, onChange);
  const mq = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  mq?.addEventListener?.("change", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    mq?.removeEventListener?.("change", onChange);
  };
}

function getSnapshot(): boolean {
  const stored = readStoredPref();
  if (stored === "off") return true;
  return readSystemPref();
}

/**
 * Returns true when the user (or their OS) has asked to reduce motion.
 * SSR-safe: renders as `false` on the server, then hydrates to the real value.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Returns the user's explicit stored preference (independent of OS setting). */
export function useMotionPref(): [MotionPref, (v: MotionPref) => void] {
  const pref = useSyncExternalStore(
    subscribe,
    () => readStoredPref(),
    () => "auto" as MotionPref,
  );
  return [
    pref,
    (v) => {
      try {
        if (v === "off") localStorage.setItem(KEY, "off");
        else localStorage.removeItem(KEY);
      } catch { /* ignore */ }
      try {
        window.dispatchEvent(new CustomEvent(EVENT));
      } catch { /* ignore */ }
    },
  ];
}

/**
 * Mounts an effect that mirrors the current motion preference onto
 * `<html data-motion="off|auto">` so CSS can gate parallax and JS-driven
 * animations globally without prop-drilling.
 */
export function useMotionRootAttr() {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute(DATA_ATTR, reduced ? "off" : "auto");
  }, [reduced]);
}
