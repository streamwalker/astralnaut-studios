import { useEffect, useLayoutEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { readLS, writeLS } from "@/lib/useLocalStorage";

export type TourStep = {
  /** data-tour attribute on the target element. */
  target?: string;
  title: string;
  body: string;
  /** Preferred placement. */
  placement?: "top" | "bottom" | "left" | "right" | "center";
};

export type TourDefinition = {
  id: string;
  /** Pathname prefix where this tour auto-runs. */
  pathPrefix: string;
  steps: TourStep[];
};

const TOURS: TourDefinition[] = [
  {
    id: "home",
    pathPrefix: "/",
    steps: [
      {
        title: "Welcome to Astralnaut Studios",
        body: "This quick tour will show you around in under a minute. Use ← → to navigate or Esc to skip.",
        placement: "center",
      },
      {
        target: "nav-library",
        title: "The Library",
        body: "Every series lives here. Click a cover to dive in.",
        placement: "bottom",
      },
      {
        target: "nav-reader",
        title: "The Reader",
        body: "Open the in-browser reader to read issues with keyboard shortcuts and fullscreen.",
        placement: "bottom",
      },
      {
        target: "nav-pricing",
        title: "Pricing & tiers",
        body: "Reader, Initiate, Patron. Pick monthly or annual — annual saves ~2 months.",
        placement: "bottom",
      },
      {
        target: "nav-account",
        title: "Your account",
        body: "Subscription status, billing portal, and shipping address (for Patrons).",
        placement: "bottom",
      },
      {
        target: "nav-help",
        title: "Help & training",
        body: "Anytime you're stuck, the Help Center has answers and a full training course.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "admin",
    pathPrefix: "/admin",
    steps: [
      {
        title: "Admin Mode",
        body: "You're operating live. This 60-second tour shows the main admin surfaces.",
        placement: "center",
      },
      {
        target: "admin-pages",
        title: "Pages & content",
        body: "Edit copy, swap covers, and manage the surfaces of your site.",
        placement: "right",
      },
      {
        target: "nav-help",
        title: "Admin Help Center",
        body: "All operational guides live under /admin/help. Take the admin training course too.",
        placement: "bottom",
      },
    ],
  },
];

function getRect(target?: string) {
  if (!target || typeof document === "undefined") return null;
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

export function TourOverlay() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [tour, setTour] = useState<TourDefinition | null>(null);
  const [step, setStep] = useState(0);
  const [, force] = useState(0);

  // Auto-launch tour if not seen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Find the most specific tour matching this path
    const candidate = [...TOURS]
      .sort((a, b) => b.pathPrefix.length - a.pathPrefix.length)
      .find((t) => {
        if (t.pathPrefix === "/") return pathname === "/";
        return pathname.startsWith(t.pathPrefix);
      });
    if (!candidate) {
      setTour(null);
      return;
    }
    const done = readLS<boolean>(`tour:${candidate.id}:done`, false);
    if (!done) {
      setTour(candidate);
      setStep(0);
    }
  }, [pathname]);

  // Reposition on resize/scroll
  useLayoutEffect(() => {
    if (!tour) return;
    const onResize = () => force((n) => n + 1);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [tour]);

  // Keyboard
  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, tour.steps.length - 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!tour) return null;
  const current = tour.steps[step];
  const rect = getRect(current.target);
  const isCenter = !rect || current.placement === "center";

  const finish = () => {
    if (tour) writeLS(`tour:${tour.id}:done`, true);
    setTour(null);
  };
  const nextOrFinish = () => {
    if (step >= tour.steps.length - 1) finish();
    else setStep(step + 1);
  };

  const cardStyle: React.CSSProperties = isCenter
    ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    : (() => {
        const padding = 12;
        const cardW = 340;
        const cardH = 200;
        if (current.placement === "right" && rect) {
          return { top: rect.y, left: Math.min(window.innerWidth - cardW - 8, rect.x + rect.w + padding) };
        }
        if (current.placement === "left" && rect) {
          return { top: rect.y, left: Math.max(8, rect.x - cardW - padding) };
        }
        if (current.placement === "top" && rect) {
          return { top: Math.max(8, rect.y - cardH - padding), left: Math.max(8, rect.x) };
        }
        // bottom default
        if (rect) {
          return {
            top: Math.min(window.innerHeight - cardH - 8, rect.y + rect.h + padding),
            left: Math.max(8, Math.min(window.innerWidth - cardW - 8, rect.x)),
          };
        }
        return {};
      })();

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {/* Backdrop with optional spotlight */}
      <svg className="pointer-events-auto absolute inset-0 h-full w-full" onClick={finish}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && !isCenter && (
              <rect
                x={rect.x - 8}
                y={rect.y - 8}
                width={rect.w + 16}
                height={rect.h + 16}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#tour-mask)" />
        {rect && !isCenter && (
          <rect
            x={rect.x - 8}
            y={rect.y - 8}
            width={rect.w + 16}
            height={rect.h + 16}
            rx={8}
            fill="none"
            stroke="var(--neon)"
            strokeWidth="2"
            style={{ filter: "drop-shadow(0 0 12px var(--neon))" }}
          />
        )}
      </svg>

      <div
        className="pointer-events-auto absolute w-[340px] rounded-xl border border-[var(--neon)] bg-[rgba(2,0,12,0.96)] p-5 shadow-2xl"
        style={cardStyle}
      >
        <button
          onClick={finish}
          aria-label="Skip tour"
          className="absolute right-3 top-3 text-[var(--ink2)] hover:text-[var(--neon)]"
        >
          <X width={16} height={16} />
        </button>
        <div className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--gold)]">
          Step {step + 1} of {tour.steps.length}
        </div>
        <h3 className="mt-1 text-lg font-extrabold text-[var(--ink)]">{current.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">{current.body}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {tour.steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-4 rounded-full transition-colors ${
                  i === step ? "bg-[var(--neon)]" : "bg-white/20"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="rounded px-2 py-1 text-xs font-semibold text-[var(--ink2)] hover:text-[var(--neon)] disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={nextOrFinish}
              className="rounded-md bg-[var(--neon)] px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-black"
            >
              {step >= tour.steps.length - 1 ? "Finish" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
