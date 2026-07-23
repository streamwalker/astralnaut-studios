import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteStats, type SiteStats } from "@/lib/site-stats.functions";
import { siteConfig } from "@/config/siteConfig";

const FALLBACK: SiteStats = {
  subscriberCount: 0,
  campaignGoal: siteConfig.CAMPAIGN.goal,
  pagesPublished: 52,
  seriesLive: 3,
};

/**
 * Single source of truth for the live subscriber count and campaign goal.
 * The homepage hero stat band, the campaign milestone strip, and any other
 * surface that wants to show subscriber numbers MUST consume this hook —
 * never two different reads, never a hardcoded value, never a raw 0.
 *
 * `displayCount` honors the SHOW_SUBSCRIBER_COUNT + MIN threshold gates so
 * callers don't reinvent that logic.
 */
export function useSubscriberCount() {
  const fn = useServerFn(getSiteStats);
  const query = useQuery({
    queryKey: ["site-stats"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });

  const stats = query.data ?? FALLBACK;
  const pctOfGoal =
    stats.campaignGoal > 0 ? stats.subscriberCount / stats.campaignGoal : 0;
  const revealCampaign =
    siteConfig.SHOW_SUBSCRIBER_COUNT &&
    stats.subscriberCount >= siteConfig.MIN_SUBSCRIBER_COUNT_TO_SHOW &&
    pctOfGoal >= siteConfig.CAMPAIGN_REVEAL_PCT;

  return {
    ...stats,
    isLoading: query.isLoading,
    /** Fraction of the campaign goal currently reached (0–1+). */
    pctOfGoal,
    /** Whether the subscriber count + milestone strip should be revealed. */
    revealCampaign,
    /** Back-compat alias. */
    showCount: revealCampaign,
    /** Convenience: the count to display, or null when suppressed. */
    displayCount: revealCampaign ? stats.subscriberCount : null,
  };
}
