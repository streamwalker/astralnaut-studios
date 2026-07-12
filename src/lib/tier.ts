/**
 * Subscription tier model + feature access map.
 * Single source of truth for who can see what.
 */

export type Tier = "none" | "reader" | "initiate" | "patron";

const TIER_RANK: Record<Tier, number> = {
  none: 0,
  reader: 1,
  initiate: 2,
  patron: 3,
};

export const TIER_LABEL: Record<Tier, string> = {
  none: "Free",
  reader: "Reader",
  initiate: "Initiate",
  patron: "Patron",
};

export const TIER_ACCENT: Record<Tier, string> = {
  none: "var(--ink2)",
  reader: "var(--ink2)",
  initiate: "var(--neon)",
  patron: "var(--plasma)",
};

/** Resolve a `price_id` lookup_key (e.g. "patron_yearly") to its tier. */
export function tierFromPriceId(priceId: string | null | undefined): Tier {
  if (!priceId) return "none";
  if (priceId.startsWith("patron")) return "patron";
  if (priceId.startsWith("initiate")) return "initiate";
  if (priceId.startsWith("reader")) return "reader";
  return "none";
}

/**
 * Every gated feature in the product. To add a new gate, add a key here
 * and the minimum tier required to use it. Then call `useSubscription().has(key)`
 * or wrap UI in `<TierGate feature="...">`.
 */
export const FEATURE_MIN_TIER = {
  forum: "reader",
  canon_voting: "reader",
  raffle_auto_entries: "reader",
  motion_comic: "reader",
  early_access_24h: "initiate",
  numbered_variants: "initiate",
  bts_process: "initiate",
  early_access_48h: "patron",
  cameo_eligibility: "patron",
  signed_print_run: "patron",
  creator_discord: "patron",
} as const satisfies Record<string, Tier>;

export type Feature = keyof typeof FEATURE_MIN_TIER;

/** True when `tier` meets or exceeds the minimum needed for `feature`. */
export function hasFeature(tier: Tier, feature: Feature): boolean {
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}

/** Weekly sweepstakes entries auto-granted by tier (0 = none, AMOE entry is separate). */
export function raffleEntriesFor(tier: Tier): number {
  return tier === "patron" ? 10 : tier === "initiate" ? 3 : tier === "reader" ? 1 : 0;
}

/** Drop-window offset in hours (how many hours early this tier reads). */
export function earlyAccessHours(tier: Tier): number {
  return tier === "patron" ? 48 : tier === "initiate" ? 24 : 0;
}
