import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { LEGAL_CONFIG } from "@/config/legal";

// Structured DMCA notice / counter-notice submission. Persists to public.dmca_notices
// (anonymous insert allowed by policy) and best-effort emails the DMCA contact
// via Resend if configured.
const baseFields = {
  complainantName: z.string().min(2).max(200),
  complainantEmail: z.string().email().max(320),
  complainantAddress: z.string().max(1000).optional().nullable(),
  complainantPhone: z.string().max(60).optional().nullable(),
  workIdentified: z.string().min(5).max(4000),
  locationUrl: z.string().url().max(2000),
  goodFaithStatement: z.literal(true),
  accuracyStatement: z.literal(true),
  signature: z.string().min(2).max(200),
};

const noticeSchema = z.object({ kind: z.literal("notice"), ...baseFields });
const counterSchema = z.object({
  kind: z.literal("counter"),
  ...baseFields,
  consentToJurisdiction: z.literal(true),
});
const submitSchema = z.discriminatedUnion("kind", [noticeSchema, counterSchema]);

export const submitDmcaNotice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let ip: string | null = null;
    let ua: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
      ua = getRequestHeader("user-agent") ?? null;
    } catch { /* ignore */ }

    const { data: row, error } = await supabaseAdmin
      .from("dmca_notices")
      .insert({
        kind: data.kind,
        complainant_name: data.complainantName,
        complainant_email: data.complainantEmail,
        complainant_address: data.complainantAddress ?? null,
        complainant_phone: data.complainantPhone ?? null,
        work_identified: data.workIdentified,
        location_url: data.locationUrl,
        good_faith_statement: data.goodFaithStatement,
        accuracy_statement: data.accuracyStatement,
        consent_to_jurisdiction: data.kind === "counter" ? data.consentToJurisdiction : null,
        signature: data.signature,
        ip: ip as unknown as string | null,
        user_agent: ua,
      } as never)
      .select("id, reference_id")
      .single();
    if (error) throw new Error(error.message);

    // Best-effort staff notification.
    try {
      const key = process.env.RESEND_API_KEY;
      const dmca = LEGAL_CONFIG.contacts.dmca ?? "dmca@astralnautstudios.com";
      if (key) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            from: "Streamwalkers Legal <legal@astralnautstudios.com>",
            to: [dmca],
            reply_to: data.complainantEmail,
            subject: `[DMCA ${data.kind.toUpperCase()}] ${row.reference_id} — ${data.complainantName}`,
            text:
              `Reference: ${row.reference_id}\n` +
              `Kind: ${data.kind}\n` +
              `Complainant: ${data.complainantName} <${data.complainantEmail}>\n` +
              `Phone: ${data.complainantPhone ?? "-"}\n` +
              `Address: ${data.complainantAddress ?? "-"}\n\n` +
              `URL: ${data.locationUrl}\n\n` +
              `Work: ${data.workIdentified}\n\n` +
              `Signature: ${data.signature}\n` +
              (data.kind === "counter" ? `Consent to jurisdiction: yes\n` : ""),
          }),
        });
      }
    } catch { /* swallow */ }

    return { referenceId: row.reference_id };
  });
