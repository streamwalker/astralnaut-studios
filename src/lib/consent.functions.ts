// Server functions for capturing legally-relevant consent events.
// All writes go through supabaseAdmin (loaded inside the handler) so RLS
// stays locked down: users can read only their own rows.

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LEGAL_CONFIG } from "@/config/legal";

function reqMeta() {
  const ua = getRequestHeader("user-agent") ?? null;
  const ip = getRequestIP({ xForwardedFor: true }) ?? null;
  return { ua, ip };
}


// ---------------- SIGNUP CLICKWRAP ----------------
export const recordSignupConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { consentText: string }) =>
    z.object({ consentText: z.string().trim().min(20).max(1000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ua, ip } = reqMeta();

    // Idempotent: don't insert a duplicate signup_clickwrap row for the same user.
    const { data: existing } = await supabaseAdmin
      .from("consent_events")
      .select("id")
      .eq("user_id", context.userId)
      .eq("event_type", "signup_clickwrap")
      .limit(1)
      .maybeSingle();
    if (existing) return { ok: true, alreadyRecorded: true };

    const { error } = await supabaseAdmin.from("consent_events").insert({
      user_id: context.userId,
      event_type: "signup_clickwrap",
      terms_version: LEGAL_CONFIG.documents.terms.version,
      privacy_version: LEGAL_CONFIG.documents.privacy.version,
      consent_text: data.consentText,
      ip,
      user_agent: ua,
    });
    if (error) throw new Error(error.message);
    return { ok: true, alreadyRecorded: false };
  });

// ---------------- HAS SIGNUP CONSENT? ----------------
export const hasSignupConsent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("consent_events")
      .select("id")
      .eq("user_id", context.userId)
      .eq("event_type", "signup_clickwrap")
      .limit(1)
      .maybeSingle();
    return { hasConsent: !!data };
  });

// ---------------- CHECKOUT CONSENT ----------------
// Called by the client immediately before opening Stripe checkout. Returns
// a short-lived consent token that createCheckoutSession requires. The token
// is the inserted row id — its presence, event_type, and freshness are
// server-verified before creating a Stripe session.

const checkoutConsentSchema = z.object({
  planId: z.string().min(1).max(80),
  planName: z.string().min(1).max(200),
  billingInterval: z.enum(["monthly", "yearly"]),
  displayedPrice: z.number().finite().positive().max(100000),
  currency: z.string().min(3).max(6),
  consentText: z.string().trim().min(20).max(2000),
});

export const recordCheckoutConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkoutConsentSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ua, ip } = reqMeta();

    const { data: row, error } = await supabaseAdmin
      .from("consent_events")
      .insert({
        user_id: context.userId,
        event_type: "subscription_checkout",
        terms_version: LEGAL_CONFIG.documents.terms.version,
        privacy_version: LEGAL_CONFIG.documents.privacy.version,
        subscription_policy_version: LEGAL_CONFIG.documents.subscription.version,
        renewal_disclosure_version: LEGAL_CONFIG.renewalDisclosureVersion,
        plan_id: data.planId,
        plan_name: data.planName,
        billing_interval: data.billingInterval,
        displayed_price: data.displayedPrice,
        currency: data.currency.toUpperCase(),
        consent_text: data.consentText,
        ip,
        user_agent: ua,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to record consent");
    return { consentToken: row.id as string };
  });
