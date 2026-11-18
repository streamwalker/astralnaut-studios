import { useEffect, useId, useRef, useState } from "react";
import type { VesselController } from "./vessel-viewer-runtime";
import "./vessel-viewer.css";

export type VesselName = "santee" | "ryuken";
const names: Record<VesselName, string> = { santee: "Santee Station", ryuken: "Starship Ryuken" };

/** The render runtime is imported only in the browser, never during Worker SSR. */
export function VesselViewer({ vessel }: { vessel: VesselName }) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<VesselController | null>(null);
  const [status, setStatus] = useState<"waiting" | "loading" | "ready" | "fallback">("waiting");
  const [touchMode, setTouchMode] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const helpId = useId();
  const titleId = useId();
  const name = names[vessel];

  useEffect(() => {
    const media = matchMedia("(any-pointer: coarse)");
    const sync = () => setCoarse(media.matches || navigator.maxTouchPoints > 0);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const abort = new AbortController();
    let started = false;
    let mounted: VesselController | null = null;
    setStatus("waiting");
    setTouchMode(false);
    const start = async () => {
      if (started || abort.signal.aborted) return;
      started = true;
      setStatus("loading");
      try {
        const { mountVessel } = await import("./vessel-viewer-runtime");
        if (abort.signal.aborted) return;
        mounted = await mountVessel(element, vessel, {
          signal: abort.signal,
          onReady: () => { if (!abort.signal.aborted) setStatus("ready"); },
          onError: () => {
            if (!abort.signal.aborted) {
              setStatus("fallback");
              setTouchMode(false);
            }
          },
          onExit: () => setTouchMode(false),
        });
        if (abort.signal.aborted) mounted.dispose();
        else controller.current = mounted;
      } catch {
        if (!abort.signal.aborted) setStatus("fallback");
      }
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        void start();
      }
    }, { rootMargin: "250px 0px" });
    observer.observe(element);
    return () => {
      observer.disconnect();
      abort.abort();
      mounted?.dispose();
      controller.current = null;
    };
  }, [vessel, attempt]);

  useEffect(() => { controller.current?.setTouchEnabled(touchMode); }, [touchMode, status]);

  const turn = (yaw: number, pitch = 0) => controller.current?.rotate(yaw, pitch);
  const ready = status === "ready";
  return (
    <figure className="vessel-viewer" data-vessel={vessel} data-status={status} data-touch-active={touchMode} data-touch-capable={coarse} aria-labelledby={titleId}>
      <figcaption className="vessel-viewer-heading">
        <div><span className="vessel-viewer-kicker">Battlefield Atlantis</span><h3 id={titleId}>{name}</h3></div>
        <span className="vessel-viewer-badge">{ready ? "Interactive 3D" : status === "fallback" ? "Preview image" : "3D model"}</span>
      </figcaption>
      <div className="vessel-viewer-stage">
        <div ref={host} className="vessel-viewer-surface" tabIndex={ready ? 0 : -1} role="group"
          aria-label={`${name} 3D rotation controls`} aria-describedby={helpId}
          data-lenis-prevent={touchMode ? "true" : undefined} data-touch-active={touchMode} />
        {status !== "ready" && <div className="vessel-viewer-pending">
          {status === "fallback" ? <>
            <img src={`/space-journey/interactive-vessels/${vessel}-preview.webp`} alt={`Rendered preview of the ${name} model`} />
            <div className="vessel-viewer-message" role="status"><p>3D is unavailable. Showing a rendered preview.</p><button type="button" onClick={() => setAttempt(n => n + 1)}>Retry 3D</button></div>
          </> : <div className="vessel-viewer-message" role="status"><span className="vessel-viewer-loader" aria-hidden="true" /><p>{status === "loading" ? `Loading ${name}…` : "Explore the model in 3D"}</p></div>}
        </div>}
        {ready && <span className="vessel-viewer-stage-label" aria-hidden="true">{coarse ? touchMode ? "Drag to turn · Done to scroll" : "Tap Rotate model to explore" : "Drag to rotate · Shift-drag to roll"}</span>}
      </div>
      <div className="vessel-viewer-toolbar" aria-label={`${name} view controls`}>
        <div className="vessel-viewer-touch-action"><button type="button" className={touchMode ? "is-active" : ""} disabled={!ready} aria-pressed={touchMode} onClick={() => setTouchMode(active => !active)}>{touchMode ? "Done" : "Rotate model"}</button></div>
        <div className="vessel-viewer-control-group" role="group" aria-label="Rotate">
          <button type="button" disabled={!ready} aria-label={`Rotate ${name} left`} title="Rotate left" onClick={() => turn(-Math.PI / 8)}>←</button>
          <button type="button" disabled={!ready} aria-label={`Rotate ${name} right`} title="Rotate right" onClick={() => turn(Math.PI / 8)}>→</button>
          <button type="button" disabled={!ready} aria-label={`Tilt ${name} up`} title="Tilt up" onClick={() => turn(0, -Math.PI / 8)}>↑</button>
          <button type="button" disabled={!ready} aria-label={`Tilt ${name} down`} title="Tilt down" onClick={() => turn(0, Math.PI / 8)}>↓</button>
        </div>
        <div className="vessel-viewer-control-group" role="group" aria-label="Zoom">
          <button type="button" disabled={!ready} aria-label={`Zoom out ${name}`} title="Zoom out" onClick={() => controller.current?.zoom(-1)}>−</button>
          <button type="button" disabled={!ready} aria-label={`Zoom in ${name}`} title="Zoom in" onClick={() => controller.current?.zoom(1)}>+</button>
        </div>
        <button type="button" className="vessel-viewer-reset" disabled={!ready} onClick={() => { controller.current?.reset(); setTouchMode(false); }}>Reset view</button>
      </div>
      <p className="vessel-viewer-help" id={helpId}>{coarse ? "Use Rotate model for free touch rotation. Tap Done to continue scrolling." : "Drag in any direction to explore. Keyboard: arrows rotate, Q/E roll, +/− zoom, Home resets."}</p>
      <noscript><p className="vessel-viewer-help">Enable JavaScript to rotate this 3D model.</p><img className="vessel-viewer-noscript" src={`/space-journey/interactive-vessels/${vessel}-preview.webp`} alt={`Rendered preview of ${name}`} /></noscript>
    </figure>
  );
}
