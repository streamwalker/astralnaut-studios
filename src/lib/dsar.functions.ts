import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

const REQUEST_TYPES = ["access", "correct", "delete", "portability", "opt_out_sale", "opt_out_profiling", "appeal", "other"] as const;

const submitSchema = z.object({
  requestType: z.enum(REQUEST_TYPES),
  requesterEmail: z.string().email().max(320),
  region: z.string().max(60).optional().nullable(),
  details: z.string().max(4000).optional().nullable(),
  authorizedAgent: z.boolean().optional().default(false),
});

export const submitDsarRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let ip: string | null = null;
    let ua: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
      ua = getRequestHeader("user-agent") ?? null;
    } catch {
      /* non-request context */
    }
    const { data: row, error } = await supabaseAdmin
      .from("dsar_requests")
      .insert({
        request_type: data.requestType,
        requester_email: data.requesterEmail,
        region: data.region ?? null,
        details: data.details ?? null,
        authorized_agent: data.authorizedAgent ?? false,
        ip: ip as unknown as string | null,
        user_agent: ua,
      })
      .select("id, reference_id")
      .single();
    if (error) throw new Error(error.message);

    // Best-effort confirmation email via Resend if configured. Never throw.
    try {
      const key = process.env.RESEND_API_KEY;
      if (key) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            from: "Streamwalkers Privacy <privacy@astralnautstudios.com>",
            to: [data.requesterEmail],
            subject: `We received your privacy request (${row.reference_id})`,
            text:
              `We received your ${data.requestType} request.\n\n` +
              `Reference ID: ${row.reference_id}\n\n` +
              `We will respond within the timeframe required by applicable law. ` +
              `We may need to verify your identity before completing your request.\n\n` +
              `— Streamwalkers Corporation, Privacy team`,
          }),
        });
      }
    } catch {
      /* swallow; the record is what matters */
    }
    return { referenceId: row.reference_id };
  });
