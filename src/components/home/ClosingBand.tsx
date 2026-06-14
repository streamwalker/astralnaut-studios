import { Link } from "@tanstack/react-router";
import { track } from "@/lib/analytics";

export function ClosingBand() {
  return (
    <section
      className="relative mx-auto my-16 max-w-7xl px-6 py-16 md:py-20"
      aria-labelledby="closing-band-headline"
    >
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-12 md:px-12 md:py-16"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, rgba(34,211,255,0.10), transparent 50%), radial-gradient(120% 80% at 100% 100%, rgba(139,92,246,0.12), transparent 50%), rgba(255,255,255,0.02)",
          border: "1px solid var(--border-line)",
        }}
      >
        <div className="text-center">
          <div className="eyebrow" style={{ color: "var(--neon)" }}>
            Start now · Cancel anytime
          </div>
          <h2
            id="closing-band-headline"
            className="mx-auto mt-3 max-w-3xl text-4xl font-black tracking-tight md:text-5xl"
          >
            The next page is waiting.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--ink2)]">
            Read the first act free — no card required. Subscribe when you're hooked.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/reader/$series/$issue"
              params={{ series: "battlefield-atlantis", issue: "1" }}
              className="btn-cta"
              onClick={() => track("closing_band_cta_click", { target: "free_read" })}
            >
              ▶ Read the first act free
            </Link>
            <Link
              to="/pricing"
              className="btn-ghost"
              onClick={() => track("closing_band_cta_click", { target: "pricing" })}
            >
              See all plans
            </Link>
          </div>

          <p className="mt-6 text-xs text-[var(--mute)]">
            Reader $4.99 · Initiate $9.99 · Patron $24.99 — cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
