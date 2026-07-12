import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { createHash, randomBytes } from "crypto";

const REQUEST_TYPES = ["access", "correct", "delete", "portability", "opt_out_sale", "opt_out_profiling", "appeal", "other"] as const;

const submitSchema = z.object({
  requestType: z.enum(REQUEST_TYPES),
  requesterEmail: z.string().email().max(320),
  region: z.string().max(60).optional().nullable(),
  details: z.string().max(4000).optional().nullable(),
  authorizedAgent: z.boolean().optional().default(false),
});

// Token TTL — the emailed verification link expires in this many hours.
const VERIFY_TTL_HOURS = 48;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const submitDsarRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let ip: string | null = null;
    let ua: string | null = null;
    let origin: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
      ua = getRequestHeader("user-agent") ?? null;
      const host = getRequestHeader("host");
      const proto = getRequestHeader("x-forwarded-proto") ?? "https";
      if (host) origin = `${proto}://${host}`;
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
        verification_status: "pending",
        ip: ip as unknown as string | null,
        user_agent: ua,
      })
      .select("id, reference_id")
      .single();
    if (error) throw new Error(error.message);

    // Mint a verification token (raw returned only in email; only hash stored).
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + VERIFY_TTL_HOURS * 60 * 60 * 1000);
    await supabaseAdmin.from("dsar_verification_tokens").insert({
      dsar_request_id: row.id,
      token_hash: hashToken(token),
      expires_at: expiresAt.toISOString(),
    });

    // Best-effort confirmation email via Resend. Never throw.
    let deliveredVia: "email" | "manual" = "manual";
    try {
      const key = process.env.RESEND_API_KEY;
      if (key && origin) {
        const verifyUrl = `${origin}/dsar/verify?ref=${encodeURIComponent(row.reference_id)}&token=${encodeURIComponent(token)}`;
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            from: "Streamwalkers Privacy <privacy@astralnautstudios.com>",
            to: [data.requesterEmail],
            subject: `Confirm your privacy request (${row.reference_id})`,
            text:
              `We received your ${data.requestType} request.\n\n` +
              `Reference ID: ${row.reference_id}\n\n` +
              `Please confirm this request came from you by visiting the link below within ${VERIFY_TTL_HOURS} hours:\n\n` +
              `${verifyUrl}\n\n` +
              `If you did not submit this request, ignore this email and it will expire automatically.\n\n` +
              `— Streamwalkers Corporation, Privacy team`,
          }),
        });
        if (res.ok) deliveredVia = "email";
      }
    } catch {
      /* swallow */
    }
    return { referenceId: row.reference_id, deliveredVia };
  });

const verifySchema = z.object({
  referenceId: z.string().min(4).max(64),
  token: z.string().min(10).max(200),
});

/**
 * Consumes a DSAR verification token. Requires that the ref+token pair matches
 * a non-expired, non-consumed record. On success flips the DSAR to
 * verification_status='verified' and status='in_review'.
 */
export const verifyDsarRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req } = await supabaseAdmin
      .from("dsar_requests")
      .select("id, verification_status")
      .eq("reference_id", data.referenceId)
      .maybeSingle();
    if (!req) return { ok: false as const, reason: "not_found" as const };
    if (req.verification_status === "verified") return { ok: true as const, alreadyVerified: true };

    const tokenHash = hashToken(data.token);
    const { data: tok } = await supabaseAdmin
      .from("dsar_verification_tokens")
      .select("id, expires_at, consumed_at, dsar_request_id")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (!tok || tok.dsar_request_id !== req.id) return { ok: false as const, reason: "invalid" as const };
    if (tok.consumed_at) return { ok: false as const, reason: "already_used" as const };
    if (new Date(tok.expires_at).getTime() < Date.now()) return { ok: false as const, reason: "expired" as const };

    await supabaseAdmin
      .from("dsar_verification_tokens")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", tok.id);
    await supabaseAdmin
      .from("dsar_requests")
      .update({ verification_status: "verified", status: "in_review" })
      .eq("id", req.id);
    return { ok: true as const, alreadyVerified: false };
  });
