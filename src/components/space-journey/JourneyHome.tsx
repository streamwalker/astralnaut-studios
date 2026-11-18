import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { listSeries, getMilestone, getSiteCopy } from "@/lib/public.functions";
import { useSubscriberCount } from "@/hooks/useSubscriberCount";
import { MilestoneStrip } from "@/components/milestone-strip";
import { HomePricingStrip } from "@/components/home/PricingStrip";
import { HeroRotator } from "@/components/home/HeroRotator";
import { logoFor } from "@/lib/series-logos";
import { pageUrl } from "@/lib/storage";
import { VesselViewer } from "./VesselViewer";

const chapters = [
  ["departure", "Departure"],
  ["nebula", "The story"],
  ["slate", "The slate"],
  ["world", "Your world"],
  ["invitation", "The invitation"],
];
const pillars = [
  [
    "Motion + sound",
    "Per-page CSS animations layered onto the static art. Lightning pulses, hologram glow, debris fields.",
  ],
  [
    "Tier-staggered drops",
    "Patron Tuesday. Initiate Wednesday. Reader Thursday. Always 48 hours ahead at the top tier.",
  ],
  [
    "Canon voting",
    "Subscribers vote on canon-altering decisions. Your read literally changes the story.",
  ],
  [
    "Sweepstakes + cameos",
    "Sweepstakes windows open every 10,000-subscriber milestone (14-day entry window). Free entry always available. Patron tier unlocks cameo eligibility.",
  ],
];
export function JourneyHome() {
  const seriesFn = useServerFn(listSeries),
    milestoneFn = useServerFn(getMilestone),
    copyFn = useServerFn(getSiteCopy);
  const { data: series = [] } = useQuery({ queryKey: ["series"], queryFn: () => seriesFn({}) });
  const { data: milestone } = useQuery({ queryKey: ["milestone"], queryFn: () => milestoneFn({}) });
  const { data: copy = {} } = useQuery({ queryKey: ["copy"], queryFn: () => copyFn({}) });
  const { displayCount, pagesPublished, seriesLive } = useSubscriberCount();
  const [active, setActive] = useState("departure");
  const [transmissionsOpen, setTransmissionsOpen] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -40% 0px" },
    );
    document.querySelectorAll("[data-chapter]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <SiteHeader />
      <nav className="journey-dots" aria-label="Journey chapters">
        {chapters.map(([id, label], i) => (
          <a
            key={id}
            href={`#${id}`}
            aria-label={label}
            aria-current={active === id ? "step" : undefined}
          >
            <span>
              0{i + 1} / {label}
            </span>
            <i />
          </a>
        ))}
      </nav>
      <main className="space-journey">
        <section id="departure" data-chapter className="flight-section flight-hero">
          <div className="flight-copy">
            <span className="space-eyebrow">Independent worlds. Extraordinary stories.</span>
            <h1 className="hero-wordmark">
              ASTRALNAUT<span>STUDIOS</span>
            </h1>
            <p className="hero-tagline">
              {copy["home.hero.title"] ?? "The next page only drops here."}
            </p>
            <div className="flight-actions">
              <Link
                to="/reader/$series/$issue"
                params={{ series: "battlefield-atlantis", issue: "1" }}
                className="space-button"
              >
                Read the first act free <span aria-hidden>↗</span>
              </Link>
              <a href="#slate" className="space-text-link">
                Explore the slate <span aria-hidden>→</span>
              </a>
            </div>
          </div>
          <a className="scroll-invitation" href="#nebula">
            <span>Scroll to explore</span>
            <i aria-hidden>↓</i>
          </a>
          <span className="hero-coordinate" aria-hidden>
            TRANSMISSION 001 / THE NERRIAN GALAXY
          </span>
        </section>
        <section id="nebula" data-chapter className="flight-section">
          <div className="flight-copy story-copy">
            <span className="space-eyebrow">01 / Beyond the familiar</span>
            <h2>
              The world before
              <br />
              <em>our world began.</em>
            </h2>
            <p>
              Meet the heroes of old who paved the way for our world today. The First Act is Free.
            </p>
            <p className="space-secondary">
              {copy["home.hero.eyebrow"] ?? "New episodes every week · Netflix for comics"}
            </p>
            <p className="space-secondary">
              Five new pages a week. Motion-enhanced art. Creator commentary. Subscriber-only votes
              that change the canon. Real prizes for real readers —{" "}
              <span>PlayStation 5 unlocks at 1,000 subscribers.</span>
            </p>
            <div className="flight-stats">
              <div>
                <strong>{pagesPublished}</strong>
                <span>Pages published</span>
              </div>
              <div>
                <strong>{seriesLive}</strong>
                <span>Series live</span>
              </div>
              <div>
                <strong>5</strong>
                <span>New pages / week</span>
              </div>
              {displayCount !== null && (
                <div>
                  <strong>{displayCount}</strong>
                  <span>Subscribers</span>
                </div>
              )}
            </div>
            <p className="space-caption">
              9.5 pages of every issue · free
              <br />
              The full first act + title page · free for everyone · no signup required.
            </p>
            <Link to="/pricing" className="space-text-link">
              {copy["home.cta.secondary"] ?? "See pricing"} <span aria-hidden>↗</span>
            </Link>
          </div>
        </section>
        <section id="slate" data-chapter className="flight-section slate-section">
          <VesselViewer vessel="santee" />
          <div className="flight-copy">
            <div className="chapter-heading">
              <div>
                <span className="space-eyebrow">02 / The slate · Real World Comics</span>
                <h2>
                  Three worlds.
                  <br />
                  <em>One way in.</em>
                </h2>
              </div>
              <p>Three properties · One disclosure-era universe</p>
            </div>
            <div className="holographic-slate">
              {series.map((s, i) => (
                <a
                  href={`/${s.slug}`}
                  key={s.id}
                  className="holo-panel"
                  onPointerMove={(e) => {
                    if (
                      e.pointerType === "touch" ||
                      matchMedia("(prefers-reduced-motion:reduce)").matches
                    )
                      return;
                    const r = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--tilt-x",
                      `${-(e.clientY - r.top - r.height / 2) / 70}deg`,
                    );
                    e.currentTarget.style.setProperty(
                      "--tilt-y",
                      `${(e.clientX - r.left - r.width / 2) / 60}deg`,
                    );
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.setProperty("--tilt-x", "0deg");
                    e.currentTarget.style.setProperty("--tilt-y", "0deg");
                  }}
                >
                  <span className="slate-index">
                    0{i + 1} / {s.genre}
                  </span>
                  <div className="slate-art">
                    {s.cover_path && (
                      <img
                        src={pageUrl(s.cover_path) ?? undefined}
                        alt=""
                        loading="lazy"
                        className="slate-cover"
                      />
                    )}
                    <img src={logoFor(s.slug)} alt={s.name} loading="lazy" className="slate-logo" />
                  </div>
                  <h3>{s.name}</h3>
                  <p>{s.logline}</p>
                  <span className="slate-link">
                    {s.status === "active" ? "Read first act free" : (s.launch_label ?? "Preview")}{" "}
                    <span aria-hidden>↗</span>
                  </span>
                </a>
              ))}
            </div>
            {series.length === 0 && (
              <div className="holographic-slate">
                {[
                  ["battlefield-atlantis", "Battlefield Atlantis"],
                  ["children-of-aquarius", "Children of Aquarius"],
                  ["darker-ages", "Darker Ages"],
                ].map(([slug, name]) => (
                  <a className="holo-panel" href={`/${slug}`} key={slug}>
                    <img src={logoFor(slug)} alt={name} />
                    <h3>{name}</h3>
                    <span>Explore series ↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
        <section id="world" data-chapter className="flight-section world-section">
          <div className="cinematic-clearance" aria-hidden="true"><span>CONSTERYA MINOR / FLEET IN TRANSIT</span></div>
          <div className="flight-copy">
            <span className="space-eyebrow">03 / Consterya Minor</span>
            <h2>
              A world to discover.
              <br />
              <em>A story to belong to.</em>
            </h2>
            <p className="world-caption">The lost world history would later call Atlantis.</p>
            <HomePricingStrip interval="monthly" />
          </div>
        </section>
        <section id="invitation" data-chapter className="flight-section invitation-section">
          <VesselViewer vessel="ryuken" />
          <div className="flight-copy">
            <span className="space-eyebrow">04 / You are cleared for arrival</span>
            <h2>
              The next page
              <br />
              <em>is waiting.</em>
            </h2>
            <p className="invitation-line">Issue #1 is live. Read free.</p>
            <p>Read the first act free — no card required. Subscribe when you're hooked.</p>
            <div className="flight-actions">
              <Link
                to="/reader/$series/$issue"
                params={{ series: "battlefield-atlantis", issue: "1" }}
                className="space-button"
              >
                Read the first act free <span aria-hidden>↗</span>
              </Link>
              <Link to="/pricing" className="space-text-link">
                See all plans <span aria-hidden>↗</span>
              </Link>
            </div>
            <p className="space-caption">Start now · Cancel anytime</p>
            <div className="journey-benefits">
              <div className="space-eyebrow">Why subscribe / Pirated PNGs can't give you this.</div>
              {pillars.map(([title, body], i) => (
                <details key={title}>
                  <summary>
                    <span>0{i + 1}</span>
                    {title}
                    <i aria-hidden>+</i>
                  </summary>
                  <p>{body}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <figure className="bridge-panorama"><img src="/space-journey/reference-art/bridge.webp" alt="The Ryuken battle bridge crew with the fleet visible beyond the observation windows" loading="lazy" width="1536" height="1024" /><figcaption>ABOARD THE RYUKEN</figcaption></figure>
        <section className="journey-transmissions" aria-label="Trailers and announcements">
          <details onToggle={(event) => setTransmissionsOpen(event.currentTarget.open)}>
            <summary>
              Watch the transmissions <span aria-hidden>↗</span>
            </summary>
            <HeroRotator enabled={transmissionsOpen} />
          </details>
          {milestone && (
            <MilestoneStrip
              name={milestone.name}
              ends_at={milestone.ends_at}
              rewards={(milestone.rewards as { at: number; reward: string }[]) ?? []}
            />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
