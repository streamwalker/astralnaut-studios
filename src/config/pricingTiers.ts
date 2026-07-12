/**
 * Single source of truth for subscription pricing tiers.
 *
 * Imported by /pricing AND the homepage pricing strip. Never hardcode tier
 * data anywhere else.
 */
export type TierKey = "reader" | "initiate" | "patron";

export interface PricingTier {
  key: TierKey;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  /** Headline benefit shown in the homepage compact strip. */
  headline: string;
  /** Drop-time / framing line. Positive-framed only (no "0h ahead"). */
  timingLabel: string;
  /** Optional caption shown under the price to reframe value-step. */
  valueCaption?: string;
  features: string[];
  /** "Most popular" ribbon + emphasized border. */
  popular?: boolean;
  /** Show "2 months free" treatment on Yearly toggle. */
  highlightAnnual?: boolean;
  accent: string;
}

export const pricingTiers: PricingTier[] = [
  {
    key: "reader",
    name: "Reader",
    priceMonthly: 4.99,
    priceYearly: 49.9,
    monthlyPriceId: "reader_monthly",
    yearlyPriceId: "reader_yearly",
    headline: "Every page, every series.",
    timingLabel: "Full access · every page, every series.",
    features: [
      "All series · all 20+ pages of every issue",
      "Forum access",
      "Canon voting power",
      "Motion-comic reader",
      "Automatic entry into the Milestone Sweepstakes (same single entry as every other eligible entrant)",
    ],
    accent: "var(--ink2)",
  },
  {
    key: "initiate",
    name: "Initiate",
    priceMonthly: 9.99,
    priceYearly: 99.9,
    monthlyPriceId: "initiate_monthly",
    yearlyPriceId: "initiate_yearly",
    headline: "Read 24h early. Numbered variants.",
    timingLabel: "Pages drop 24h early",
    features: [
      "Everything in Reader",
      "Pages drop 24 hours early",
      "Numbered digital variant covers",
      "Behind-the-scenes process content",
      "Automatic entry into the Milestone Sweepstakes (same single entry as every other eligible entrant)",
    ],
    popular: true,
    highlightAnnual: true,
    accent: "var(--neon)",
  },
  {
    key: "patron",
    name: "Patron",
    priceMonthly: 24.99,
    priceYearly: 249.9,
    monthlyPriceId: "patron_monthly",
    yearlyPriceId: "patron_yearly",
    headline: "First to read. Print + cameo + Discord.",
    timingLabel: "Pages drop 48h early",
    valueCaption: "Physical print + cameo + Discord — the collector tier.",
    features: [
      "Everything in Initiate",
      "Pages drop 48 hours early",
      "Cameo eligibility — be drawn into an issue",
      "Quarterly signed physical print run (shipped)",
      "Direct creator Discord access",
      "Automatic entry into the Milestone Sweepstakes (same single entry as every other eligible entrant)",
    ],
    accent: "var(--plasma)",
  },
];

export function getTier(key: TierKey): PricingTier {
  const t = pricingTiers.find((x) => x.key === key);
  if (!t) throw new Error(`Unknown tier: ${key}`);
  return t;
}

export function priceForInterval(t: PricingTier, interval: "monthly" | "yearly"): number {
  return interval === "monthly" ? t.priceMonthly : t.priceYearly;
}

export function monthlyEquivalent(t: PricingTier, interval: "monthly" | "yearly"): number {
  return interval === "monthly" ? t.priceMonthly : t.priceYearly / 12;
}

/**
 * Action-outcome CTA labels — never "Sign in to start".
 * The label includes the price so the cost is visible on the button.
 */
export function ctaLabel(t: PricingTier, interval: "monthly" | "yearly"): string {
  const monthly = monthlyEquivalent(t, interval);
  const verb = t.key === "patron" ? "Go" : "Start";
  const suffix = interval === "yearly" ? "/mo · billed yearly" : "/mo";
  const priceStr = interval === "yearly" ? `~$${monthly.toFixed(2)}` : `$${t.priceMonthly.toFixed(2)}`;
  return `${verb} ${t.name} · ${priceStr}${suffix}`;
}
