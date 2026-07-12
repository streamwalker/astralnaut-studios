import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { tierFromPriceId } from "@/lib/tier";

const submitSchema = z.object({
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD"),
  attested_18_plus: z.literal(true),
  release_signed: z.literal(true),
  full_legal_name: z.string().trim().min(2).max(120),
  display_name: z.string().trim().min(2).max(80),
  likeness_notes: z.string().trim().max(1000).optional().default(""),
  reference_url: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

function yearsSince(dob: Date, now: Date): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

export const getMyCameoSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cameo_submissions")
      .select("id, display_name, status, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { submissions: data ?? [] };
  });

export const submitCameoRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data, context }) => {
    // 18+ enforcement (server-side, not just UI)
    const dob = new Date(`${data.date_of_birth}T00:00:00Z`);
    if (Number.isNaN(dob.getTime())) {
      throw new Error("Invalid date of birth.");
    }
    const age = yearsSince(dob, new Date());
    if (age < 18) {
      throw new Error(
        "You must be 18 or older to submit a cameo request.",
      );
    }
    if (age > 120) {
      throw new Error("Invalid date of birth.");
    }

    // Cameo eligibility gate: Patron tier only.
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("price_id, status, current_period_end")
      .eq("user_id", context.userId)
      .in("status", ["active", "trialing"])
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();
    const tier = tierFromPriceId(sub?.price_id ?? null);
    if (tier !== "patron") {
      throw new Error(
        "Cameo submissions are limited to active Patron-tier subscribers.",
      );
    }

    const req = getRequest();
    const ip =
      req?.headers.get("cf-connecting-ip") ??
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    const userAgent = req?.headers.get("user-agent") ?? null;

    const { data: inserted, error } = await context.supabase
      .from("cameo_submissions")
      .insert({
        user_id: context.userId,
        date_of_birth: data.date_of_birth,
        attested_18_plus: true,
        release_signed: true,
        full_legal_name: data.full_legal_name,
        display_name: data.display_name,
        likeness_notes: data.likeness_notes || null,
        reference_url: data.reference_url || null,
        ip,
        user_agent: userAgent,
        status: "pending",
      })
      .select("id, status, created_at")
      .single();
    if (error) throw new Error(error.message);

    return { ok: true as const, submission: inserted };
  });
