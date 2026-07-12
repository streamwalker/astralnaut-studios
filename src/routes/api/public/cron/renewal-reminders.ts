// Annual renewal reminder cron endpoint.
// Protected by HMAC(secret=ARCHIVE_GAME_EVENTS_HMAC_SECRET, body=timestamp)
// so an external scheduler (or pg_cron via net.http_post) can trigger it.
// Sends a one-time reminder to yearly subscribers whose current_period_end
// is within LEGAL_CONFIG.annualRenewalReminderLeadDaysEffective days.

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendAnnualRenewalReminderEmail } from "@/lib/emails.server";
import { LEGAL_CONFIG, annualRenewalReminderLeadDaysEffective } from "@/config/legal";
import { createStripeClient } from "@/lib/stripe.server";

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

async function runReminders(): Promise<{ sent: number; skipped: number; errors: number }> {
  const lead = annualRenewalReminderLeadDaysEffective();
  const from = new Date();
  const to = new Date(Date.now() + lead * 24 * 60 * 60 * 1000);

  // Yearly, not-yet-cancelling, in-window renewals.
  const { data: subs, error } = await (supabaseAdmin as any)
    .from("subscriptions")
    .select("id, user_id, stripe_subscription_id, stripe_customer_id, price_id, current_period_end, cancel_at_period_end, status, environment")
    .in("status", ["active", "trialing"])
    .eq("cancel_at_period_end", false)
    .like("price_id", "%_yearly")
    .gt("current_period_end", from.toISOString())
    .lt("current_period_end", to.toISOString());
  if (error) throw new Error(error.message);

  let sent = 0, skipped = 0, errors = 0;
  const origin = process.env.SITE_URL || "https://astralnautstudios.com";

  for (const sub of subs ?? []) {
    // Idempotency: skip if we already sent a reminder for this period.
    const { data: prior } = await (supabaseAdmin as any)
      .from("consent_events")
      .select("id")
      .eq("stripe_subscription_id", sub.stripe_subscription_id)
      .eq("event_type", "annual_renewal_reminder")
      .eq("effective_end_date", sub.current_period_end)
      .maybeSingle();
    if (prior) { skipped++; continue; }

    try {
      const { data: userRes } = await (supabaseAdmin as any).auth.admin.getUserById(sub.user_id);
      const email = userRes?.user?.email;
      if (!email) { skipped++; continue; }

      // Look up current Stripe price for accurate figure.
      const stripe = createStripeClient(sub.environment);
      const prices = await stripe.prices.list({ lookup_keys: [sub.price_id] });
      const price = prices.data[0];
      const amount = (price?.unit_amount ?? 0) / 100;
      const currency = (price?.currency ?? "usd").toUpperCase();

      await sendAnnualRenewalReminderEmail({
        to: email,
        planName: sub.price_id,
        renewalDate: new Date(sub.current_period_end),
        displayedPrice: amount,
        currency,
        cancelUrl: `${origin}/account`,
      });

      await (supabaseAdmin as any).from("consent_events").insert({
        user_id: sub.user_id,
        event_type: "annual_renewal_reminder",
        plan_id: sub.price_id,
        plan_name: sub.price_id,
        billing_interval: "yearly",
        displayed_price: amount,
        currency,
        stripe_subscription_id: sub.stripe_subscription_id,
        effective_end_date: sub.current_period_end,
        renewal_disclosure_version: LEGAL_CONFIG.renewalDisclosureVersion,
        consent_text: `Automated annual-renewal reminder sent ${lead} days before renewal.`,
      });
      sent++;
    } catch (e) {
      console.error("[renewal-reminder] failed for sub", sub.stripe_subscription_id, e);
      errors++;
    }
  }
  return { sent, skipped, errors };
}

export const Route = createFileRoute("/api/public/cron/renewal-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        if (!verify(request, body)) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const result = await runReminders();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          console.error("[renewal-reminder] fatal", e);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
