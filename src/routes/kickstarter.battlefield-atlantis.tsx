import { useState, type CSSProperties } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Download, Expand, Play, RotateCcw } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BattlefieldIntro } from "@/components/battlefield-campaign/BattlefieldIntro";
import campaignCss from "@/components/battlefield-campaign/campaign.css?url";
import introCss from "@/components/battlefield-campaign/intro-carousel.css?url";

const ASSETS = "/battlefield-atlantis/campaign-2026";
const PAGE_URL = "https://astralnautstudios.com/kickstarter/battlefield-atlantis";
const KICKSTARTER_URL = "https://www.kickstarter.com/projects/astralnautstudios/2052264283";
const DESCRIPTION = "Explore Battlefield Atlantis campaign artwork, the Zeus character dossier, and the four-stage adaptive transmedium suits of Zeus, Astra and Orion.";

const SCENES = [
  {
    label: "Lightning & water",
    src: `${ASSETS}/intro-01.webp`,
    original: `${ASSETS}/intro-01-full.png`,
    alt: "Zeus attacks from the foreground as a distant Poseidon shields himself with water cyclones above the battle for Atlantis.",
    note: "Zeus and Poseidon meet in a clash of lightning and water.",
  },
  {
    label: "Aboard the Ryuken",
    src: `${ASSETS}/intro-02.webp`,
    original: `${ASSETS}/intro-02-full.png`,
    alt: "The Ryuken crew at their battle bridge stations, with starships visible through the windows.",
    note: "The crew at their stations on the Ryuken battle bridge.",
  },
  {
    label: "Battle for Atlantis",
    src: `${ASSETS}/intro-03.webp`,
    original: `${ASSETS}/intro-03-full.png`,
    alt: "Astra holds a damaged ship aloft while Zeus and winged Orion fight Neptunian troops beneath Poseidon and the Leviathan.",
    note: "Astra, Zeus and Orion face a battle on every front.",
  },
];

const CHARACTERS = [
  { id: "zeus", name: "Zeus", accent: "#82dfff" },
  { id: "astra", name: "Astra", accent: "#c8a5ff" },
  { id: "orion", name: "Orion", accent: "#efbf75" },
] as const;

const STAGES = [
  { number: "01", name: "Modular Base", description: "The streamlined base configuration of the adaptive transmedium suit." },
  { number: "02", name: "Armor Deploying", description: "Armor develops over the base suit as its configuration adapts to the wearer." },
  { number: "03", name: "Full Armor", description: "The full armor configuration, with the NDF chest badge and shoulder seals visible." },
  { number: "04", name: "Reinforced Armor", description: "Thicker protection wraps the chest beneath the armpits and strengthens the thighs, knees and calves." },
] as const;

const ASTRA_STAGE_DETAILS = [
  "The streamlined base suit carries a subdued NDF chest shield and subdued seals on the outer shoulders.",
  "As the armor deploys, the shoulder seals become fully visible while the chest shield remains subdued.",
  "The full armor configuration carries fully visible NDF insignia: the chest shield and both shoulder seals.",
  "Reinforced protection wraps the chest and strengthens the thighs, knees and calves, with fully visible NDF insignia.",
] as const;

type Artwork = { src: string; original: string; title: string; alt: string };

export const Route = createFileRoute("/kickstarter/battlefield-atlantis")({
  head: () => ({
    meta: [
      { title: "Battlefield Atlantis — Campaign Companion | Astralnaut Studios" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Battlefield Atlantis — Campaign Companion" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: `https://astralnautstudios.com${ASSETS}/intro-03.webp` },
      { property: "og:image:alt", content: SCENES[2].alt },
      { property: "og:site_name", content: "Astralnaut Studios" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Battlefield Atlantis — Campaign Companion" },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: `https://astralnautstudios.com${ASSETS}/intro-03.webp` },
      { name: "twitter:image:alt", content: SCENES[2].alt },
    ],
    links: [
      { rel: "canonical", href: PAGE_URL },
      { rel: "stylesheet", href: campaignCss },
      { rel: "stylesheet", href: introCss },
      { rel: "preload", as: "image", href: SCENES[0].src, fetchpriority: "high" },
    ],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Battlefield Atlantis — Campaign Companion",
        description: DESCRIPTION,
        url: PAGE_URL,
        image: `https://astralnautstudios.com${ASSETS}/intro-03.webp`,
        publisher: { "@type": "Organization", name: "Astralnaut Studios" },
        about: { "@type": "CreativeWork", name: "Battlefield Atlantis", genre: "Science fiction" },
      }),
    }],
  }),
  component: CampaignPage,
});

function CampaignPage() {
  const [introOpen, setIntroOpen] = useState(true);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const character = CHARACTERS[characterIndex];
  const stage = STAGES[stageIndex];
  const suitSrc = `${ASSETS}/${character.id}-${stage.number}.webp`;
  const suitOriginal = `${ASSETS}/${character.id}-${stage.number}-full.png`;

  const closeIntro = () => {
    setIntroOpen(false);
    document.getElementById("campaign-title")?.focus({ preventScroll: true });
  };

  const openScene = (index: number) => {
    const scene = SCENES[index];
    setArtwork({ src: scene.src, original: scene.original, title: scene.label, alt: scene.alt });
  };

  return (
    <>
      <SiteHeader />
      <main className="ba-campaign">
        <section className="ba-campaign__hero ba-campaign__wrap" aria-labelledby="campaign-title">
          <div className="ba-campaign__eyebrow">Astralnaut Studios / Campaign companion</div>
          <div className="ba-campaign__hero-heading">
            <div>
              <h1 id="campaign-title" tabIndex={-1}>Battlefield<br /><span>Atlantis</span></h1>
              <p className="ba-campaign__tagline">Only one will rule.</p>
            </div>
            <div className="ba-campaign__hero-copy">
              <p>Step inside the world of Battlefield Atlantis through its campaign artwork, character dossier, and evolving transmedium suits.</p>
              <div className="ba-campaign__actions">
                <a href={KICKSTARTER_URL} target="_blank" rel="noopener noreferrer" className="ba-campaign__button ba-campaign__button--primary">View Kickstarter campaign <ArrowUpRight aria-hidden size={17} /></a>
                <Link to="/reader/$series/$issue" params={{ series: "battlefield-atlantis", issue: "1" }} className="ba-campaign__text-link">Read the first issue <ArrowUpRight aria-hidden size={16} /></Link>
              </div>
            </div>
          </div>

          <div className="ba-campaign__hero-art">
            <button type="button" onClick={() => openScene(2)} aria-label="Enlarge Battle for Atlantis artwork">
              <img src={SCENES[2].src} alt={SCENES[2].alt} width={1672} height={941} decoding="async" />
            </button>
            <button className="ba-campaign__replay" type="button" onClick={() => setIntroOpen(true)}><Play size={14} aria-hidden /> Replay intro</button>
          </div>

          <nav className="ba-campaign__section-nav" aria-label="Campaign companion sections">
            <a href="#transmedium-suits">Suit progressions <ArrowDown size={13} aria-hidden /></a>
            <a href="#zeus-dossier">Zeus dossier <ArrowDown size={13} aria-hidden /></a>
            <a href="#faction-insignia">Faction insignia <ArrowDown size={13} aria-hidden /></a>
            <a href="#campaign-artwork">Campaign artwork <ArrowDown size={13} aria-hidden /></a>
          </nav>
        </section>

        <section id="transmedium-suits" className="ba-campaign__section ba-campaign__wrap" aria-labelledby="suits-title">
          <div className="ba-campaign__section-heading">
            <div><div className="ba-campaign__eyebrow">01 / Suit studies</div><h2 id="suits-title">Built to adapt.</h2></div>
            <p>The modular transmedium suit builds on itself to meet the wearer’s needs. Explore four stages for Zeus, Astra and Orion, from the streamlined base to reinforced protection.</p>
          </div>

          <div className="ba-campaign__suit-lab" style={{ "--character-accent": character.accent } as CSSProperties}>
            <div className="ba-campaign__character-select" role="group" aria-label="Select a character">
              {CHARACTERS.map((item, index) => <button key={item.id} type="button" aria-pressed={characterIndex === index} onClick={() => setCharacterIndex(index)}><span className="ba-campaign__character-number">0{index + 1}</span>{item.name}<span className="ba-campaign__selected-dot" aria-hidden /></button>)}
            </div>

            <div className="ba-campaign__suit-body">
              <div className="ba-campaign__suit-image-wrap">
                <button className="ba-campaign__suit-image" type="button" aria-label={`Enlarge ${character.name}: ${stage.name}`} onClick={() => setArtwork({ src: suitSrc, original: suitOriginal, title: `${character.name} / ${stage.name}`, alt: `${character.name}'s transmedium suit at stage ${stage.number}: ${stage.name}.` })}>
                  <img src={suitSrc} alt={`${character.name}'s transmedium suit at stage ${stage.number}: ${stage.name}.`} decoding="async" />
                  <span className="ba-campaign__enlarge"><Expand size={15} aria-hidden /> Enlarge</span>
                </button>
              </div>
              <div className="ba-campaign__suit-detail">
                <div className="ba-campaign__eyebrow">Adaptive transmedium suit</div>
                <h3>{character.name}</h3>
                <p className="ba-campaign__stage-caption" aria-live="polite">Stage {stage.number} / {stage.name}</p>
                <p className="ba-campaign__stage-description">{character.id === "astra" ? ASTRA_STAGE_DETAILS[stageIndex] : stage.description}</p>
                <div className="ba-campaign__stage-select" role="group" aria-label="Select suit stage">
                  {STAGES.map((item, index) => <button key={item.number} type="button" aria-pressed={stageIndex === index} onClick={() => setStageIndex(index)}><span>{item.number}</span><span>{item.name}</span><span className="ba-campaign__stage-indicator" aria-hidden /></button>)}
                </div>
                <div className="ba-campaign__suit-links">
                  <a className="ba-campaign__text-link" href={suitOriginal} target="_blank" rel="noopener noreferrer">Full-resolution image <ArrowUpRight size={15} aria-hidden /></a>
                  <a className="ba-campaign__text-link" href={`${ASSETS}/${character.id}-progression.pdf`} target="_blank" rel="noopener noreferrer">{character.name} progression PDF <Download size={15} aria-hidden /></a>
                </div>
              </div>
            </div>
          </div>

          <div className="ba-campaign__pdfs" aria-label="All suit progression PDFs">
            <span>Keep the complete studies</span>
            {CHARACTERS.map(item => <a key={item.id} href={`${ASSETS}/${item.id}-progression.pdf`} target="_blank" rel="noopener noreferrer">{item.name} PDF <Download size={14} aria-hidden /></a>)}
          </div>
        </section>

        <section id="zeus-dossier" className="ba-campaign__section ba-campaign__wrap" aria-labelledby="dossier-title">
          <div className="ba-campaign__dossier">
            <div className="ba-campaign__dossier-copy">
              <div className="ba-campaign__eyebrow">02 / Character dossier</div>
              <h2 id="dossier-title">Meet Zeus.</h2>
              <p>Front, three-quarter, back and action studies of Zeus in his adaptive modular transmedium suit.</p>
              <a href={`${ASSETS}/zeus-dossier.pdf`} target="_blank" rel="noopener noreferrer" className="ba-campaign__button">Open Zeus dossier <ArrowUpRight size={17} aria-hidden /></a>
            </div>
            <button className="ba-campaign__dossier-art" type="button" aria-label="Enlarge Zeus character dossier" onClick={() => setArtwork({ src: `${ASSETS}/zeus-dossier.webp`, original: `${ASSETS}/zeus-dossier-full.png`, title: "Zeus / Character dossier", alt: "Zeus character dossier showing front, three-quarter, back and lightning action views." })}>
              <img src={`${ASSETS}/zeus-dossier.webp`} alt="Zeus character dossier showing front, three-quarter, back and lightning action views." loading="lazy" decoding="async" />
              <span className="ba-campaign__enlarge"><Expand size={15} aria-hidden /> Enlarge dossier</span>
            </button>
          </div>
        </section>

        <section id="faction-insignia" className="ba-campaign__section ba-campaign__wrap" aria-labelledby="insignia-title">
          <div className="ba-campaign__section-heading">
            <div><div className="ba-campaign__eyebrow">03 / Faction insignia</div><h2 id="insignia-title">NDF &amp; TPC</h2></div>
          </div>
          <div className="ba-campaign__insignia-stack">
            <figure className="ba-campaign__insignia ba-campaign__insignia--ndf">
              <img src={`${ASSETS}/ndf-seal.png`} alt="Nerrian Defense Force seal." width={898} height={772} loading="lazy" decoding="async" />
              <figcaption>Nerrian Defense Force</figcaption>
            </figure>
            <figure className="ba-campaign__insignia">
              <img src={`${ASSETS}/tpc-logo.png`} alt="Tri-Planetary Coalition identity board with its emblem, horizontal logo, monogram and badge." width={1254} height={1254} loading="lazy" decoding="async" />
              <figcaption>Tri-Planetary Coalition</figcaption>
            </figure>
          </div>
        </section>

        <section id="campaign-artwork" className="ba-campaign__section ba-campaign__wrap" aria-labelledby="artwork-title">
          <div className="ba-campaign__section-heading">
            <div><div className="ba-campaign__eyebrow">04 / Campaign artwork</div><h2 id="artwork-title">Inside the conflict.</h2></div>
            <button className="ba-campaign__text-link" type="button" onClick={() => setIntroOpen(true)}><RotateCcw size={15} aria-hidden /> Replay the montage</button>
          </div>
          <div className="ba-campaign__gallery">
            {SCENES.map((scene, index) => <article key={scene.label}>
              <button className="ba-campaign__gallery-art" type="button" onClick={() => openScene(index)} aria-label={`Enlarge ${scene.label}`}>
                <img src={scene.src} alt={scene.alt} loading="lazy" decoding="async" />
                <span className="ba-campaign__enlarge"><Expand size={15} aria-hidden /></span>
              </button>
              <div className="ba-campaign__gallery-caption"><span>0{index + 1}</span><div><h3>{scene.label}</h3><p>{scene.note}</p><a href={scene.original} target="_blank" rel="noopener noreferrer" className="ba-campaign__text-link">Full-resolution image <ArrowUpRight size={14} aria-hidden /></a></div></div>
            </article>)}
          </div>
        </section>

        <section className="ba-campaign__closing ba-campaign__wrap" aria-labelledby="campaign-cta-title">
          <div><div className="ba-campaign__eyebrow">Continue the story</div><h2 id="campaign-cta-title">The world is waiting.</h2></div>
          <div className="ba-campaign__actions">
            <a href={KICKSTARTER_URL} target="_blank" rel="noopener noreferrer" className="ba-campaign__button ba-campaign__button--primary">View Kickstarter campaign <ArrowUpRight size={17} aria-hidden /></a>
            <Link to="/battlefield-atlantis" className="ba-campaign__text-link">Explore the series <ArrowUpRight size={16} aria-hidden /></Link>
          </div>
        </section>
      </main>
      <SiteFooter />

      <Dialog open={artwork !== null} onOpenChange={open => { if (!open) setArtwork(null); }}>
        <DialogContent className="ba-campaign-lightbox">
          <DialogTitle>{artwork?.title}</DialogTitle>
          <DialogDescription className="sr-only">{artwork?.alt}</DialogDescription>
          {artwork && <>
            <img src={artwork.src} alt={artwork.alt} className="ba-campaign-lightbox__image" />
            <a href={artwork.original} target="_blank" rel="noopener noreferrer" className="ba-campaign-lightbox__link">Open full-resolution image<ArrowUpRight size={16} aria-hidden /></a>
          </>}
        </DialogContent>
      </Dialog>
      {introOpen && <BattlefieldIntro slides={SCENES} onComplete={closeIntro} />}
    </>
  );
}
