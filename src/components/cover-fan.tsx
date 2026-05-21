import { useEffect, useRef, useState } from "react";
import coaCover from "@/assets/coa-issue-1-cover.png";
import coaVariantA from "@/assets/coa-issue-1-variant-a.png";
import baCover from "@/assets/ba-issue-1-variant.png";
import baVariant2 from "@/assets/ba-issue-1-variant-2.png";

type Slot = {
  // tailwind-free inline transform values
  x: string; // translateX as %
  y: string; // translateY as %
  rotate: number; // deg
  scale: number;
  z: number;
  width: string; // % of container width
};

const slots: Slot[] = [
  // front-center
  { x: "0%",   y: "0%",  rotate: 2,   scale: 1.0,  z: 40, width: "58%" },
  // back-right
  { x: "55%",  y: "-4%", rotate: 8,   scale: 0.88, z: 30, width: "50%" },
  // far-back
  { x: "25%",  y: "-18%",rotate: 14,  scale: 0.78, z: 20, width: "46%" },
  // back-left
  { x: "-55%", y: "2%",  rotate: -10, scale: 0.86, z: 10, width: "50%" },
];

const covers = [
  { src: baCover,      alt: "Battlefield Atlantis Issue 1" },
  { src: baVariant2,   alt: "Battlefield Atlantis Issue 1 — Variant Cover" },
  { src: coaCover,     alt: "Children of Aquarius Issue 1" },
  { src: coaVariantA,  alt: "Children of Aquarius Issue 1 — Variant A" },
];

export function CoverFan() {
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) return;
    }
    const id = window.setInterval(() => {
      if (!pausedRef.current) setActive((i) => (i + 1) % covers.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="relative mx-auto aspect-[5/6] w-full max-w-[560px]"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {covers.map((c, i) => {
        const slot = slots[(i - active + slots.length) % slots.length];
        return (
          <div
            key={c.src}
            className="absolute left-1/2 top-1/2 overflow-hidden rounded-xl"
            style={{
              width: slot.width,
              aspectRatio: "5 / 7.5",
              zIndex: slot.z,
              transform: `translate(-50%, -50%) translate(${slot.x}, ${slot.y}) rotate(${slot.rotate}deg) scale(${slot.scale})`,
              transition: "transform 900ms cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,255,0.18), 0 0 40px rgba(160,64,255,0.18)",
              willChange: "transform",
            }}
          >
            <img
              src={c.src}
              alt={c.alt}
              className="block h-full w-full object-cover"
              loading="eager"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
}
