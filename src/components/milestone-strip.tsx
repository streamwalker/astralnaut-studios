import { useSubscriberCount } from "@/hooks/useSubscriberCount";
import { siteConfig } from "@/config/siteConfig";

interface Reward { at: number; reward: string }
interface Props {
  name: string;
  /** Fallback name if not provided via campaign config. */
  current_count?: number;
  /** Optional override. Defaults to siteConfig.CAMPAIGN.goal. */
  target_count?: number;
  ends_at: string | null;
  rewards: Reward[];
}

/**
 * Renders the campaign progress bar. The subscriber number and goal are
 * pulled from the SAME source as the homepage hero (`useSubscriberCount`)
 * so the two surfaces can never disagree.
 */
export function MilestoneStrip({ name, ends_at, rewards }: Props) {
  const { subscriberCount, campaignGoal } = useSubscriberCount();
  const goal = campaignGoal || siteConfig.CAMPAIGN.goal;
  const pct = goal > 0 ? Math.min(100, Math.round((subscriberCount / goal) * 100)) : 0;

  return (
    <section className="panel mx-auto my-12 max-w-7xl px-6 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="eyebrow">Active campaign · {name}</div>
          <div className="mt-1 font-mono text-2xl font-black">
            <span className="text-[var(--neon)]">{subscriberCount.toLocaleString()}</span>{" "}
            <span className="text-[var(--mute)]">/ {goal.toLocaleString()} subscribers</span>
          </div>
        </div>
        {ends_at && <div className="font-mono text-xs text-[var(--mute)]">ENDS {ends_at}</div>}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, background: "var(--gradient-cta)" }}
        />
      </div>
      <ul className="mt-5 grid gap-3 md:grid-cols-4">
        {rewards.map((r) => {
          const hit = subscriberCount >= r.at;
          return (
            <li
              key={r.at}
              className="rounded-lg border p-3"
              style={{
                borderColor: hit ? "var(--neon)" : "var(--border-line)",
                background: hit ? "rgba(34,211,255,0.06)" : "transparent",
              }}
            >
              <div className="font-mono text-xs font-bold" style={{ color: hit ? "var(--neon)" : "var(--gold)" }}>
                {r.at.toLocaleString()} subs
              </div>
              <div className="mt-1 text-sm text-[var(--ink2)]">{r.reward}</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
