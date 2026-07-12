import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD"),
  attested: z.literal(true),
});

function yearsSince(dob: Date, now: Date): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

export const getCommunityAttestation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("community_attestations")
      .select("id, date_of_birth, attested_18_plus, created_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { attestation: data ?? null };
  });

export const attestAdultCommunityAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { date_of_birth: string; attested: true }) =>
    inputSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const dob = new Date(`${data.date_of_birth}T00:00:00Z`);
    if (Number.isNaN(dob.getTime())) {
      throw new Error("Invalid date of birth.");
    }
    const age = yearsSince(dob, new Date());
    if (age < 18) {
      throw new Error(
        "You must be 18 or older to join the community or Discord.",
      );
    }
    if (age > 120) {
      throw new Error("Invalid date of birth.");
    }

    const req = getRequest();
    const ip =
      req?.headers.get("cf-connecting-ip") ??
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    const userAgent = req?.headers.get("user-agent") ?? null;

    const { error } = await context.supabase
      .from("community_attestations")
      .upsert(
        {
          user_id: context.userId,
          date_of_birth: data.date_of_birth,
          attested_18_plus: true,
          ip,
          user_agent: userAgent,
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);

    const inviteUrl = process.env.DISCORD_INVITE_URL ?? null;
    return { ok: true as const, inviteUrl };
  });
