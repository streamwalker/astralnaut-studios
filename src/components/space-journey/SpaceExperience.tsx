import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import mark from "@/assets/astralnaut-studios-logo.png";
const navigation = [
  ["The journey", "/"],
  ["The studio", "/astralnaut-studios"],
  ["Battlefield Atlantis", "/battlefield-atlantis"],
  ["Children of Aquarius", "/children-of-aquarius"],
  ["Darker Ages", "/darker-ages"],
  ["Membership", "/pricing"],
  ["Shop", "/shop"],
  ["For industry", "/industry"],
];
export function JourneyMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="journey-menu-button" aria-label="Open navigation">
          Menu <span aria-hidden>☰</span>
        </button>
      </DialogTrigger>
      <DialogContent className="journey-menu" data-lenis-prevent>
        <DialogTitle>Explore Astralnaut</DialogTitle>
        <DialogDescription>Stories from the world before our world began.</DialogDescription>
        <nav aria-label="Explore Astralnaut Studios">
          {navigation.map(([label, url], i) => (
            <a key={url} href={url} onClick={() => setOpen(false)}>
              <small>0{i + 1}</small>
              {label}
              <span aria-hidden>↗</span>
            </a>
          ))}
        </nav>
        <div className="journey-menu-secondary">
          <a href="/reader/battlefield-atlantis/1">Read free</a>
          <a href="/account">Your account</a>
          <a href="/perks">Your perks</a>
          <a href="/help">Help & training</a>
          <a href="/login">Sign in</a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function SpaceExperience() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const host = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const home = path === "/";
  const operational =
    /^\/(reader|admin|account|archive|login|complete-profile|verify-email|checkout|cart)(\/|$)/.test(
      path,
    );
  const ownScene = path.startsWith("/kickstarter/");
  useEffect(() => {
    document.documentElement.dataset.spacePage = home
      ? "home"
      : operational
        ? "utility"
        : "interior";
    return () => {
      delete document.documentElement.dataset.spacePage;
    };
  }, [path, home, operational]);
  useEffect(() => {
    if (operational || ownScene) return;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    let controller: AbortController | undefined;
    let clean: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let version = 0;
    const start = () => {
      version++;
      const current = version;
      controller?.abort();
      controller = new AbortController();
      const activeController = controller;
      clearTimeout(timer);
      clean?.();
      setPaused(false);
      setReduced(mq.matches);
      setReady(mq.matches);
      setProgress(0);
      if (mq.matches) return;
      timer = setTimeout(() => setReady(true), 12000);
      import("./runtime")
        .then(async ({ mountSpace }) => {
          if (activeController.signal.aborted || current !== version) return;
          clean = await mountSpace(
            host.current!,
            home,
            (value) => {
              if (current === version) setProgress(value);
            },
            () => {
              clearTimeout(timer);
              if (current === version) setReady(true);
            },
            activeController.signal,
            path,
          );
          if (current !== version) clean?.();
        })
        .catch(() => setReady(true));
    };
    start();
    mq.addEventListener("change", start);
    return () => {
      clearTimeout(timer);
      controller?.abort();
      clean?.();
      mq.removeEventListener("change", start);
    };
  }, [path, home, operational, ownScene]);
  if (operational || ownScene) return null;
  return (
    <>
      <div className="space-cursor" aria-hidden="true" />
      <div className="space-backdrop" aria-hidden="true">
        <div className="space-fallback" />
        <div className="space-canvas" ref={host} />
        <div className="space-vignette" />
      </div>
      {home && !ready && (
        <div className="space-loading" role="status" aria-live="polite">
          <img src={mark} alt="Astralnaut Studios" />
          <p>Preparing your journey</p>
          <progress max={100} value={progress} />
          <span>{progress}%</span>
          <button onClick={() => setReady(true)}>Continue to the stories</button>
        </div>
      )}
      {home && !reduced && (
        <button
          className="space-motion"
          aria-pressed={paused}
          onClick={() => {
            setPaused(!paused);
            window.dispatchEvent(new Event("space-toggle-motion"));
          }}
        >
          {paused ? "Resume ambient motion" : "Pause ambient motion"}
        </button>
      )}
    </>
  );
}
const arrivals: Record<string, [string, string, string]> = {
  "/battlefield-atlantis": ["01 / The Nerrian Galaxy", "Before our world.", "Battlefield Atlantis"],
  "/children-of-aquarius": ["02 / A new age", "The awakening.", "Children of Aquarius"],
  "/darker-ages": ["03 / Beyond the veil", "What was held back is loose.", "Darker Ages"],
  "/astralnaut-studios": ["The studio", "Worlds worth getting lost in.", "Astralnaut Studios"],
  "/pricing": ["Membership", "Your place in the universe.", "Read. Discover. Shape the canon."],
  "/perks": ["Beyond the page", "Become part of the story.", "Your membership. Your universe."],
  "/shop": ["The collection", "Bring the universe home.", "Astralnaut Studios shop"],
  "/industry": ["For industry", "Stories built to travel.", "Adaptation-ready original worlds"],
  "/help": ["Mission support", "Find your way.", "Help Center"],
  "/learn": ["The field guide", "Know your universe.", "Learn your way around Astralnaut"],
};
export function SubpageArrival({ path }: { path: string }) {
  const item = arrivals[path.replace(/\/$/, "")];
  if (!item) return null;
  return (
    <section className="subpage-arrival" aria-label={item[2]}>
      <span className="space-eyebrow">{item[0]}</span>
      <p className="arrival-title">{item[1]}</p>
      <p>{item[2]}</p>
      <a href="#page-content" className="space-text-link">
        Explore <span aria-hidden>↓</span>
      </a>
      <div className="arrival-orbit" aria-hidden />
    </section>
  );
}
