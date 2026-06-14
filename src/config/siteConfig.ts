/**
 * Site-wide feature flags and campaign config.
 *
 * Edit these to tune copy/behavior without touching components.
 */
export const siteConfig = {
  /**
   * When true, the hero stat band shows the live subscriber count from
   * `get_active_subscriber_count()`. When false (or when the real count is
   * below MIN_SUBSCRIBER_COUNT_TO_SHOW), the hero falls back to
   * non-count proof metrics (pages published, series live, weekly cadence).
   */
  SHOW_SUBSCRIBER_COUNT: true as boolean,

  /**
   * Soft floor — if the real count is below this number, the hero suppresses
   * the raw count even when SHOW_SUBSCRIBER_COUNT is true.
   */
  MIN_SUBSCRIBER_COUNT_TO_SHOW: 50,

  /** When true, Initiate card shows "Most readers save with annual" nudge. */
  SHOW_ANNUAL_NUDGE: false as boolean,

  CAMPAIGN: {
    name: "Atlantis Rising",
    goal: 1000,
    endsAt: null as string | null,
  },
} as const;

export type SiteConfig = typeof siteConfig;
