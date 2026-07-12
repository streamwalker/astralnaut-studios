import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { reportContent } from "@/lib/moderation.functions";
import { LEGAL_CONFIG } from "@/config/legal";

type Kind = "letter" | "letter_comment" | "profile" | "other";

const REASONS: Array<{ v: string; label: string }> = [
  { v: "harassment", label: "Harassment or bullying" },
  { v: "hate_speech", label: "Hate speech" },
  { v: "sexual_exploitation", label: "Sexual exploitation or minor safety" },
  { v: "doxing", label: "Doxing / private information" },
  { v: "impersonation", label: "Impersonation" },
  { v: "spam", label: "Spam" },
  { v: "malware", label: "Malware or phishing link" },
  { v: "piracy_or_unauthorized_copies", label: "Piracy / unauthorized copies" },
  { v: "infringement", label: "Copyright or trademark infringement" },
  { v: "self_harm", label: "Self-harm or suicide" },
  { v: "other", label: "Other" },
];

/**
 * Renders a small "Report" button that opens an inline form. Signed-in only —
 * unauthenticated users see a prompt to sign in.
 */
export function ReportButton({ contentKind, contentRef, className }: { contentKind: Kind; contentRef: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const submit = useServerFn(reportContent);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setMsg(null);
    try {
      await submit({ data: { contentKind, contentRef, reason: reason as never, details: details || null } });
      setState("done");
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "Report failed. Please try again.");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "text-xs text-[var(--mute)] underline hover:text-[var(--neon)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--neon)]"}
        aria-label="Report this content"
      >
        Report
      </button>
    );
  }

  if (state === "done") {
    return (
      <div className="mt-2 rounded border border-[var(--border-line)] bg-black/40 p-3 text-xs">
        <p>Thanks — we&apos;ve logged your report. Our team will review it.</p>
        <p className="mt-1 text-[var(--mute)]">If you also want to appeal a decision, email {LEGAL_CONFIG.contacts.support}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 rounded border border-[var(--border-line)] bg-black/40 p-3 text-xs">
      <label className="block">
        <span className="mb-1 block font-semibold uppercase tracking-wider">Reason</span>
        <select
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded border border-[var(--border-line)] bg-black/60 p-1"
        >
          <option value="">Choose a reason…</option>
          {REASONS.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block font-semibold uppercase tracking-wider">Details (optional)</span>
        <textarea
          rows={3}
          maxLength={2000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full rounded border border-[var(--border-line)] bg-black/60 p-1"
        />
      </label>
      {msg && <p className="text-red-300">{msg}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={state === "submitting" || !reason}
          className="rounded bg-[var(--gold)] px-3 py-1 font-semibold text-black disabled:opacity-50"
        >
          {state === "submitting" ? "Sending…" : "Submit report"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border border-[var(--border-line)] px-3 py-1">Cancel</button>
      </div>
    </form>
  );
}
