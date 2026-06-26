import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArchiveShell, ArchivePageHeader, ArchiveCard } from "@/components/archive/ArchiveShell";
import { getWallet, redeem } from "@/lib/archive-wallet.functions";

export const Route = createFileRoute("/archive/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Astralnaut Archive" }] }),
  component: WalletPage,
});

function WalletPage() {
  const fetchWallet = useServerFn(getWallet);
  const redeemFn = useServerFn(redeem);
  const qc = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["archive-wallet"],
    queryFn: () => fetchWallet(),
  });

  const mut = useMutation({
    mutationFn: (catalogId: string) => redeemFn({ data: { catalogId } }),
    onMutate: (id) => setPending(id),
    onSettled: () => setPending(null),
    onSuccess: () => {
      toast.success("Redemption recorded.");
      qc.invalidateQueries({ queryKey: ["archive-wallet"] });
    },
    onError: (e: Error) => toast.error(e.message || "Redemption failed."),
  });

  if (isLoading) {
    return (
      <ArchiveShell>
        <ArchivePageHeader codename="ARC-WAL" title="Wallet" />
        <p className="text-sm text-[color:var(--hud-dim)]">Reading wallet…</p>
      </ArchiveShell>
    );
  }

  if (error || !data) {
    return (
      <ArchiveShell>
        <ArchivePageHeader codename="ARC-WAL" title="Wallet" />
        <ArchiveCard title="Access denied" stamp="ERR">
          <p>Wallet requires authenticated clearance. Sign in to view your balance.</p>
        </ArchiveCard>
      </ArchiveShell>
    );
  }

  const { wallet, ledger, redemptions, catalog, subscriptionMonthsUsed, subscriptionMonthsCap } = data;
  const remainingMonths = Math.max(0, subscriptionMonthsCap - subscriptionMonthsUsed);

  return (
    <ArchiveShell>
      <ArchivePageHeader codename="ARC-WAL" title="Wallet" />

      <div className="grid gap-4 sm:grid-cols-3">
        <ArchiveCard title="Proficiency Tokens" stamp="PT">
          <div className="font-mono text-3xl font-bold text-[color:var(--hud-accent)]">
            {wallet.tokens.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-[color:var(--hud-dim)]">
            Lifetime earned · {wallet.lifetime_tokens.toLocaleString()}
          </div>
        </ArchiveCard>
        <ArchiveCard title="Experience">
          <div className="font-mono text-3xl font-bold">{wallet.xp.toLocaleString()} XP</div>
          <div className="mt-1 text-xs uppercase tracking-[0.25em] text-[color:var(--hud-dim)]">
            Rank · {wallet.rank}
          </div>
        </ArchiveCard>
        <ArchiveCard title="Annual Sub Cap" stamp={`${remainingMonths}/3`}>
          <div className="font-mono text-3xl font-bold">{subscriptionMonthsUsed} / {subscriptionMonthsCap}</div>
          <div className="mt-1 text-xs text-[color:var(--hud-dim)]">
            Free subscription months redeemed in trailing 365 days.
          </div>
        </ArchiveCard>
      </div>

      <h2 className="mt-10 mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[color:var(--hud-accent)]">
        Redemption Catalog
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {catalog.map((item) => {
          const canAfford = wallet.tokens >= item.cost_tokens;
          const isSub = item.category === "subscription_month";
          const subMonths = isSub ? Number((item.payload as { months?: number })?.months ?? 1) : 0;
          const capBlocked = isSub && subMonths > remainingMonths;
          const disabled = !canAfford || capBlocked || mut.isPending;
          return (
            <ArchiveCard key={item.id} title={item.name} stamp={item.category.replace("_", " ").toUpperCase()}>
              <p className="text-sm">{item.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="font-mono text-lg text-[color:var(--hud-accent)]">
                  {item.cost_tokens.toLocaleString()} PT
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => mut.mutate(item.id)}
                  className="border border-[color:var(--hud-accent)] bg-[color:var(--hud-accent)]/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[color:var(--hud-accent)] transition hover:bg-[color:var(--hud-accent)]/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending === item.id && mut.isPending ? "…" : capBlocked ? "Cap reached" : !canAfford ? "Insufficient" : "Redeem"}
                </button>
              </div>
            </ArchiveCard>
          );
        })}
      </div>

      <h2 className="mt-10 mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[color:var(--hud-accent)]">
        Redemption History
      </h2>
      <ArchiveCard>
        {redemptions.length === 0 ? (
          <p className="text-xs text-[color:var(--hud-dim)]">No redemptions on record.</p>
        ) : (
          <ul className="space-y-1 font-mono text-xs">
            {redemptions.map((r) => (
              <li key={r.id} className="flex justify-between gap-4">
                <span>{new Date(r.created_at).toISOString().slice(0, 10)} · {r.catalog_code}</span>
                <span className="text-[color:var(--hud-dim)]">-{r.cost_tokens} PT{r.granted_months > 0 ? ` · +${r.granted_months}mo` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </ArchiveCard>

      <h2 className="mt-10 mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[color:var(--hud-accent)]">
        Ledger
      </h2>
      <ArchiveCard>
        {ledger.length === 0 ? (
          <p className="text-xs text-[color:var(--hud-dim)]">Ledger empty. Earn XP and tokens by completing missions in connected games.</p>
        ) : (
          <ul className="space-y-1 font-mono text-xs">
            {ledger.map((l) => (
              <li key={l.id} className="flex justify-between gap-4">
                <span>{new Date(l.created_at).toISOString().slice(0, 16).replace("T", " ")} · {l.reason}</span>
                <span className={l.delta >= 0 ? "text-[color:var(--hud-accent)]" : "text-[color:var(--hud-warn)]"}>
                  {l.delta >= 0 ? "+" : ""}{l.delta} {l.kind === "xp" ? "XP" : "PT"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ArchiveCard>
    </ArchiveShell>
  );
}
