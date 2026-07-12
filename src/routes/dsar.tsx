import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { LEGAL } from "@/lib/legal-meta";

export const Route = createFileRoute("/dsar")({
  head: () => ({
    meta: [
      { title: "Privacy Request — Real World Comics" },
      { name: "description", content: "Submit a privacy request: access, deletion, correction, portability, or opt-out of sale or sharing under GDPR, CCPA, and other US state privacy laws." },
      { property: "og:title", content: "Privacy Request — Real World Comics" },
      { property: "og:description", content: "Exercise your privacy rights with Streamwalkers Corporation." },
    ],
  }),
  component: DsarPage,
});

const REQUEST_TYPES = [
  { value: "access", label: "Access — give me a copy of my data" },
  { value: "delete", label: "Delete — erase my data" },
  { value: "correct", label: "Correct — fix inaccurate data" },
  { value: "portability", label: "Portability — export my data" },
  { value: "opt_out_sale", label: "Opt out of sale / sharing of my personal information" },
  { value: "opt_out_profiling", label: "Opt out of profiling / targeted advertising" },
  { value: "other", label: "Other" },
];

const REGIONS = [
  { value: "us_ca", label: "California (CCPA/CPRA)" },
  { value: "us_other", label: "Other US state" },
  { value: "eu", label: "EU / EEA (GDPR)" },
  { value: "uk", label: "United Kingdom (UK GDPR)" },
  { value: "other", label: "Other / not listed" },
];

function DsarPage() {
  const [state, setState] = useState<"idle" | "sent">("idle");
  const [form, setForm] = useState({
    email: "",
    requestType: "access",
    region: "us_ca",
    details: "",
    agent: false,
  });

  function buildMailto() {
    const subject = encodeURIComponent(`Privacy Request — ${form.requestType}`);
    const body = encodeURIComponent(
      `Request type: ${form.requestType}\n` +
      `Region: ${form.region}\n` +
      `Account email: ${form.email}\n` +
      `Submitting as authorized agent: ${form.agent ? "yes" : "no"}\n\n` +
      `Details:\n${form.details}\n`
    );
    return `mailto:${LEGAL.privacyEmail}?subject=${subject}&body=${body}`;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = buildMailto();
    setState("sent");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-black text-[var(--ink)] md:text-5xl">Privacy request</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--mute)]">
          Use this form to exercise your rights under the GDPR, the California Consumer Privacy Act, and other US state privacy laws. We will verify your identity (typically by confirming the email on file) and respond within the statutory window — 30 days under GDPR, 45 days under CCPA, extendable as permitted.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--mute)]">
          Submitting this form opens your email client with a pre-filled message to <a className="underline" href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>. If your mail client doesn't open, copy the contents and send the email manually.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 text-sm">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)]">Account email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-2 w-full rounded border border-[var(--border-line)] bg-transparent px-3 py-2 text-[var(--ink)]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)]">Request type</label>
            <select
              value={form.requestType}
              onChange={(e) => setForm({ ...form, requestType: e.target.value })}
              className="mt-2 w-full rounded border border-[var(--border-line)] bg-transparent px-3 py-2 text-[var(--ink)]"
            >
              {REQUEST_TYPES.map((r) => (
                <option key={r.value} value={r.value} className="bg-black">{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)]">Region</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="mt-2 w-full rounded border border-[var(--border-line)] bg-transparent px-3 py-2 text-[var(--ink)]"
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value} className="bg-black">{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)]">Details (optional)</label>
            <textarea
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              rows={5}
              className="mt-2 w-full rounded border border-[var(--border-line)] bg-transparent px-3 py-2 text-[var(--ink)]"
              placeholder="Anything specific you want us to know."
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--mute)]">
            <input
              type="checkbox"
              checked={form.agent}
              onChange={(e) => setForm({ ...form, agent: e.target.checked })}
            />
            I am submitting this on behalf of someone else as an authorized agent.
          </label>

          <button
            type="submit"
            className="rounded bg-[var(--neon,#22d3ee)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90"
          >
            Send privacy request
          </button>

          {state === "sent" && (
            <p className="text-xs text-[var(--mute)]">Your email client should have opened. If not, email us directly at <a className="underline" href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.</p>
          )}
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
