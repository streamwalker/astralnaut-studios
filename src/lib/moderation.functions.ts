import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

const CONTENT_KIND = ["letter", "letter_comment", "profile", "other"] as const;
const REASONS = [
  "harassment",
  "hate_speech",
  "sexual_exploitation",
  "doxing",
  "impersonation",
  "spam",
  "malware",
  "piracy_or_unauthorized_copies",
  "infringement",
  "self_harm",
  "other",
] as const;

const reportSchema = z.object({
  contentKind: z.enum(CONTENT_KIND),
  contentRef: z.string().min(1).max(200),
  reason: z.enum(REASONS),
  details: z.string().max(2000).optional().nullable(),
});

export const reportContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reportSchema.parse(data))
  .handler(async ({ data, context }) => {
    let ip: string | null = null;
    let ua: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
      ua = getRequestHeader("user-agent") ?? null;
    } catch {
      /* ignore */
    }
    const { error } = await context.supabase.from("moderation_reports").insert({
      content_kind: data.contentKind,
      content_ref: data.contentRef,
      reason: data.reason,
      details: data.details ?? null,
      reporter_user_id: context.userId,
      ip: ip as unknown as string | null,
      user_agent: ua,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/**
 * Returns the current user's active suspension, if any. Composers must call
 * this before allowing a post/comment; the DB view `is_user_suspended` also
 * enforces the rule server-side.
 */
export const myActiveSuspension = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const nowIso = new Date().toISOString();
    const { data } = await context.supabase
      .from("user_suspensions")
      .select("id, reason, starts_at, ends_at")
      .eq("user_id", context.userId)
      .is("lifted_at", null)
      .lte("starts_at", nowIso)
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  });
