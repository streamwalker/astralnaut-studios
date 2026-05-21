interface Reward { at: number; reward: string }
interface Props {
  name: string;
  current_count: number;
  target_count: number;
  ends_at: string | null;
  rewards: Reward[];
}

export function MilestoneStrip({ name, current_count, target_count, ends_at, rewards }: Props) {
  const pct = Math.min(100, Math.round((current_count / target_count) * 100));
  return (
    <section className="panel mx-auto my-12 max-w-7xl px-6 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="eyebrow">Active campaign · {name}</div>
          <div className="mt-1 font-mono text-2xl font-black"><span className="text-[var(--neon)]">{current_count.toLocaleString()}</span> <span className="text-[var(--mute)]">/ {target_count.toLocaleString()} subscribers</span></div>
        </div>
        {ends_at && <div className="font-mono text-xs text-[var(--mute)]">ENDS {ends_at}</div>}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-cta)" }} />
      </div>
      <ul className="mt-5 grid gap-3 md:grid-cols-4">
        {rewards.map((r) => {
          const hit = current_count >= r.at;
          return (
            <li key={r.at} className="rounded-lg border p-3" style={{ borderColor: hit ? "var(--neon)" : "var(--border-line)", background: hit ? "rgba(34,211,255,0.06)" : "transparent" }}>
              <div className="font-mono text-xs font-bold" style={{ color: hit ? "var(--neon)" : "var(--gold)" }}>{r.at.toLocaleString()} subs</div>
              <div className="mt-1 text-sm text-[var(--ink2)]">{r.reward}</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
