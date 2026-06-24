import { useEffect, useRef, useState } from "react";

/** Returns [ref, inView]. Once `inView` is true it stays true (one-shot reveal). */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
            break;
          }
        }
      },
      options,
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [options]);

  return [ref, inView] as const;
}
