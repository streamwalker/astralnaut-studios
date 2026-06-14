import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailSchema = z.string().email().max(320);

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: {
    email: string;
    source: "free_act_wall" | "free_raffle";
    series_slug?: string | null;
    last_page?: number | null;
  }) =>
    z
      .object({
        email: emailSchema,
        source: z.enum(["free_act_wall", "free_raffle"]),
        series_slug: z.string().max(120).nullable().optional(),
        last_page: z.number().int().nonnegative().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Upsert by (email, source) so a returning visitor refreshes the row
    // rather than failing on the unique constraint.
    const { data: row, error } = await supabaseAdmin
      .from("leads")
      .upsert(
        {
          email: data.email.toLowerCase().trim(),
          source: data.source,
          series_slug: data.series_slug ?? null,
          last_page: data.last_page ?? null,
        },
        { onConflict: "email,source" },
      )
      .select("id, confirmed, confirm_token")
      .single();

    if (error) {
      console.error("submitLead error", error);
      throw new Error("Could not save your email. Please try again.");
    }

    // Fire double-opt-in email asynchronously. We don't block the user
    // response on email provider latency.
    if (!row.confirmed) {
      try {
        const { sendConfirmEmail } = await import("./leads.server");
        await sendConfirmEmail({
          email: data.email,
          token: row.confirm_token,
          seriesSlug: data.series_slug ?? null,
        });
      } catch (e) {
        // Do not surface to user — they're already captured in the DB.
        console.error("sendConfirmEmail failed", e);
      }
    }

    return { ok: true as const };
  });

export const confirmLeadByToken = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) =>
    z.object({ token: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("leads")
      .update({ confirmed: true })
      .eq("confirm_token", data.token);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const unsubscribeLeadByToken = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) =>
    z.object({ token: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("leads")
      .delete()
      .eq("unsub_token", data.token);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
