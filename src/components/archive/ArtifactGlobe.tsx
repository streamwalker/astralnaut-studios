import { useEffect, useRef, useState } from "react";
import { ARTIFACTS, type Artifact, SERIES_COLOR } from "./archive-data";

/**
 * Client-only artifact globe. react-globe.gl pulls three.js, which crashes
 * during SSR (`window is not defined`). We dynamic-import inside an effect
 * and render nothing on the server.
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
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ w: 600, h: 520 });

  // Track container width so the globe stays responsive.
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setSize({ w, h: Math.min(620, Math.max(360, Math.round(w * 0.85))) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Mount the globe once on the client.
  useEffect(() => {
    let cancelled = false;
    let instance: any;
    (async () => {
      const mod = await import("react-globe.gl");
      if (cancelled || !wrapRef.current) return;
      const Globe = (mod as any).default;
      instance = new Globe(wrapRef.current)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png")
        .atmosphereColor("#22d3ee")
        .atmosphereAltitude(0.18)
        .pointsData(ARTIFACTS)
        .pointLat((d: any) => d.lat)
        .pointLng((d: any) => d.lng)
        .pointAltitude(0.04)
        .pointRadius(0.55)
        .pointColor((d: any) => SERIES_COLOR[(d as Artifact).series])
        .pointLabel(
          (d: any) =>
            `<div style="font-family:ui-monospace,monospace;background:#000;border:1px solid #22d3ee;padding:6px 8px;color:#e6f7ff;font-size:11px">
               <div style="color:#22d3ee">${(d as Artifact).code}</div>
               <div style="font-weight:700">${(d as Artifact).name}</div>
               <div style="color:#94a3b8">${(d as Artifact).year} · ${(d as Artifact).series}</div>
             </div>`,
        )
        .onPointClick((d: any) => onSelect(d as Artifact));
      const controls = instance.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enableZoom = true;
      globeRef.current = instance;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (instance?._destructor) instance._destructor();
      if (wrapRef.current) wrapRef.current.innerHTML = "";
    };
  }, [onSelect]);

  // Resize when container width changes.
  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.width(size.w).height(size.h);
  }, [size, ready]);

  // Fly to the selected artifact.
  useEffect(() => {
    if (!globeRef.current || !selectedId) return;
    const a = ARTIFACTS.find((x) => x.id === selectedId);
    if (!a) return;
    globeRef.current.pointOfView({ lat: a.lat, lng: a.lng, altitude: 1.6 }, 1200);
  }, [selectedId, ready]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded border border-[color:var(--hud-accent)]/30 bg-black"
      style={{ height: size.h }}
      aria-label="Interactive artifact globe"
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.3em] text-[color:var(--hud-dim)]">
          Initializing orbital scan…
        </div>
      )}
    </div>
  );
}
