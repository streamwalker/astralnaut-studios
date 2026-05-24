import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import {
  type Feature,
  type Tier,
  hasFeature,
  tierFromPriceId,
} from "@/lib/tier";

type SubInfo = {
  tier: Tier;
  /** `active`, `trialing`, `past_due`, `canceled`, or `null` when no row. */
  status: string | null;
  /** True when the user has an entitlement right now (incl. end-of-period grace). */
  isActive: boolean;
  /** True while the user is in grace period after cancellation. */
  inGracePeriod: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
};

const EMPTY: SubInfo = {
  tier: "none",
  status: null,
  isActive: false,
  inGracePeriod: false,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  priceId: null,
};

/**
 * Read the current user's active subscription tier from the local
 * `subscriptions` table (populated by the Stripe webhook). All reads are
 * scoped to the current Stripe environment so sandbox/live rows never mix.
 *
 * Returns `tier: "none"` for signed-out users and anyone without an
 * entitlement — never throws.
 */
export function useSubscription() {
  const qc = useQueryClient();

  useEffect(() => {
    // Re-fetch on sign-in/sign-out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
    });
    return () => subscription.unsubscribe();
  }, [qc]);

  const query = useQuery({
    queryKey: ["subscription"],
    queryFn: async (): Promise<SubInfo> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return EMPTY;

      const env = getStripeEnvironment();
      const { data } = await supabase
        .from("subscriptions")
        .select("status, price_id, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return EMPTY;

      const status = data.status as string;
      const periodEnd = data.current_period_end as string | null;
      const cancelAtPeriodEnd = !!data.cancel_at_period_end;
      const priceId = (data.price_id as string | null) ?? null;

      const periodActive = !periodEnd || new Date(periodEnd) > new Date();
      // Mirrors the server-side `has_active_subscription` SQL function.
      const isActive =
        (["active", "trialing", "past_due"].includes(status) && periodActive) ||
        (status === "canceled" && periodActive);
      const inGracePeriod = isActive && (status === "canceled" || cancelAtPeriodEnd);

      return {
        tier: isActive ? tierFromPriceId(priceId) : "none",
        status,
        isActive,
        inGracePeriod,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd,
        priceId,
      };
    },
    staleTime: 30_000,
  });

  const info = query.data ?? EMPTY;

  // Realtime: any change to this user's subscription row refetches.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const channel = supabase
        .channel(`subscription:${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
          () => qc.invalidateQueries({ queryKey: ["subscription"] }),
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    })();
    return () => { cancelled = true; };
  }, [qc]);

  return {
    ...info,
    isLoading: query.isLoading,
    /** True when the current tier can use `feature`. */
    has(feature: Feature) {
      return hasFeature(info.tier, feature);
    },
  };
}
