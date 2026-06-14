import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitLead } from "@/lib/leads.functions";
import { track } from "@/lib/analytics";

interface Props {
  seriesSlug: string;
  lastPage: number;
  onDismiss: () => void;
  onPlans: () => void;
}

/**
 * Soft email-capture interstitial shown at the end of the free first act,
 * BEFORE the subscribe wall. Free pages stay ungated; this is dismissible.
 */
export function LeadCaptureInterstitial({ seriesSlug, lastPage, onDismiss, onPlans }: Props) {
  const submit = useServerFn(submitLead);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  if (state === "done") {
    return (
      <div className="card-rwc mx-auto my-8 max-w-xl p-6 text-center">
        <div className="eyebrow" style={{ color: "var(--neon)" }}>You're on the list</div>
        <h3 className="mt-2 text-2xl font-black">Check your inbox.</h3>
        <p className="mt-3 text-sm text-[var(--ink2)]">
          We just sent a confirmation link. Click it and we'll notify you the second the next pages drop.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={onPlans} className="btn-ghost">See plans →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-rwc mx-auto my-8 max-w-xl p-6 md:p-8" role="region" aria-labelledby="lead-capture-headline">
      <div className="eyebrow" style={{ color: "var(--neon)" }}>You hit the end of the free act</div>
      <h3 id="lead-capture-headline" className="mt-2 text-2xl font-black md:text-3xl">
        Want to know the second the next pages drop?
      </h3>
      <p className="mt-3 text-sm text-[var(--ink2)]">
        Weekly drop alerts. No spam. Unsubscribe anytime.
      </p>

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!email) return;
          setState("submitting");
          setErr(null);
          try {
            await submit({ data: { email, source: "free_act_wall", series_slug: seriesSlug, last_page: lastPage } });
            track("lead_capture_submitted", { source: "free_act_wall", series_slug: seriesSlug, last_page: lastPage });
            setState("done");
          } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong.");
            setState("error");
          }
        }}
      >
        <label htmlFor="lead-email" className="sr-only">Email</label>
        <input
          id="lead-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border-line)] bg-black/30 px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:border-[var(--neon)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          className="btn-cta justify-center whitespace-nowrap"
        >
          {state === "submitting" ? "Saving…" : "Notify me — it's free."}
        </button>
      </form>
      {err && <p className="mt-2 text-xs" style={{ color: "var(--plasma)" }}>{err}</p>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--mute)]">
        <button
          type="button"
          onClick={() => {
            track("lead_capture_dismissed", { source: "free_act_wall", series_slug: seriesSlug });
            onDismiss();
          }}
          className="underline hover:text-[var(--ink2)]"
        >
          No thanks
        </button>
        <button
          type="button"
          onClick={() => {
            track("lead_capture_dismissed", { source: "free_act_wall", series_slug: seriesSlug, dest: "pricing" });
            onPlans();
          }}
          className="underline hover:text-[var(--neon)]"
        >
          Show me plans →
        </button>
      </div>
    </div>
  );
}
