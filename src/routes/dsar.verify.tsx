import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LegalPage, metaFor } from "@/components/legal-page";
import { verifyDsarRequest } from "@/lib/dsar.functions";

type Status =
  | { kind: "checking" }
  | { kind: "verified"; alreadyVerified: boolean }
  | { kind: "invalid"; reason: string };

export const Route = createFileRoute("/dsar/verify")({
  head: () => metaFor({
    title: "Verify Privacy Request — Streamwalkers Corporation",
    description: "Confirm your identity to proceed with your privacy request.",
    path: "/dsar/verify",
  }),
  component: DsarVerifyPage,
  validateSearch: (s: Record<string, unknown>) => ({
    ref: typeof s.ref === "string" ? s.ref : "",
    token: typeof s.token === "string" ? s.token : "",
  }),
});

function DsarVerifyPage() {
  const { ref, token } = Route.useSearch();
  const verify = useServerFn(verifyDsarRequest);
  const [state, setState] = useState<Status>({ kind: "checking" });

  useEffect(() => {
    if (!ref || !token) {
      setState({ kind: "invalid", reason: "missing_params" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await verify({ data: { referenceId: ref, token } });
        if (cancelled) return;
        if (r.ok) setState({ kind: "verified", alreadyVerified: r.alreadyVerified === true });
        else setState({ kind: "invalid", reason: r.reason });
      } catch {
        if (!cancelled) setState({ kind: "invalid", reason: "error" });
      }
    })();
    return () => { cancelled = true; };
  }, [ref, token, verify]);

  return (
    <LegalPage title="Verify Privacy Request" eyebrow="Streamwalkers Corporation" canonical="/dsar/verify">
      {state.kind === "checking" && <p>Verifying…</p>}
      {state.kind === "verified" && (
        <div className="rounded-lg border border-[var(--border-line)] bg-black/30 p-5">
          <p className="font-semibold text-[var(--ink)]">
            {state.alreadyVerified ? "This request was already verified." : "Your request has been verified."}
          </p>
          <p className="mt-2 text-sm">
            Reference: <code className="rounded bg-white/10 px-2 py-1">{ref}</code>. Our privacy team will follow up at
            the email address on file within the timeframe required by applicable law.
          </p>
        </div>
      )}
      {state.kind === "invalid" && (
        <div className="rounded-lg border border-red-400/50 bg-red-950/20 p-5">
          <p className="font-semibold text-red-200">We couldn&apos;t verify this link.</p>
          <p className="mt-2 text-sm">
            {state.reason === "expired" && "The verification link has expired. Please submit a new privacy request."}
            {state.reason === "already_used" && "This link has already been used."}
            {state.reason === "not_found" && "We couldn't find a matching privacy request."}
            {state.reason === "invalid" && "The link is not valid."}
            {state.reason === "missing_params" && "The link is missing required parameters."}
            {state.reason === "error" && "Something went wrong. Please try again shortly."}
          </p>
          <p className="mt-2 text-sm">
            You can submit a new request at <a className="underline" href="/dsar">/dsar</a>.
          </p>
        </div>
      )}
    </LegalPage>
  );
}
