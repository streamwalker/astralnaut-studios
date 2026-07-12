import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { useSubscription } from "@/hooks/useSubscription";
import {
  type Feature,
  type Tier,
  FEATURE_MIN_TIER,
  TIER_LABEL,
  earlyAccessHours,
  hasFeature,
} from "@/lib/tier";

export const Route = createFileRoute("/perks")({
  head: () => ({
    meta: [
      { title: "Your perks — Real World Comics" },
      {
        name: "description",
        content:
          "See exactly which features your subscription tier unlocks — forum, canon voting, sweepstakes, early access, Patron print and Discord.",
      },
      { property: "og:title", content: "Your subscriber perks" },
      { property: "og:description", content: "Tier-by-tier feature access." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PerksPage,
});

type PerkRow = {
  feature: Feature;
  title: string;
  description: string;
};

const PERKS: PerkRow[] = [
  { feature: "forum", title: "Forum access", description: "Post and reply in the community forum." },
  { feature: "canon_voting", title: "Canon voting", description: "Cast votes that shape canonical story decisions." },
  { feature: "raffle_auto_entries", title: "Automatic sweepstakes entry", description: "When the platform crosses each 10,000-subscriber milestone, every paid tier is eligible for automatic entry into the 14-day sweepstakes window. Free (AMOE) entrants can match the same maximum — purchase does not increase odds." },
  { feature: "motion_comic", title: "Motion-comic reader", description: "Animated panel-by-panel reading mode." },
  { feature: "early_access_24h", title: "24-hour early access", description: "Read new pages a full day before Reader tier." },
  { feature: "numbered_variants", title: "Numbered digital variants", description: "Collectible digital variant covers, numbered to you." },
  { feature: "bts_process", title: "Behind-the-scenes process", description: "Script pages, layouts, ink stages, and creator commentary." },
  { feature: "early_access_48h", title: "48-hour early access", description: "Read new pages two full days before Reader tier." },
  { feature: "cameo_eligibility", title: "Cameo — editorial consideration", description: "Eligibility for editorial consideration only. Patron cameo access is not a guaranteed appearance and is never randomly awarded. Every accepted cameo requires a signed and verified appearance release before it can enter production. Adults 18+ only — submit at /cameo/submit." },
  { feature: "signed_print_run", title: "Quarterly signed print", description: "A signed, physical print run shipped each quarter." },
  { feature: "creator_discord", title: "Creator Discord", description: "Direct access to the creators' private Discord channels. Adults 18+ only — visit /community/join to attest your age before an invite is issued." },
];

function PerksPage() {
  const sub = useSubscription();
  const tier: Tier = sub.tier;

  const granted = PERKS.filter((p) => hasFeature(tier, p.feature));
  const locked = PERKS.filter((p) => !hasFeature(tier, p.feature));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="eyebrow">Your perks</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          {tier === "none"
            ? "You're on the free tier."
            : `Welcome, ${TIER_LABEL[tier]}.`}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink2)]">
          {tier === "none"
            ? "Subscribe to unlock the forum, canon voting, milestone sweepstakes eligibility, and early access to every issue."
            : `Here's what your ${TIER_LABEL[tier]} plan includes right now${
                sub.inGracePeriod && sub.currentPeriodEnd
                  ? ` — access until ${new Date(sub.currentPeriodEnd).toLocaleDateString()}.`
                  : "."
              }`}
        </p>

        {tier !== "none" && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Sweepstakes eligibility" value="Milestone" />
            <Stat
              label="Early access"
              value={earlyAccessHours(tier) > 0 ? `${earlyAccessHours(tier)}h ahead` : "On release"}
            />
            <Stat label="Status" value={sub.inGracePeriod ? "Ending soon" : "Active"} />
          </div>
        )}

        {tier === "none" ? (
          <div className="mt-10 rounded-2xl border border-[var(--neon)] bg-gradient-to-br from-[rgba(34,211,255,0.08)] to-transparent p-8 text-center">
            <h2 className="text-2xl font-extrabold text-[var(--ink)]">Choose a tier to unlock features</h2>
            <p className="mt-2 text-[var(--ink2)]">Reader, Initiate, or Patron — cancel anytime.</p>
            <Link to="/pricing" className="btn-cta mt-5 inline-flex">See plans</Link>
          </div>
        ) : (
          <section className="mt-10">
            <h2 className="text-xs font-bold uppercase tracking-[3px] text-[var(--neon)]">
              Unlocked · {granted.length}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {granted.map((p) => (
                <li
                  key={p.feature}
                  className="flex items-start gap-3 rounded-xl border border-[var(--border-line)] bg-black/20 p-4"
                >
                  <Check width={18} height={18} className="mt-0.5 shrink-0 text-[var(--neon)]" />
                  <div>
                    <div className="text-sm font-bold text-[var(--ink)]">{p.title}</div>
                    <div className="mt-0.5 text-xs text-[var(--ink2)]">{p.description}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tier !== "none" && hasFeature(tier, "creator_discord") && (
          <div className="mt-8 rounded-xl border border-[var(--neon)] bg-black/30 p-5">
            <div className="text-sm font-bold text-[var(--ink)]">Community / Discord access</div>
            <p className="mt-1 text-xs text-[var(--ink2)]">
              Adults 18+ only. Verify your age to receive your Discord invite.
            </p>
            <Link to="/community/join" className="btn-cta mt-3 inline-flex">
              Verify age & join
            </Link>
          </div>
        )}

        {tier !== "none" && hasFeature(tier, "cameo_eligibility") && (
          <div className="mt-6 rounded-xl border border-[var(--plasma)] bg-black/30 p-5">
            <div className="text-sm font-bold text-[var(--ink)]">Cameo submission</div>
            <p className="mt-1 text-xs text-[var(--ink2)]">
              Adults 18+ only. Submit your age attestation and likeness release to enter the cameo pool for upcoming issues.
            </p>
            <Link to="/cameo/submit" className="btn-cta mt-3 inline-flex">
              Submit a cameo
            </Link>
          </div>
        )}


        {locked.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-bold uppercase tracking-[3px] text-[var(--gold)]">
              Locked · {locked.length} · upgrade to unlock
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {locked.map((p) => {
                const requiredTier = FEATURE_MIN_TIER[p.feature];
                return (
                  <li
                    key={p.feature}
                    className="flex items-start gap-3 rounded-xl border border-dashed border-[var(--border-line)] p-4 opacity-90"
                  >
                    <Lock width={18} height={18} className="mt-0.5 shrink-0 text-[var(--gold)]" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[var(--ink2)]">{p.title}</span>
                        <span className="rounded-full border border-[var(--gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">
                          {TIER_LABEL[requiredTier]}+
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--mute)]">{p.description}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/pricing" className="btn-cta">
                {tier === "none" ? "See plans" : "Upgrade plan"}
              </Link>
              {tier !== "none" && (
                <Link to="/account" className="btn-ghost">
                  Manage subscription
                </Link>
              )}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-line)] bg-black/20 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--mute)]">{label}</div>
      <div className="mt-1 font-mono text-2xl font-black text-[var(--ink)]">{value}</div>
    </div>
  );
}
