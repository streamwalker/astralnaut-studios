import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface UserStanding {
  raffleEntries: number;
  weeksActive: number;
  tier: string | null;
  campaignName: string;
}

/**
 * Returns the signed-in user's retention metrics: total accumulated sweepstakes
 * entries this campaign, weeks of active subscription, and current tier.
 * Used by the account "Your standing" widget and the cancel-flow loss notice.
 */
export const getMyStanding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserStanding> => {
    const { supabase, userId } = context;

    const [{ count: entries }, { data: sub }] = await Promise.all([
      supabase
        .from("raffle_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("subscriptions")
        .select("price_id, status, created_at")
        .eq("user_id", userId)
        .in("status", ["active", "trialing", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    let weeksActive = 0;
    if (sub?.created_at) {
      const ms = Date.now() - new Date(sub.created_at).getTime();
      weeksActive = Math.max(0, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)));
    }

    return {
      raffleEntries: entries ?? 0,
      weeksActive,
      tier: sub?.price_id?.split("_")[0] ?? null,
      campaignName: "Atlantis Rising",
    };
  });
