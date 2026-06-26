import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ARTIFACTS, type Artifact, SERIES_COLOR } from "./archive-data";

// react-globe.gl pulls three.js — must be client-only. Lazy import skips
// the module entirely during SSR, and we gate the render on `mounted`.
const Globe = lazy(() => import("react-globe.gl"));

/**
 * Interactive artifact globe. Auto-rotates until the user interacts; flies
 * to the selected artifact when `selectedId` changes.
 */
export function ArtifactGlobe({
  onSelect,
  selectedId,
}: {
  onSelect: (a: Artifact) => void;
  selectedId?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState({ w: 600, h: 520 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const update = () => {
      const w = el.clientWidth;
      setSize({ w, h: Math.min(620, Math.max(360, Math.round(w * 0.85))) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  // Configure controls + fly-to after the globe mounts / selection changes.
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    try {
      const controls = g.controls();
      controls.autoRotate = !selectedId;
      controls.autoRotateSpeed = 0.4;
    } catch {
      // controls not ready yet
    }
    if (selectedId) {
      const a = ARTIFACTS.find((x) => x.id === selectedId);
      if (a) g.pointOfView({ lat: a.lat, lng: a.lng, altitude: 1.6 }, 1200);
    }
  }, [selectedId, mounted]);

  const points = useMemo(() => ARTIFACTS, []);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded border border-[color:var(--hud-accent)]/30 bg-black"
      style={{ height: size.h }}
      aria-label="Interactive artifact globe"
    >
      {mounted ? (
        <Suspense fallback={<LoadingHud />}>
          <Globe
            ref={globeRef}
            width={size.w}
            height={size.h}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
            bumpImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
            atmosphereColor="#22d3ee"
            atmosphereAltitude={0.18}
            pointsData={points}
            pointLat={(d: any) => d.lat}
            pointLng={(d: any) => d.lng}
            pointAltitude={0.04}
            pointRadius={0.55}
            pointColor={(d: any) => SERIES_COLOR[(d as Artifact).series]}
            pointLabel={(d: any) =>
              `<div style="font-family:ui-monospace,monospace;background:#000;border:1px solid #22d3ee;padding:6px 8px;color:#e6f7ff;font-size:11px">
                 <div style="color:#22d3ee">${(d as Artifact).code}</div>
                 <div style="font-weight:700">${(d as Artifact).name}</div>
                 <div style="color:#94a3b8">${(d as Artifact).year} · ${(d as Artifact).series}</div>
               </div>`
            }
            onPointClick={(d: any) => onSelect(d as Artifact)}
          />
        </Suspense>
      ) : (
        <LoadingHud />
      )}
    </div>
  );
}

function LoadingHud() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.3em] text-[color:var(--hud-dim)]">
      Initializing orbital scan…
    </div>
  );
}
