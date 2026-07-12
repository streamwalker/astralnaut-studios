import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG, isSweepstakesActivatable, isPlaceholder } from "@/config/legal";
import { submitFreeEntry } from "@/lib/sweepstakes.functions";

const D = LEGAL_CONFIG.documents.sweepstakes;

export const Route = createFileRoute("/sweepstakes/free-entry")({
  head: () =>
    metaFor({
      title: "Milestone Sweepstakes — Free Entry (AMOE) · Streamwalkers Corporation",
      description:
        "Free alternate method of entry (AMOE) for the Streamwalkers Corporation Milestone Sweepstakes. Opens only when an entry period is active.",
      path: "/sweepstakes/free-entry",
      noindex: true,
    }),
  component: FreeEntryPage,
});

type OpenPromotion = {
  id: string;
  name: string;
  prize_description: string;
  arv: string;
  drawing_rule: string;
  winner_process: string;
  rules_version: string;
  period_open_at: string | null;
};

function FreeEntryPage() {
  const configActivatable = isSweepstakesActivatable(LEGAL_CONFIG.sweepstakes.active);

  // Look up an actual open promotion row in the DB (public reads allowed for
  // non-draft rows). If none exists, the form does not render.
  const { data: openPromo } = useQuery({
    queryKey: ["sweepstakes", "open"],
    queryFn: async (): Promise<OpenPromotion | null> => {
      const { data } = await supabase
        .from("sweepstakes_promotions")
        .select("id,name,prize_description,arv,drawing_rule,winner_process,rules_version,period_open_at")
        .eq("status", "open")
        .order("period_open_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as OpenPromotion | null;
    },
  });

  // Fail-closed: refuse to render the form if the DB row still contains
  // bracketed placeholders, mirroring server-side enforcement.
  const dbActivatable = useMemo(() => {
    if (!openPromo) return false;
    return ![
      openPromo.name,
      openPromo.prize_description,
      openPromo.arv,
      openPromo.drawing_rule,
      openPromo.winner_process,
      openPromo.rules_version,
    ].some(isPlaceholder);
  }, [openPromo]);

  const canOpen = configActivatable && !!openPromo && dbActivatable;

  return (
    <LegalPage
      title="Free Entry (AMOE) — Milestone Sweepstakes"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/sweepstakes/free-entry"
      noindex
    >
      <div className="rounded-lg border border-[var(--border-line)] bg-black/30 p-5">
        <p className="text-[var(--ink)] font-semibold">
          {canOpen ? "An entry period is currently open." : "No entry period is currently open."}
        </p>
        <p className="mt-2 text-sm">
          The free-entry form is available only while a Milestone Sweepstakes entry period is
          open. Entry periods open when the platform reaches each new 10,000-subscriber
          milestone and close when the next milestone is reached.
        </p>
      </div>

      <h2>NO PURCHASE NECESSARY</h2>
      <p>
        NO PURCHASE NECESSARY. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING. Open to
        legal residents of the 50 United States and District of Columbia who are 18 or older.
        Void where prohibited. See{" "}
        <a href="/sweepstakes/rules" className="underline">
          Official Rules
        </a>
        .
      </p>

      <h2>Entry parity</h2>
      <p>
        {LEGAL_CONFIG.sweepstakes.entryCap} {LEGAL_CONFIG.sweepstakes.amoeParity}
      </p>

      {canOpen && openPromo ? (
        <FreeEntryForm promotionId={openPromo.id} promotionName={openPromo.name} />
      ) : (
        <>
          <h2>When we open</h2>
          <p>
            When an entry period opens, this page will publish a form that requires only the
            information necessary to administer the promotion and verify eligibility, in
            accordance with the Privacy Policy and Official Rules.
          </p>
          <p>Questions: {LEGAL_CONFIG.contacts.promotions}.</p>
        </>
      )}
    </LegalPage>
  );
}

function FreeEntryForm({ promotionId, promotionName }: { promotionId: string; promotionName: string }) {
  const submit = useServerFn(submitFreeEntry);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [attest, setAttest] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [status, setStatus] = useState<{
    kind: "idle" | "submitting" | "ok" | "already" | "error";
    message?: string;
  }>({ kind: "idle" });

  const canSubmit = attest && fullName.trim().length > 0 && /.+@.+\..+/.test(email);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || status.kind === "submitting") return;
    setStatus({ kind: "submitting" });
    try {
      const result = await submit({
        data: { promotionId, fullName: fullName.trim(), email: email.trim().toLowerCase(), attest18AndUS: true, marketingOptIn },
      });
      if ("error" in result && result.error) {
        setStatus({ kind: "error", message: result.error });
        return;
      }
      if (result.alreadyEntered) {
        setStatus({
          kind: "already",
          message:
            result.message ??
            "You are already entered for this milestone period. Additional submissions do not add a second entry.",
        });
      } else {
        setStatus({ kind: "ok", message: "Entry received. Good luck." });
      }
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Submission failed." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="not-prose mt-6 space-y-4 rounded-lg border border-[var(--border-line)] bg-black/30 p-5">
      <h2 className="text-lg font-bold text-[var(--ink)]">Submit a free entry — {promotionName}</h2>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--ink2)]">Full name</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-md border border-[var(--border-line)] bg-black/40 px-3 py-2 text-[var(--ink)]"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--ink2)]">Email address</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={320}
          className="w-full rounded-md border border-[var(--border-line)] bg-black/40 px-3 py-2 text-[var(--ink)]"
        />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={attest}
          onChange={(e) => setAttest(e.target.checked)}
          className="mt-1"
          required
        />
        <span>
          I attest that I am at least 18 years old and a legal resident of one of the 50 United
          States or the District of Columbia, and I have read the{" "}
          <a href="/sweepstakes/rules" className="underline">
            Official Rules
          </a>
          .
        </span>
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          className="mt-1"
        />
        <span>
          Optional: also send me occasional marketing email from Streamwalkers Corporation.
          Entry is <em>not</em> conditioned on this box, and unsubscribing is available at any
          time.
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit || status.kind === "submitting"}
        className="btn-cta inline-flex disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status.kind === "submitting" ? "Submitting…" : "Submit free entry"}
      </button>

      {status.kind === "ok" && (
        <p className="rounded-md border border-[var(--neon)] bg-black/40 p-3 text-sm text-[var(--ink)]">
          {status.message}
        </p>
      )}
      {status.kind === "already" && (
        <p className="rounded-md border border-[var(--border-line)] bg-black/40 p-3 text-sm text-[var(--ink2)]">
          {status.message}
        </p>
      )}
      {status.kind === "error" && (
        <p className="rounded-md border border-red-500/60 bg-red-500/10 p-3 text-sm text-red-200">
          {status.message}
        </p>
      )}
    </form>
  );
}
