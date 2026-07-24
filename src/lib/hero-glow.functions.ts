import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type HeroGlowRow = {
  series_slug: string;
  enabled: boolean;
  color: string;
  intensity: number;
  spread: number;
};

const upsertSchema = z.object({
  series_slug: z.string().min(1),
  enabled: z.boolean(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be #RRGGBB"),
  intensity: z.number().int().min(0).max(100),
  spread: z.number().int().min(0).max(200),
});

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Not authorized");
}

export const upsertHeroGlow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("hero_logo_glow")
      .upsert(
        {
          series_slug: data.series_slug,
          enabled: data.enabled,
          color: data.color,
          intensity: data.intensity,
          spread: data.spread,
        },
        { onConflict: "series_slug" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
