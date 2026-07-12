// Canon voting & cameo terms acknowledgement (Stage 4).
//
// A one-time per-user acknowledgement, persisted as a `canon_terms_ack`
// consent_events row. Canon voting UI must call `hasCanonTermsAck` first
// and block voting until the user calls `acknowledgeCanonTerms`.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CANON_ACK_TEXT =
  "I have read the Canon Voting and Cameo Terms. I understand my votes are advisory, create no authorship, ownership, royalties, credit, or compensation, and that patron cameo access is eligibility for editorial consideration only — never a guaranteed appearance.";

export const acknowledgeCanonTerms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Idempotent: only insert if the caller has no prior ack.
    const { data: existing } = await supabaseAdmin
      .from("consent_events")
      .select("id")
      .eq("user_id", context.userId)
      .eq("event_type", "canon_terms_ack")
      .limit(1)
      .maybeSingle();
    if (existing) return { acknowledged: true, existing: true };

    const { error } = await supabaseAdmin.from("consent_events").insert({
      user_id: context.userId,
      event_type: "canon_terms_ack",
      consent_text: CANON_ACK_TEXT,
    });
    if (error) throw new Error(error.message);
    return { acknowledged: true, existing: false };
  });

export const hasCanonTermsAck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({}).default({}).parse(data ?? {}))
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("consent_events")
      .select("id, created_at")
      .eq("user_id", context.userId)
      .eq("event_type", "canon_terms_ack")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { acknowledged: !!data, acknowledgedAt: data?.created_at ?? null };
  });
