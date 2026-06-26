import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Ensure a wallet row exists (idempotent insert via upsert on PK)
    await supabase.from("archive_wallets").upsert({ user_id: userId }, { onConflict: "user_id" });

    const [walletRes, ledgerRes, redemptionsRes, catalogRes, monthsRes] = await Promise.all([
      supabase.from("archive_wallets").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("archive_wallet_ledger")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("archive_redemptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("archive_redemption_catalog")
        .select("*")
        .eq("active", true)
        .order("cost_tokens", { ascending: true }),
      supabase.rpc("archive_subscription_months_used", { p_user: userId }),
    ]);

    return {
      wallet: walletRes.data ?? { user_id: userId, xp: 0, rank: "observer", tokens: 0, lifetime_tokens: 0 },
      ledger: ledgerRes.data ?? [],
      redemptions: redemptionsRes.data ?? [],
      catalog: catalogRes.data ?? [],
      subscriptionMonthsUsed: (monthsRes.data as number | null) ?? 0,
      subscriptionMonthsCap: 3,
    };
  });

export const redeem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ catalogId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("archive_redeem", {
      p_catalog_id: data.catalogId,
    });
    if (error) throw new Error(error.message);
    return { redemption: result };
  });
