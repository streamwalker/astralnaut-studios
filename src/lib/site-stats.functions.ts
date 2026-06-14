import { createServerFn } from "@tanstack/react-start";

export interface SiteStats {
  subscriberCount: number;
  campaignGoal: number;
  pagesPublished: number;
  seriesLive: number;
}

/**
 * Single source of truth for the headline numbers. Both the homepage hero
 * stat band and the campaign milestone strip read from this — they can never
 * disagree.
 *
 * Reads `site_stats` for static figures (pages, series, goal) and the
 * `get_active_subscriber_count()` SECURITY DEFINER function for the live
 * subscriber number.
 */
export const getSiteStats = createServerFn({ method: "GET" }).handler(async (): Promise<SiteStats> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [statsRes, countRes] = await Promise.all([
    supabaseAdmin
      .from("site_stats")
      .select("campaign_goal, pages_published, series_live, subscriber_count")
      .eq("id", 1)
      .maybeSingle(),
    supabaseAdmin.rpc("get_active_subscriber_count"),
  ]);

  const stats = statsRes.data;
  const liveCount = typeof countRes.data === "number" ? countRes.data : 0;
  // Prefer live count; fall back to admin-edited subscriber_count if RPC missing.
  const subscriberCount = liveCount > 0 ? liveCount : stats?.subscriber_count ?? 0;

  return {
    subscriberCount,
    campaignGoal: stats?.campaign_goal ?? 1000,
    pagesPublished: stats?.pages_published ?? 52,
    seriesLive: stats?.series_live ?? 3,
  };
});
