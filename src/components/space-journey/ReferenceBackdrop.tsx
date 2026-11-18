import { useEffect, useRef } from "react";
import { chapterIds } from "./flight";

/** Original canon artwork anchors the photographic look; WebGL adds the moving fleet. */
const plates = ["orbit", "city", "santee", "orbit", "ryuken"];
export function ReferenceBackdrop({ home, path }: { home: boolean; path: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const paint = () => {
      frame = 0;
      const layers = ref.current?.children;
      if (!layers) return;
      let progress = path.includes("industry") ? 4 : path.includes("astralnaut-studios") ? 1 : 3;
      if (home) {
        const y = scrollY;
        const positions = chapterIds.map(id => document.getElementById(id)?.offsetTop ?? 0);
        progress = 0;
        for (let i = 0; i < positions.length - 1; i++) {
          if (y >= positions[i]) progress = i + Math.min(1, (y - positions[i]) / Math.max(1, positions[i + 1] - positions[i]));
        }
      }
      for (let i = 0; i < layers.length; i++) {
        const distance = Math.abs(progress - i);
        (layers[i] as HTMLElement).style.opacity = String(Math.max(0, 1 - distance));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [home, path]);
  return <div className="reference-backdrop" ref={ref} aria-hidden="true">
    {plates.map((name, i) => <div key={i} className={`reference-plate reference-${name}`} style={{ backgroundImage: `url(/space-journey/reference-art/${name}.webp)` }} />)}
  </div>;
}
