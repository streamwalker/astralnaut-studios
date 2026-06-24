import { useEffect, useRef, useState } from "react";
import videoAsset from "@/assets/battlefield-atlantis-teaser.mp4.asset.json";
import posterAsset from "@/assets/battlefield-atlantis-teaser-poster.jpg.asset.json";
import { track } from "@/lib/analytics";

/**
 * Full-bleed autoplaying muted background video for the landing hero.
 * - Respects prefers-reduced-motion (poster only).
 * - Skips video on Save-Data / 2g connections (poster only).
 * - Poster paints immediately; video swaps in once it can play.
 */
export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [useVideo, setUseVideo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") return;

    setUseVideo(true);
  }, []);

  useEffect(() => {
    if (!useVideo) return;
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.then === "function") {
      p.then(() => track("hero_video_played", {})).catch(() => track("hero_video_blocked", {}));
    }
  }, [useVideo]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {useVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoAsset.url}
          poster={posterAsset.url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
        />
      ) : (
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={posterAsset.url}
          alt=""
          loading="eager"
          fetchPriority="high"
        />
      )}
      {/* Legibility gradient — darker on the left where the copy lives. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,8,14,0.92) 0%, rgba(5,8,14,0.7) 40%, rgba(5,8,14,0.35) 75%, rgba(5,8,14,0.15) 100%)",
        }}
      />
      {/* Subtle bottom fade into the page. */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{ background: "linear-gradient(180deg, transparent, var(--bg, #05080e))" }}
      />
    </div>
  );
}
