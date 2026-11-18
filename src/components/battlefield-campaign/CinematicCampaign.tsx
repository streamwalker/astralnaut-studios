import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Play, RotateCcw } from "lucide-react";

export const CINEMATIC_ASSETS = "/battlefield-atlantis/cinematic";

export function CinematicCampaign({ campaignUrl, onPlay }: { campaignUrl: string; onPlay: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const hardware = navigator as Navigator & { deviceMemory?: number };
    const update = () => setAvailable(query.matches && !connection?.saveData && (hardware.deviceMemory ?? 8) >= 4);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!available || !motionEnabled || !root.current) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const element = root.current;
    // This boundary keeps Three, GSAP, Lenis, models and decoders off mobile's request path.
    import("./cinematic-runtime").then(({ mountCinematic }) => {
      if (!disposed) cleanup = mountCinematic(element);
    }).catch(() => { element.dataset.motion = "fallback"; });
    return () => { disposed = true; cleanup?.(); };
  }, [available, motionEnabled]);

  return (
    <div className="ba-cinematic" ref={root}>
      <section className="ba-cinematic__hero" aria-labelledby="campaign-title">
        <div className="ba-cinematic__grid" aria-hidden="true" />
        <div className="ba-cinematic__orbit ba-cinematic__orbit--one" aria-hidden="true" />
        <div className="ba-cinematic__orbit ba-cinematic__orbit--two" aria-hidden="true" />
        <div className="ba-cinematic__topline"><span><i /> A world on the edge</span><span>Astralnaut Studios × Real World Comics</span></div>
        <div className="ba-cinematic__hero-copy">
          <p className="ba-cinematic__kicker">The Battlefield Atlantis campaign</p>
          <h1 id="campaign-title" tabIndex={-1}>BATTLEFIELD<br /><span>ATLANTIS.</span></h1>
          <p className="ba-cinematic__intro">A world worth fighting for.<br />Only one will rule.</p>
          <div className="ba-cinematic__actions">
            <a className="ba-cinematic__cta" href={campaignUrl} target="_blank" rel="noopener noreferrer">Explore the campaign <ArrowUpRight size={18} aria-hidden /></a>
            <button className="ba-cinematic__film" onClick={onPlay} type="button"><span><Play size={13} aria-hidden /></span> Enter the world</button>
          </div>
        </div>
        <div className="ba-cinematic__visual" data-scene="hero" role="img" aria-label="Battlefield Atlantis cover, featuring Orion, Zeus and Astra defending Atlantis">
          <img className="ba-cinematic__fallback" src={`${CINEMATIC_ASSETS}/edition-fallback.webp`} width={1000} height={1200} alt="" fetchPriority="high" decoding="async" />
          <div className="ba-cinematic__canvas" aria-hidden="true" />
        </div>
        <div className="ba-cinematic__artifact-label"><span>THE ALLIES</span><small>Orion / Zeus / Astra</small></div>
        <div className="ba-cinematic__hero-bottom">
          <a href="#edition-showcase" className="ba-cinematic__scroll"><span><ArrowDown size={17} aria-hidden /></span> Scroll to discover</a>
          <p>One world.<br /><strong>Extraordinary defenders.</strong></p>
          {available && <button className="ba-cinematic__motion" type="button" aria-pressed={motionEnabled} onClick={() => setMotionEnabled(!motionEnabled)}>{motionEnabled ? "Motion on" : "Motion off"}<span aria-hidden>{motionEnabled ? "◉" : "○"}</span></button>}
        </div>
      </section>

      <section className="ba-cinematic__manifesto" aria-labelledby="conflict-title">
        <span className="ba-cinematic__kicker">01 / Enter the conflict</span>
        <h2 id="conflict-title" data-reveal>THE WORLD IS<br /><em>WORTH THE FIGHT.</em></h2>
        <div className="ba-cinematic__manifesto-footer"><span aria-hidden>✦</span><p>Step beyond the cover. Meet the allies, explore their evolving armor, and discover the world of Battlefield Atlantis.</p><Link to="/reader/$series/$issue" params={{ series: "battlefield-atlantis", issue: "1" }}>Read the first issue <ArrowUpRight size={18} aria-hidden /></Link></div>
      </section>

      <section id="edition-showcase" className="ba-cinematic__showcase" aria-labelledby="edition-title">
        <div className="ba-cinematic__showcase-top"><span className="ba-cinematic__kicker">02 / The cover, in focus</span><a href="#transmedium-suits">Skip to the allies <ArrowDown size={14} aria-hidden /></a></div>
        <div className="ba-cinematic__showcase-copy"><h2 id="edition-title">A WORLD<br />WITH<br /> <em>DEPTH.</em></h2><p>Get closer to the artwork.<br />Then meet the heroes behind it.</p></div>
        <div className="ba-cinematic__visual ba-cinematic__visual--showcase" data-scene="showcase" role="img" aria-label="Rotating three-dimensional presentation of the Battlefield Atlantis cover">
          <img className="ba-cinematic__fallback" src={`${CINEMATIC_ASSETS}/edition-fallback.webp`} width={1000} height={1200} alt="" loading="lazy" decoding="async" />
          <div className="ba-cinematic__canvas" aria-hidden="true" />
        </div>
        <aside className="ba-cinematic__glass"><span className="ba-cinematic__kicker">Battlefield Atlantis</span><h3>The Allies</h3><p>Zeus. Astra. Orion.<br />One shared stand for Atlantis.</p><Link to="/battlefield-atlantis">Explore the series <ArrowUpRight size={16} aria-hidden /></Link></aside>
        <div className="ba-cinematic__showcase-bottom"><span className="ba-cinematic__rotation"><RotateCcw size={14} aria-hidden /> <span data-rotation-label>Cover study</span></span><div className="ba-cinematic__progress" aria-hidden="true"><span /></div><span>Art by Astralnaut Studios</span></div>
      </section>
    </div>
  );
}
