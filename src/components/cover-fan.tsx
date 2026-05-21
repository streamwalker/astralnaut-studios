import { useCallback, useEffect, useRef, useState } from "react";
import coaCover from "@/assets/coa-issue-1-cover.png";
import coaVariantA from "@/assets/coa-issue-1-variant-a.png";
import baCover from "@/assets/ba-issue-1-variant.png";
import baVariant2 from "@/assets/ba-issue-1-variant-2.png";

type Slot = {
  x: string;
  y: string;
  rotate: number;
  scale: number;
  z: number;
  width: string;
};

const slots: Slot[] = [
  { x: "0%",   y: "0%",  rotate: 2,   scale: 1.0,  z: 40, width: "58%" },
  { x: "55%",  y: "-4%", rotate: 8,   scale: 0.88, z: 30, width: "50%" },
  { x: "25%",  y: "-18%",rotate: 14,  scale: 0.78, z: 20, width: "46%" },
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [tickKey, setTickKey] = useState(0);
  const pausedRef = useRef(false);

  const goNext = useCallback(() => {
    setActive((i) => (i + 1) % covers.length);
    setTickKey((k) => k + 1);
  }, []);
  const goPrev = useCallback(() => {
    setActive((i) => (i - 1 + covers.length) % covers.length);
    setTickKey((k) => k + 1);
  }, []);

  // Auto-rotate (resets when tickKey changes)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) return;
    }
    const id = window.setInterval(() => {
      if (!pausedRef.current && !lightboxOpen) {
        setActive((i) => (i + 1) % covers.length);
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [tickKey, lightboxOpen]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightboxOpen && e.key === "Escape") {
        setLightboxOpen(false);
        return;
      }
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, goNext, goPrev]);

  const handleCoverClick = (i: number) => {
    if (i === active) {
      setLightboxOpen(true);
    } else {
      setActive(i);
      setTickKey((k) => k + 1);
    }
  };

  return (
    <>
      <div
        className="relative mx-auto aspect-[5/6] w-full max-w-[560px]"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        {covers.map((c, i) => {
          const slot = slots[(i - active + slots.length) % slots.length];
          const isFront = i === active;
          return (
            <button
              key={c.src}
              type="button"
              onClick={() => handleCoverClick(i)}
              aria-label={isFront ? `Expand ${c.alt}` : `Bring ${c.alt} to front`}
              className="absolute left-1/2 top-1/2 overflow-hidden rounded-xl p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon)]"
              style={{
                width: slot.width,
                aspectRatio: "5 / 7.5",
                zIndex: slot.z,
                transform: `translate(-50%, -50%) translate(${slot.x}, ${slot.y}) rotate(${slot.rotate}deg) scale(${slot.scale})`,
                transition: "transform 900ms cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,255,0.18), 0 0 40px rgba(160,64,255,0.18)",
                willChange: "transform",
                background: "transparent",
                border: "none",
              }}
            >
              <img
                src={c.src}
                alt={c.alt}
                className="block h-full w-full object-cover pointer-events-none"
                loading="eager"
                draggable={false}
              />
            </button>
          );
        })}

        {/* Prev / Next controls */}
        <ArrowButton side="left" onClick={(e) => { e.stopPropagation(); goPrev(); }} label="Previous cover" />
        <ArrowButton side="right" onClick={(e) => { e.stopPropagation(); goNext(); }} label="Next cover" />
      </div>

      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cover preview"
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full text-2xl font-bold text-white hover:text-[var(--neon)]"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            ×
          </button>

          <ArrowButton
            side="left"
            large
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            label="Previous cover"
          />
          <ArrowButton
            side="right"
            large
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            label="Next cover"
          />

          <img
            src={covers[active].src}
            alt={covers[active].alt}
            onClick={(e) => e.stopPropagation()}
            className="block max-h-[90vh] w-auto rounded-xl"
            style={{
              maxWidth: "min(720px, 92vw)",
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(34,211,255,0.25), 0 0 60px rgba(160,64,255,0.25)",
            }}
          />
        </div>
      )}
    </>
  );
}

function ArrowButton({
  side,
  onClick,
  label,
  large = false,
}: {
  side: "left" | "right";
  onClick: (e: React.MouseEvent) => void;
  label: string;
  large?: boolean;
}) {
  const size = large ? "h-12 w-12 text-2xl" : "h-10 w-10 text-xl";
  const offset = large ? (side === "left" ? "left-6" : "right-6") : (side === "left" ? "left-2" : "right-2");
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 -translate-y-1/2 ${offset} ${size} z-50 flex items-center justify-center rounded-full font-bold text-white hover:text-[var(--neon)] transition-colors`}
      style={{
        background: "rgba(2,0,12,0.65)",
        border: "1px solid rgba(34,211,255,0.35)",
        boxShadow: "0 0 18px rgba(34,211,255,0.2), 0 0 30px rgba(160,64,255,0.18)",
        backdropFilter: "blur(6px)",
      }}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
