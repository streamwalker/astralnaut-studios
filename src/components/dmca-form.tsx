import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitDmcaNotice } from "@/lib/dmca.functions";

type Kind = "notice" | "counter";

/**
 * Structured DMCA notice / counter-notice form.
 *
 * Reference: 17 U.S.C. §512(c)(3) (notice) and §512(g)(3) (counter-notice).
 * We collect the required elements and persist them via submitDmcaNotice.
 * The Designated Agent line stays "Registration in progress" until the
 * legal team publishes it — this form does not claim safe-harbor status.
 */
export function DmcaForm() {
  const [kind, setKind] = useState<Kind>("notice");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const submit = useServerFn(submitDmcaNotice);

  const [f, setF] = useState({
    complainantName: "",
    complainantEmail: "",
    complainantAddress: "",
    complainantPhone: "",
    workIdentified: "",
    locationUrl: "",
    signature: "",
    goodFaithStatement: false,
    accuracyStatement: false,
    consentToJurisdiction: false,
  });

  const canSubmit =
    f.complainantName.length >= 2 &&
    /\S+@\S+\.\S+/.test(f.complainantEmail) &&
    f.workIdentified.length >= 5 &&
    /^https?:\/\//i.test(f.locationUrl) &&
    f.signature.length >= 2 &&
    f.goodFaithStatement &&
    f.accuracyStatement &&
    (kind === "notice" || f.consentToJurisdiction);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || state === "submitting") return;
    setState("submitting");
    setMsg(null);
    try {
      const payload =
        kind === "notice"
          ? {
              kind: "notice" as const,
              complainantName: f.complainantName,
              complainantEmail: f.complainantEmail,
              complainantAddress: f.complainantAddress || null,
              complainantPhone: f.complainantPhone || null,
              workIdentified: f.workIdentified,
              locationUrl: f.locationUrl,
              goodFaithStatement: true as const,
              accuracyStatement: true as const,
              signature: f.signature,
            }
          : {
              kind: "counter" as const,
              complainantName: f.complainantName,
              complainantEmail: f.complainantEmail,
              complainantAddress: f.complainantAddress || null,
              complainantPhone: f.complainantPhone || null,
              workIdentified: f.workIdentified,
              locationUrl: f.locationUrl,
              goodFaithStatement: true as const,
              accuracyStatement: true as const,
              consentToJurisdiction: true as const,
              signature: f.signature,
            };
      const r = await submit({ data: payload });
      setReference(r.referenceId);
      setState("done");
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "Submission failed.");
    }
  }

  if (state === "done" && reference) {
    return (
      <div className="mt-6 rounded-lg border border-[var(--border-line)] bg-black/30 p-5">
        <p className="font-semibold text-[var(--ink)]">Received.</p>
        <p className="mt-2 text-sm">Reference: <code className="rounded bg-white/10 px-2 py-1">{reference}</code></p>
        <p className="mt-2 text-sm">Our legal team will review your submission. False notices may result in liability under 17 U.S.C. §512(f).</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-lg border border-[var(--border-line)] bg-black/20 p-5">
      <fieldset className="flex flex-wrap gap-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider">Submission type</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="dmca-kind" checked={kind === "notice"} onChange={() => setKind("notice")} />
          <span>Notice of claimed infringement</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="dmca-kind" checked={kind === "counter"} onChange={() => setKind("counter")} />
          <span>Counter-notice</span>
        </label>
      </fieldset>

      <F label="Your legal name"><input required className={inp} value={f.complainantName} onChange={(e) => setF({ ...f, complainantName: e.target.value })} /></F>
      <F label="Email"><input required type="email" autoComplete="email" className={inp} value={f.complainantEmail} onChange={(e) => setF({ ...f, complainantEmail: e.target.value })} /></F>
      <F label="Mailing address (recommended)"><textarea rows={2} className={inp} value={f.complainantAddress} onChange={(e) => setF({ ...f, complainantAddress: e.target.value })} /></F>
      <F label="Phone (recommended)"><input className={inp} value={f.complainantPhone} onChange={(e) => setF({ ...f, complainantPhone: e.target.value })} /></F>
      <F label="Identify the copyrighted work (or the material subject to the counter-notice)">
        <textarea required rows={4} maxLength={4000} className={inp} value={f.workIdentified} onChange={(e) => setF({ ...f, workIdentified: e.target.value })} />
      </F>
      <F label="URL where the material is located on this site">
        <input required type="url" placeholder="https://astralnautstudios.com/..." className={inp} value={f.locationUrl} onChange={(e) => setF({ ...f, locationUrl: e.target.value })} />
      </F>

      <label className="flex items-start gap-2 text-sm">
        <input required type="checkbox" checked={f.goodFaithStatement} onChange={(e) => setF({ ...f, goodFaithStatement: e.target.checked })} className="mt-1" />
        <span>
          {kind === "notice"
            ? "I have a good-faith belief that the use of the material described above is not authorized by the copyright owner, its agent, or the law."
            : "I have a good-faith belief that the material was removed or disabled as a result of mistake or misidentification."}
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input required type="checkbox" checked={f.accuracyStatement} onChange={(e) => setF({ ...f, accuracyStatement: e.target.checked })} className="mt-1" />
        <span>I state under penalty of perjury that the information in this submission is accurate{kind === "notice" ? ", and I am the owner or authorized to act on behalf of the owner of the exclusive right allegedly infringed" : ""}.</span>
      </label>
      {kind === "counter" && (
        <label className="flex items-start gap-2 text-sm">
          <input required type="checkbox" checked={f.consentToJurisdiction} onChange={(e) => setF({ ...f, consentToJurisdiction: e.target.checked })} className="mt-1" />
          <span>I consent to the jurisdiction of the U.S. Federal District Court for the judicial district in which my address is located (or, if outside the U.S., any judicial district in which the service provider may be found), and I will accept service of process from the person who provided the original notice or an agent of that person.</span>
        </label>
      )}

      <F label="Electronic signature (type your full name)">
        <input required className={inp} value={f.signature} onChange={(e) => setF({ ...f, signature: e.target.value })} />
      </F>

      {msg && <p className="text-sm text-red-300">{msg}</p>}
      <button
        type="submit"
        disabled={!canSubmit || state === "submitting"}
        className="rounded bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {state === "submitting" ? "Submitting…" : kind === "notice" ? "Submit notice" : "Submit counter-notice"}
      </button>
    </form>
  );
}

const inp = "w-full rounded border border-[var(--border-line)] bg-black/40 p-2 text-sm";

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">{label}</span>
      {children}
    </label>
  );
}
