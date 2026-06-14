import { Link } from "@tanstack/react-router";
import { pricingTiers, type PricingTier, ctaLabel, priceForInterval } from "@/config/pricingTiers";
import { track } from "@/lib/analytics";

interface Props {
  interval?: "monthly" | "yearly";
}

export function HomePricingStrip({ interval = "monthly" }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12" aria-labelledby="home-pricing-heading">
      <div className="flex items-baseline justify-between">
        <h2 id="home-pricing-heading" className="text-3xl font-black md:text-4xl">
          Simple pricing.
        </h2>
        <Link
          to="/pricing"
          className="text-xs font-bold uppercase tracking-[2px] text-[var(--ink2)] hover:text-[var(--neon)]"
        >
          Compare all plans →
        </Link>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {pricingTiers.map((t) => (
          <TierCard key={t.key} tier={t} interval={interval} />
        ))}
      </div>
    </section>
  );
}

function TierCard({ tier, interval }: { tier: PricingTier; interval: "monthly" | "yearly" }) {
  const price = priceForInterval(tier, interval);
  const suffix = interval === "monthly" ? "/mo" : "/yr";
  const monthlyEquiv = interval === "yearly" ? tier.priceYearly / 12 : null;

  return (
    <div
      className="card-rwc relative flex flex-col p-6"
      style={tier.popular ? { borderColor: "var(--neon)" } : undefined}
    >
      {tier.popular && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[2px]"
          style={{ background: "var(--neon)", color: "#02000c" }}
        >
          Most popular
        </div>
      )}
      <h3 className="eyebrow" style={{ color: tier.accent }}>{tier.name}</h3>
      <div className="mt-2 font-mono text-4xl font-black">
        ${price.toFixed(2)}
        <span className="text-sm font-bold text-[var(--mute)]">{suffix}</span>
      </div>
      {monthlyEquiv !== null && (
        <div className="mt-1 text-xs text-[var(--mute)]">
          ~${monthlyEquiv.toFixed(2)}/mo billed annually
        </div>
      )}
      <div className="mt-2 text-sm text-[var(--ink2)]">{tier.headline}</div>
      <div
        className="mt-3 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2px]"
        style={{
          background: tier.popular ? "rgba(34,211,255,0.10)" : "rgba(255,255,255,0.04)",
          color: tier.accent,
          border: `1px solid ${tier.popular ? "var(--neon)" : "var(--border-line)"}`,
        }}
      >
        {tier.timingLabel}
      </div>
      {tier.valueCaption && (
        <p className="mt-3 text-xs text-[var(--mute)]">{tier.valueCaption}</p>
      )}
      <div className="mt-6">
        <Link
          to="/login"
          search={{ next: "/pricing", plan: tier.key, interval } as never}
          className="btn-cta w-full justify-center"
          onClick={() => track("home_pricing_strip_click", { tier: tier.key, interval })}
        >
          {ctaLabel(tier, interval)}
        </Link>
      </div>
    </div>
  );
}
