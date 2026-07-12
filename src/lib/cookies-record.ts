// Client wrapper that records a cookie-consent change to Supabase via the
// public REST API using the publishable/anon key. Splitting this into its
// own module keeps `cookies-client.ts` free of network side-effects at import
// time and makes it easy to swap for a server function later.

import { supabase } from "@/integrations/supabase/client";
import type { CookieConsentState } from "./cookies-client";

export async function recordCookieConsentClient(
  state: CookieConsentState,
  sessionId: string,
): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser();
    // Insert into public.cookie_consents. RLS lets anon+authenticated insert.
    await supabase.from("cookie_consents").insert({
      user_id: user.user?.id ?? null,
      session_id: sessionId,
      necessary: true,
      functional: state.functional,
      analytics: state.analytics,
      marketing: state.marketing,
      source: state.source,
      gpc_derived: state.gpcDerived,
      policy_version: state.policyVersion,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    } as never);
  } catch {
    /* swallow — logging must never break UX */
  }
}
