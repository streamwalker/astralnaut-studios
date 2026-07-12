import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyStanding, type UserStanding } from "@/lib/standing.functions";
import { track } from "@/lib/analytics";

interface Props {
  hasActiveSub: boolean;
  onManage: () => void;
  portalLoading: boolean;
}

/**
 * "Your standing" widget. Shows accumulated sweepstakes entries + weeks active,
 * and replaces the bare "Manage subscription" button with a flow that
 * honestly states what will be lost on cancellation BEFORE handing off to
 * the Stripe billing portal.
 *
 * The real Cancel button still lives in the portal — clearly available in
 * one click, no dark patterns.
 */
export function StandingAndCancelFlow({ hasActiveSub, onManage, portalLoading }: Props) {
  const fn = useServerFn(getMyStanding);
  const [standing, setStanding] = useState<UserStanding | null>(null);
  const [showLoss, setShowLoss] = useState(false);

  useEffect(() => {
    if (!hasActiveSub) return;
    let cancelled = false;
    fn().then((d) => { if (!cancelled) setStanding(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, [hasActiveSub, fn]);

  const entries = standing?.raffleEntries ?? 0;
  const weeks = standing?.weeksActive ?? 0;
  const campaign = standing?.campaignName ?? "Atlantis Rising";

  return (
    <>
      {hasActiveSub && (
        <div className="mt-6 rounded-md border border-[var(--border-line)] bg-black/20 p-4">
          <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">
            Your standing
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StandingStat label="Weeks active" value={weeks.toLocaleString()} />
            <StandingStat label="Campaign" value={campaign} />
            <StandingStat label="Sweepstakes entry" value={entries > 0 ? "1 / period" : "—"} accent="var(--neon)" />
          </div>
          <p className="mt-3 text-xs text-[var(--ink2)]">
            Every entrant — paid or free — gets exactly one entry per sweepstakes period. Tier does not affect odds.
          </p>
        </div>
      )}

      <button
        onClick={() => {
          if (hasActiveSub) {
            track("cancel_flow_started");
            setShowLoss(true);
          } else {
            onManage();
          }
        }}
        disabled={portalLoading}
        className="btn-cta mt-6"
      >
        {portalLoading ? "Opening…" : "⚡ Manage subscription"}
      </button>

      {showLoss && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-loss-headline"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoss(false); }}
        >
          <div className="card-rwc w-full max-w-lg p-6 md:p-8">
            <div className="eyebrow" style={{ color: "var(--gold)" }}>Before you go</div>
            <h3 id="cancel-loss-headline" className="mt-2 text-2xl font-black">
              Cancelling forfeits {entries.toLocaleString()} sweepstakes entries.
            </h3>
            <p className="mt-3 text-sm text-[var(--ink2)]">
              You've accumulated <span className="font-bold text-[var(--neon)]">{entries.toLocaleString()}</span> entries
              toward <span className="font-semibold">{campaign}</span> over{" "}
              <span className="font-bold text-[var(--ink)]">{weeks}</span> active week{weeks === 1 ? "" : "s"}.
              Cancellation removes them all and ends your canon-vote eligibility.
            </p>

            <div className="mt-5 space-y-2 rounded-md border border-[var(--border-line)] bg-black/30 p-4 text-sm">
              <div className="font-bold uppercase tracking-[2px] text-[10px] text-[var(--mute)]">
                Lighter options
              </div>
              <ul className="mt-2 space-y-2 text-xs text-[var(--ink2)]">
                <li>
                  <span className="font-semibold text-[var(--ink)]">Downgrade to Reader</span> · keep access at the
                  lowest tier so your entries keep accruing.
                </li>
                <li>
                  <span className="font-semibold text-[var(--ink)]">Pause for one cycle</span> · take a break without
                  forfeiting your standing.
                </li>
              </ul>
              <p className="mt-2 text-[11px] text-[var(--mute)]">
                Both are available in the billing portal alongside the Cancel button.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowLoss(false)}
                className="btn-ghost"
              >
                Keep my subscription
              </button>
              <button
                onClick={() => {
                  track("cancel_downgrade_chosen", { destination: "portal" });
                  setShowLoss(false);
                  onManage();
                }}
                className="btn-cta"
              >
                Continue to manage / cancel →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StandingStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--mute)]">{label}</div>
      <div className="mt-1 font-mono text-lg font-black" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
