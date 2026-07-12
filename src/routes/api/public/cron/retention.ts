// Retention cleanup cron endpoint.
//
// Purges/anonymizes data classes that have exceeded the periods documented in
// the Privacy Policy retention schedule:
//   1) Expired, un-consumed DSAR verification tokens (48h TTL)
//   2) Stale unverified DSAR requests older than 30 days (still-unverified)
//   3) Analytics events older than 180 days (aggregate signal only, no PII)
//   4) Visitor hits older than 90 days (contain IP/UA)
//   5) Storage access logs older than 90 days (contain IP/UA)
//
// consent_events, cookie_consents, sweepstakes_entries/drawings, and
// dmca_notices are retained as legal records and are NOT touched.
//
// Protected by HMAC(secret=ARCHIVE_GAME_EVENTS_HMAC_SECRET, body=timestamp)
// using the same pattern as renewal-reminders.

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function verify(req: Request, body: string): boolean {
  const secret = process.env.ARCHIVE_GAME_EVENTS_HMAC_SECRET;
  const sig = req.headers.get("x-cron-signature");
  const ts = req.headers.get("x-cron-timestamp");
  if (!secret || !sig || !ts) return false;
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function run() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date();
  const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const result: Record<string, number | string> = {};

  // 1) Expired verification tokens (past expires_at, never consumed).
  {
    const { count } = await supabaseAdmin
      .from("dsar_verification_tokens")
      .delete({ count: "exact" })
      .lt("expires_at", now.toISOString())
      .is("consumed_at", null);
    result.expired_verification_tokens = count ?? 0;
  }

  // 2) Stale unverified DSAR requests older than 30 days.
  {
    const { count } = await supabaseAdmin
      .from("dsar_requests")
      .delete({ count: "exact" })
      .lt("created_at", iso(30))
      .eq("verification_status", "unverified");
    result.stale_unverified_dsars = count ?? 0;
  }

  // 3) Analytics events older than 180 days.
  {
    const { count } = await supabaseAdmin
      .from("analytics_events")
      .delete({ count: "exact" })
      .lt("created_at", iso(180));
    result.analytics_events_purged = count ?? 0;
  }

  // 4) Visitor hits older than 90 days (IP/UA).
  {
    const { count } = await supabaseAdmin
      .from("visitor_hits")
      .delete({ count: "exact" })
      .lt("created_at", iso(90));
    result.visitor_hits_purged = count ?? 0;
  }

  // 5) Storage access logs older than 90 days.
  {
    const { count } = await supabaseAdmin
      .from("storage_access_logs")
      .delete({ count: "exact" })
      .lt("created_at", iso(90));
    result.storage_access_logs_purged = count ?? 0;
  }

  return result;
}

export const Route = createFileRoute("/api/public/cron/retention")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        if (!verify(request, body)) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        try {
          const summary = await run();
          return new Response(JSON.stringify({ ok: true, summary }), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});
