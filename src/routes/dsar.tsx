import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useState } from "react";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";
import { submitDsarRequest } from "@/lib/dsar.functions";

const D = LEGAL_CONFIG.documents.privacy;

export const Route = createFileRoute("/dsar")({
  head: () => metaFor({
    title: "Your Privacy Rights — Streamwalkers Corporation",
    description: "Submit an access, correction, deletion, portability, opt-out, or appeal request under GDPR, CCPA/CPRA, and other US state privacy laws.",
    path: "/dsar",
  }),
  component: DsarPage,
});

const TYPES = [
  { v: "access",             label: "Access — give me a copy of my data" },
  { v: "correct",            label: "Correct — fix inaccurate data" },
  { v: "delete",             label: "Delete — erase my data" },
  { v: "portability",        label: "Portability — export my data" },
  { v: "opt_out_sale",       label: "Opt out of sale / sharing of my personal information" },
  { v: "opt_out_profiling",  label: "Opt out of profiling / targeted advertising" },
  { v: "appeal",             label: "Appeal a prior privacy-request decision" },
  { v: "other",              label: "Other" },
] as const;

const REGIONS = [
  "California (CCPA/CPRA)",
  "Other US state",
  "EU / EEA (GDPR)",
  "United Kingdom (UK GDPR)",
  "Other / not listed",
];

function DsarPage() {
  const submit = useServerFn(submitDsarRequest);
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    requestType: "access" as (typeof TYPES)[number]["v"],
    requesterEmail: "",
    region: REGIONS[0],
    details: "",
    authorizedAgent: false,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrorMsg(null);
    try {
      const res = await submit({ data: form });
      setReference(res.referenceId);
      setState("done");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again or email " + LEGAL_CONFIG.contacts.privacy + ".");
    }
  }

  return (
    <LegalPage
      title="Your Privacy Rights"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/dsar"
    >
      <p>Under GDPR, UK GDPR, CCPA/CPRA, and comparable US state laws, you may request access, correction, deletion, portability, restriction, opt-out of sale/sharing/profiling, withdrawal of consent, or an appeal of a prior decision. See section 9 of our <a href="/privacy" className="underline">Privacy Policy</a>.</p>
      <p>We may need to verify your identity before completing your request. We do not unlawfully discriminate against people for exercising these rights.</p>

      {state === "done" && reference ? (
        <div className="mt-6 rounded-lg border border-[var(--border-line)] bg-black/30 p-5">
          <p className="text-[var(--ink)] font-semibold">We received your request.</p>
          <p className="mt-2 text-sm">Reference ID: <code className="rounded bg-white/10 px-2 py-1">{reference}</code></p>
          <p className="mt-2 text-sm">If your email is deliverable, you will receive a confirmation at the address you provided. We may reach out to verify your identity before completing the request.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="What are you requesting?">
            <select
              className="w-full rounded border border-[var(--border-line)] bg-black/40 p-2 text-sm"
              value={form.requestType}
              onChange={(e) => setForm({ ...form, requestType: e.target.value as typeof form.requestType })}
              required
            >
              {TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </Field>

          <Field label="Your email">
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full rounded border border-[var(--border-line)] bg-black/40 p-2 text-sm"
              value={form.requesterEmail}
              onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })}
            />
          </Field>

          <Field label="Your region">
            <select
              className="w-full rounded border border-[var(--border-line)] bg-black/40 p-2 text-sm"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
            >
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          <Field label="Additional details (optional)">
            <textarea
              rows={4}
              maxLength={4000}
              className="w-full rounded border border-[var(--border-line)] bg-black/40 p-2 text-sm"
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              placeholder="Do not include sensitive government identifiers here."
            />
          </Field>

          <label className="flex items-start gap-3 text-sm text-[var(--mute)]">
            <input
              type="checkbox"
              checked={form.authorizedAgent}
              onChange={(e) => setForm({ ...form, authorizedAgent: e.target.checked })}
              className="mt-1"
            />
            <span>I am submitting this request as an authorized agent on behalf of a data subject. (I understand additional verification may be required.)</span>
          </label>

          {errorMsg ? <p className="text-sm text-red-400">{errorMsg}</p> : null}

          <button
            type="submit"
            disabled={state === "submitting"}
            className="rounded bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {state === "submitting" ? "Submitting..." : "Submit privacy request"}
          </button>
          <p className="text-xs text-[var(--fg-muted)]">Or email {LEGAL_CONFIG.contacts.privacy}.</p>
        </form>
      )}
    </LegalPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">{label}</span>
      {children}
    </label>
  );
}
