// Client-side community-guidelines acknowledgement gate.
//
// The gate is recorded to `consent_events` with event_type
// 'community_guidelines_ack' so the acknowledgement is an auditable record and
// survives across devices for signed-in users; a local mirror in localStorage
// avoids re-prompting the same browser between visits before the row round-trips.

import { supabase } from "@/integrations/supabase/client";
import { LEGAL_CONFIG } from "@/config/legal";

const LOCAL_ACK_KEY = "rwc-community-ack-v1";

function version(): string {
  return LEGAL_CONFIG.documents.communityGuidelines?.version ?? "v1";
}

export async function hasCommunityAck(): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      const v = localStorage.getItem(LOCAL_ACK_KEY);
      if (v === version()) return true;
    } catch { /* ignore */ }
  }
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;
  const { data } = await supabase
    .from("consent_events")
    .select("id")
    .eq("user_id", user.user.id)
    .eq("event_type", "community_guidelines_ack")
    .eq("document_version", version())
    .limit(1)
    .maybeSingle();
  const ack = Boolean(data);
  if (ack && typeof window !== "undefined") {
    try { localStorage.setItem(LOCAL_ACK_KEY, version()); } catch { /* ignore */ }
  }
  return ack;
}

export async function recordCommunityAck(): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Sign in to acknowledge the community guidelines.");
  await supabase.from("consent_events").insert({
    user_id: user.user.id,
    event_type: "community_guidelines_ack",
    document_slug: "community-guidelines",
    document_version: version(),
    consent_text: "I have read and agree to the Community Guidelines.",
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
  } as never);
  if (typeof window !== "undefined") {
    try { localStorage.setItem(LOCAL_ACK_KEY, version()); } catch { /* ignore */ }
  }
}
