import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { track } from "@/lib/analytics";
import videoAsset from "@/assets/battlefield-atlantis-teaser.mp4.asset.json";
import posterAsset from "@/assets/battlefield-atlantis-teaser-poster.jpg.asset.json";
import baLogo from "@/assets/battlefield-atlantis-logo-clean.png";
import coaLogo from "@/assets/children-of-aquarius-logo-clean.png";
import daLogo from "@/assets/darker-ages-logo-clean.png";
import coaCover from "@/assets/coa-issue-1-cover.png";
import daCoverAsset from "@/assets/darker-ages-issue-1-cover.png.asset.json";
const daCover = daCoverAsset.url;

type CTA = { label: string; to: string; params?: Record<string, string> };

interface HeroSlot {
  id: string;
  tab: string;
  eyebrow: string;
  titleImage?: string;
  titleAlt?: string;
  titleText?: string;
  tagline: string;
  primary: CTA;
  secondary?: CTA;
  /** background art (image url) — ignored when video is set */
  backgroundImage?: string;
  /** background video url (used for slot 1) */
  backgroundVideo?: string;
  backgroundPoster?: string;
  /** override left-to-right legibility gradient */
  overlay?: string;
  /** optional accent for the active tab underline */
  accent?: string;
}

const HERO_SLOTS: HeroSlot[] = [
  {
    id: "battlefield-atlantis",
    tab: "Battlefield Atlantis",
    eyebrow: "Issue #1 is live · Read free",
    titleImage: baLogo,
    titleAlt: "Battlefield Atlantis",
    tagline: "The world before our world began. Meet the heroes of old who paved the way for our world today. The First Act is Free.",
    primary: { label: "Read the first act free", to: "/reader/$series/$issue", params: { series: "battlefield-atlantis", issue: "1" } },
    secondary: { label: "See the series", to: "/battlefield-atlantis" },
    backgroundVideo: videoAsset.url,
    backgroundPoster: posterAsset.url,
    accent: "#22d3ff",
  },
  {
    id: "darker-ages",
    tab: "Darker Ages",
    eyebrow: "Coming soon · Add to your library",
    titleImage: daLogo,
    titleAlt: "Darker Ages",
    tagline: "A medieval reckoning told through firelight, blood, and prophecy. Witness the world before the gods left.",
    primary: { label: "Enter the series", to: "/darker-ages" },
    secondary: { label: "See pricing", to: "/pricing" },
    backgroundImage: daCover,
    overlay:
      "linear-gradient(90deg, rgba(28,8,2,0.94) 0%, rgba(28,8,2,0.7) 40%, rgba(28,8,2,0.3) 80%, rgba(28,8,2,0.1) 100%)",
    accent: "#f97316",
  },
  {
    id: "children-of-aquarius",
    tab: "Children of Aquarius",
    eyebrow: "Cast · World · First look",
    titleImage: coaLogo,
    titleAlt: "Children of Aquarius",
    tagline: "Disclosure-era prophecy meets oceanic uprising. Meet the children before the world meets them.",
    primary: { label: "Meet the cast", to: "/children-of-aquarius" },
    secondary: { label: "See the slate", to: "/" },
    backgroundImage: coaCover,
    overlay:
      "linear-gradient(90deg, rgba(2,18,30,0.94) 0%, rgba(2,18,30,0.7) 40%, rgba(2,18,30,0.3) 80%, rgba(2,18,30,0.1) 100%)",
    accent: "#22d3ee",
  },
  {
    id: "ps5-milestone",
    tab: "PS5 Milestone",
    eyebrow: "Subscriber unlock · 1,000",
    titleText: "A PlayStation 5 unlocks at 1,000 subscribers.",
    tagline: "Every active subscription week earns raffle entries. Patron tier unlocks cameo eligibility.",
    primary: { label: "See the milestone", to: "/pricing" },
    secondary: { label: "Browse the slate", to: "/" },
    overlay:
      "radial-gradient(120% 80% at 20% 30%, rgba(160,64,255,0.45), transparent 60%), radial-gradient(120% 80% at 100% 100%, rgba(34,211,255,0.35), transparent 55%), linear-gradient(180deg, #02000c, #06051a)",
    accent: "#f4c95d",
  },
];

const DEFAULT_AUTOPLAY_MS = 15000;
const AUTOPLAY_STORAGE_KEY = "hero:autoplayMs";

function readAutoplayMs(): number {
  if (typeof window === "undefined") return DEFAULT_AUTOPLAY_MS;
  const raw = window.localStorage.getItem(AUTOPLAY_STORAGE_KEY);
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n < 1000) return DEFAULT_AUTOPLAY_MS;
  return n;
}

export function HeroRotator() {
  const [active, setActive] = useState(0);
  // hoverPaused (mouse/focus), userPaused (explicit toggle), hiddenPaused (tab hidden)
  const [hoverPaused, setHoverPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hiddenPaused, setHiddenPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoplayMs, setAutoplayMs] = useState<number>(DEFAULT_AUTOPLAY_MS);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Detect reduced motion (disables autoplay + video).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Read admin-configured autoplay duration from localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setAutoplayMs(readAutoplayMs());
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== AUTOPLAY_STORAGE_KEY) return;
      setAutoplayMs(readAutoplayMs());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Pause on tab-hidden.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => setHiddenPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const paused = hoverPaused || userPaused || hiddenPaused;

  // Autoplay.
  useEffect(() => {
    if (paused || reducedMotion) return;
    const t = window.setTimeout(() => {
      setActive((i) => (i + 1) % HERO_SLOTS.length);
    }, autoplayMs);
    return () => window.clearTimeout(t);
  }, [active, paused, reducedMotion, autoplayMs]);

  // Fire view event per slot.
  useEffect(() => {
    track("hero_slot_view", { slot: HERO_SLOTS[active]?.id });
  }, [active]);

  // Keyboard nav.
  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive((i) => (i + 1) % HERO_SLOTS.length);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((i) => (i - 1 + HERO_SLOTS.length) % HERO_SLOTS.length);
    }
  }, []);

  // Touch swipe.
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0]?.clientX ?? null; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
    if (Math.abs(dx) > 50) {
      setActive((i) => (i + (dx < 0 ? 1 : -1) + HERO_SLOTS.length) % HERO_SLOTS.length);
    }
    touchX.current = null;
  };

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Featured properties"
      className="relative w-full overflow-hidden min-h-[560px] md:min-h-[640px]"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setHoverPaused(true)}
      onBlur={() => setHoverPaused(false)}
      onKeyDown={onKey}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
    >
      {HERO_SLOTS.map((slot, i) => (
        <SlotPanel
          key={slot.id}
          slot={slot}
          isActive={i === active}
          allowVideo={!reducedMotion}
        />
      ))}

      {/* Content rendered over the active background. */}
      <div className="pointer-events-none relative z-20 mx-auto flex min-h-[560px] max-w-7xl items-center px-6 pb-20 pt-10 md:min-h-[640px] md:pb-24 md:pt-16">
        <div className="pointer-events-auto max-w-2xl">
          <SlotContent slot={HERO_SLOTS[active]!} />
        </div>
      </div>

      {/* Marvel-style tab strip. */}
      <div
        role="tablist"
        aria-label="Featured property tabs"
        className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 backdrop-blur-md"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.75))" }}
      >
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-3 py-2 sm:px-6 sm:py-3">
          {HERO_SLOTS.map((slot, i) => {
            const isActive = i === active;
            return (
              <button
                key={slot.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`hero-slot-${slot.id}`}
                onClick={() => setActive(i)}
                className="group relative shrink-0 px-3 py-2 text-left transition-colors sm:px-4"
              >
                <div
                  className={`text-[10px] font-black uppercase tracking-[2.5px] transition-colors ${
                    isActive ? "text-white" : "text-white/55 group-hover:text-white/90"
                  }`}
                >
                  {slot.tab}
                </div>
                <div
                  aria-hidden
                  className="absolute inset-x-3 top-0 h-[3px] origin-left transition-transform duration-300"
                  style={{
                    background: slot.accent ?? "#ed1d24",
                    transform: isActive ? "scaleX(1)" : "scaleX(0)",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SlotPanel({
  slot,
  isActive,
  allowVideo,
}: {
  slot: HeroSlot;
  isActive: boolean;
  allowVideo: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Only render the video element for the active slot to avoid pulling N videos in parallel.
  const renderVideo = isActive && allowVideo && !!slot.backgroundVideo;

  useEffect(() => {
    if (!renderVideo) return;
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.then === "function") {
      p.then(() => track("hero_video_played", { slot: slot.id }))
       .catch(() => track("hero_video_blocked", { slot: slot.id }));
    }
  }, [renderVideo, slot.id]);

  return (
    <div
      aria-hidden={!isActive}
      className={`absolute inset-0 transition-opacity duration-700 ${isActive ? "opacity-100" : "opacity-0"}`}
      style={{ pointerEvents: isActive ? "auto" : "none" }}
    >
      {/* Always paint the still image first so something is on screen instantly. */}
      {(slot.backgroundImage || slot.backgroundPoster) && (
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={slot.backgroundImage ?? slot.backgroundPoster}
          alt=""
          loading={isActive ? "eager" : "lazy"}
          fetchPriority={isActive ? "high" : "low"}
          aria-hidden
        />
      )}
      {renderVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={slot.backgroundVideo}
          poster={slot.backgroundPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
          aria-hidden
        />
      )}

      {/* Legibility overlay (left-darkening). */}
      <div
        className="absolute inset-0"
        style={{
          background:
            slot.overlay ??
            "linear-gradient(90deg, rgba(5,8,14,0.92) 0%, rgba(5,8,14,0.7) 40%, rgba(5,8,14,0.35) 75%, rgba(5,8,14,0.15) 100%)",
        }}
      />
      {/* Bottom fade into page background. */}
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{ background: "linear-gradient(180deg, transparent, var(--bg, #02000c))" }}
      />
    </div>
  );
}

function SlotContent({ slot }: { slot: HeroSlot }) {
  const [imgFailed, setImgFailed] = useState(false);

  // Reset failure flag if the slot's logo changes.
  useEffect(() => {
    setImgFailed(false);
  }, [slot.titleImage]);

  const showImage = !!slot.titleImage && !imgFailed;
  const fallbackTitle = slot.titleText ?? slot.titleAlt ?? "";

  return (
    <div id={`hero-slot-${slot.id}`} key={slot.id} className="animate-fade-in relative z-20">
      <div
        className="pointer-events-none select-none text-[11px] font-black uppercase tracking-[4px]"
        style={{ color: slot.accent ?? "var(--neon)" }}
      >
        {slot.eyebrow}
      </div>

      {showImage ? (
        <img
          src={slot.titleImage}
          alt={slot.titleAlt ?? ""}
          className="pointer-events-none select-none mt-5 h-auto w-full max-w-[440px] drop-shadow-[0_8px_30px_rgba(0,0,0,0.7)]"
          loading="eager"
          draggable={false}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <h1 className="pointer-events-none select-none mt-5 text-4xl font-black leading-[1.02] tracking-tight text-white md:text-6xl drop-shadow-[0_4px_18px_rgba(0,0,0,0.7)]">
          {fallbackTitle}
        </h1>
      )}

      <p className="pointer-events-none select-none mt-5 max-w-xl text-base text-white/85 md:text-lg">
        {slot.tagline}
      </p>

      <div className="pointer-events-auto relative z-20 mt-7 flex flex-wrap gap-3">
        <CtaButton cta={slot.primary} slot={slot.id} variant="marvel" />
        {slot.secondary && <CtaButton cta={slot.secondary} slot={slot.id} variant="ghost" />}
      </div>
    </div>
  );
}

function CtaButton({ cta, slot, variant }: { cta: CTA; slot: string; variant: "marvel" | "ghost" }) {
  const className = variant === "marvel" ? "btn-marvel" : "btn-hero-ghost";
  const onClick = () => track("hero_cta_click", { slot, target: cta.to });
  const children: ReactNode = (
    <>
      {cta.label}
      <span aria-hidden className="ml-2">→</span>
    </>
  );
  if (cta.params) {
    return (
      <Link
        to={cta.to as "/reader/$series/$issue"}
        params={cta.params as { series: string; issue: string }}
        className={className}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link to={cta.to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
