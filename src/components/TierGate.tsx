import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import {
  type Feature,
  FEATURE_MIN_TIER,
  TIER_LABEL,
} from "@/lib/tier";

type Props = {
  feature: Feature;
  /** Optional human label shown in the locked state. */
  title?: string;
  /**
   * Custom locked-state renderer. Receives the required tier name.
   * Defaults to a card-style upgrade prompt with a /pricing CTA.
   */
  fallback?: (requiredTier: string) => React.ReactNode;
  children: React.ReactNode;
};

/**
 * Gate UI behind a subscription feature. Renders `children` when the
 * current user's tier grants access, otherwise renders an upgrade prompt.
 * Server-side data still needs its own RLS / function-level checks — this
 * component is for UX only.
 */
export function TierGate({ feature, title, fallback, children }: Props) {
  const sub = useSubscription();
  if (sub.isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border-line)] bg-black/20 p-6 text-sm text-[var(--mute)]">
        Checking access…
      </div>
    );
  }
  if (sub.has(feature)) return <>{children}</>;

  const requiredTierKey = FEATURE_MIN_TIER[feature];
  const requiredLabel = TIER_LABEL[requiredTierKey];

  if (fallback) return <>{fallback(requiredLabel)}</>;

  return (
    <div className="rounded-xl border border-[var(--border-line)] bg-gradient-to-br from-black/40 to-transparent p-6">
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(34,211,255,0.08)", border: "1px solid var(--border-line)" }}
        >
          <Lock width={16} height={16} className="text-[var(--gold)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--gold)]">
            {requiredLabel} tier required
          </div>
          <h3 className="mt-1 text-lg font-extrabold text-[var(--ink)]">
            {title ?? "Subscribers-only feature"}
          </h3>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            {sub.tier === "none"
              ? `Subscribe to ${requiredLabel} or higher to unlock this.`
              : `Your ${TIER_LABEL[sub.tier]} plan doesn't include this. Upgrade to ${requiredLabel} to unlock.`}
          </p>
          <Link to="/pricing" className="btn-cta mt-4 inline-flex text-sm">
            {sub.tier === "none" ? "See plans" : "Upgrade plan"}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Compact inline pill that surfaces the user's current tier. */
export function TierBadge() {
  const sub = useSubscription();
  if (sub.isLoading || sub.tier === "none") return null;
  return (
    <span
      title={
        sub.inGracePeriod && sub.currentPeriodEnd
          ? `Access ends ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
          : `${TIER_LABEL[sub.tier]} subscriber`
      }
      className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2px] sm:inline-flex"
      style={{
        color: "var(--ink)",
        border: "1px solid var(--border-line)",
        background: "rgba(34,211,255,0.06)",
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          background:
            sub.tier === "patron"
              ? "var(--plasma)"
              : sub.tier === "initiate"
                ? "var(--neon)"
                : "var(--ink2)",
        }}
      />
      {TIER_LABEL[sub.tier]}
      {sub.inGracePeriod && <span className="ml-1 opacity-70">· ending</span>}
    </span>
  );
}
