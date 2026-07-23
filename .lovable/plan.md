## Goal
Only show the live subscriber number and the "Active campaign" milestone strip once we've reached **≥70% of the current campaign goal**. Below that threshold, both surfaces stay hidden (or show a neutral teaser) so early low numbers don't undercut momentum.

## Where the change lands
Single source of truth is `src/hooks/useSubscriberCount.ts`. Every surface already reads from it, so gating there covers the hero band and the milestone strip in one place.

## Changes

1. **`src/config/siteConfig.ts`**
   - Add `CAMPAIGN_REVEAL_PCT: 0.7` (documented: hide public subscriber count + milestone progress until we hit this fraction of goal).
   - Keep existing `SHOW_SUBSCRIBER_COUNT` and `MIN_SUBSCRIBER_COUNT_TO_SHOW` as hard overrides (kill-switch + absolute floor).

2. **`src/hooks/useSubscriberCount.ts`**
   - Compute `pctOfGoal = subscriberCount / campaignGoal`.
   - New `revealCampaign = SHOW_SUBSCRIBER_COUNT && pctOfGoal >= CAMPAIGN_REVEAL_PCT && subscriberCount >= MIN_SUBSCRIBER_COUNT_TO_SHOW`.
   - `displayCount` now also requires `revealCampaign` (so hero "Subscribers" stat hides until 70%).
   - Export `revealCampaign` and `pctOfGoal` alongside existing fields.

3. **`src/components/milestone-strip.tsx`**
   - Read `revealCampaign` from the hook.
   - If `!revealCampaign`, render `null` (strip disappears entirely) — the surrounding page section on `/` already tolerates this because it's a standalone `<section>`.
   - When revealed, behavior is unchanged.

4. **`src/routes/index.tsx`**
   - No code change needed: the hero already guards with `displayCount !== null`, and `<MilestoneStrip>` now self-hides.

## Not in scope
- No DB / server-fn changes; the count and goal already flow through `getSiteStats`.
- No admin toggle UI in this pass — the threshold lives in `siteConfig` and can be tuned by editing that one constant. Say the word if you want it moved into the admin panel instead.
