import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/compliance-changelog")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin" as never,
    });
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: ChangeLogPage,
});

function ChangeLogPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10 text-[var(--ink)]">
      <div className="mb-6 rounded-md border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
        <strong>PENDING ATTORNEY REVIEW — NOT LEGALLY APPROVED.</strong> This
        document is an internal engineering summary of the Stage 1–6 compliance
        build. It is not legal advice and does not constitute review or
        approval by counsel. Do not publish, distribute, or rely on any
        legal-sounding statement in this file until reviewed by a licensed
        attorney for Streamwalkers Corporation.
      </div>
      <h1 className="text-3xl font-black">Compliance Build — Final Change Log</h1>
      <p className="mt-2 text-sm text-[var(--mute)]">
        Stages 1 through 6. Preview only; nothing in this build has been
        published to production.
      </p>

      <Section title="1. Repository-wide text sweep results">
        <ul className="list-disc pl-6 text-sm space-y-1">
          <li><strong>“LLC” references:</strong> None remain as entity references. The only surviving occurrences are (a) an historical Supabase migration seed row (immutable history) and (b) the third-party subprocessor entry “Google LLC,” which is that vendor’s real legal name. The live <code>site_copy.industry.hero.sub</code> row was updated in-place to remove “Astralnaut Studios LLC.”</li>
          <li><strong>“Raffle” references:</strong> No user-facing occurrences. <code>/raffle/rules</code> and <code>/raffle/free-entry</code> are permanent redirects to the sweepstakes routes. Remaining hits are in immutable migrations and the auto-generated route tree.</li>
          <li><strong>Footer copyright:</strong> Verified exact string in <code>site-header.tsx</code> and both locales of <code>i18n-dictionary.ts</code>.</li>
          <li><strong>Tier-weighted entry language:</strong> Fixed. Removed “Tier-weighted entries” in <code>growth-strategy.ts</code> and “earns more entries” in <code>StandingAndCancelFlow.tsx</code>. All copy now reads “one entry per entrant per period; tier does not affect odds.”</li>
          <li><strong>Bracketed placeholders in <code>src/config/legal.ts</code>:</strong> see Section 9.</li>
        </ul>
      </Section>

      <Section title="2. Signup clickwrap">
        <p className="text-sm">Enforced by <code>recordSignupConsent</code> (<code>src/lib/consent.functions.ts</code>). The signup form blocks submission until the consent checkbox is affirmatively checked; the error is announced via <code>role="alert"</code> + <code>aria-live="polite"</code> and the checkbox is <code>aria-invalid</code> + <code>aria-describedby</code>-linked to the message. The stored <code>consent_events</code> row captures <code>user_id</code>, <code>terms_version</code>, <code>privacy_version</code>, server-side timestamp, <code>ip</code>, <code>user_agent</code>, and <code>consent_text</code>. Insert is idempotent per user.</p>
      </Section>

      <Section title="3. Checkout consent">
        <p className="text-sm"><code>CheckoutConsentPanel</code> renders — immediately above the “Continue to payment” button — plan name, recurring price + currency, billing interval, automatic-renewal statement, cancellation path (<em>Account → Subscription → Cancel Subscription</em>), and refund rule. Both monthly and annual paths are covered. Checkout is blocked when the checkbox is unchecked (with an accessible error) and fail-closed if price/currency is missing or a placeholder. <code>recordCheckoutConsent</code> writes a <code>consent_events</code> row with <code>plan_id</code>, <code>plan_name</code>, <code>billing_interval</code>, <code>displayed_price</code>, <code>currency</code>, <code>terms_version</code>, <code>privacy_version</code>, <code>subscription_policy_version</code>, <code>renewal_disclosure_version</code>, timestamp, <code>user_id</code>, and <code>consent_text</code>. The row id is returned as the consent token that <code>createCheckoutSession</code> requires. The Stripe confirmation email template mirrors the disclosed terms and includes a direct cancellation link.</p>
      </Section>

      <Section title="4. Cancellation">
        <p className="text-sm">Account → Subscription → <em>Cancel Subscription</em> (<code>StandingAndCancelFlow.tsx</code>) is fully self-serve with no chat/phone/email requirement. A retention offer only appears after cancellation is confirmed and is skippable. Effective date is shown before final confirmation. Stripe call sets <code>cancel_at_period_end: true</code>; access is preserved through the paid term and no renewal charge fires after the effective date. An onscreen confirmation is shown and a receipt email is sent.</p>
      </Section>

      <Section title="5. Sweepstakes dedup and fail-closed activation">
        <p className="text-sm">The <code>sweepstakes_entries</code> table has <code>UNIQUE (promotion_id, dedup_key)</code> where <code>dedup_key</code> is a normalized (lowercased, trimmed) email hash. A paid subscriber gets one automatic entry per promotion; an anonymous AMOE entry uses the same key; a subscriber who also submits the free form is collapsed to a single row. No code path multiplies entries by tier. Free-entry form has an <em>unchecked</em> marketing-consent box; entry succeeds regardless of that box. Promotion activation is guarded by a fail-closed check that blocks any promotion missing prize, start/end dates, ARV, drawing date, eligibility, or Sponsor contact.</p>
      </Section>

      <Section title="6. Cookie behavior">
        <p className="text-sm">Before first consent, only strictly-necessary storage is written (auth session, CSRF, cart, cookie-consent record itself). Analytics/marketing SDKs load only via <code>loadIfConsented()</code>. Reject All keeps analytics off and purges first-party functional/analytics cookies; Accept All fires gated loads; withdrawing consent via the footer <em>Cookie Preferences</em> link re-runs the cleanup. GPC is detected on first visit and forces analytics + marketing to false, and the banner reflects it. Cookie-consent records live in a dedicated <code>cookie_consents</code> table, separate from marketing/newsletter consent (<code>leads</code>) and legal consent (<code>consent_events</code>).</p>
      </Section>

      <Section title="7. DSAR">
        <p className="text-sm"><code>/dsar</code> submits into <code>dsar_requests</code> with a reference ID. <code>submitDsarRequest</code> mints a SHA-256 hashed 48-hour verification token and emails a <code>/dsar/verify?ref=&amp;token=</code> link via Resend. Verification promotes the request to <em>verified / in_review</em>. Supported types: access, correct, delete, portability, opt-out (sale &amp; profiling), appeal, other. Retention cron anonymizes stale unverified requests.</p>
      </Section>

      <Section title="8. Accessibility pass">
        <p className="text-sm">Skip-to-content link on the root layout; global <code>:focus-visible</code> rings in <code>styles.css</code>; <code>useMotionPref</code> hook respects <code>prefers-reduced-motion</code> and exposes an in-reader motion toggle; <code>PhotosensitivityWarning</code> interstitial gates flagged issues. All modified forms (signup, checkout consent, cookie manager, sweepstakes AMOE, DSAR) use semantic <code>&lt;button&gt;</code>/<code>&lt;label&gt;</code>, keyboard operable, error summaries via <code>role="alert"</code>. Legal routes carry heading hierarchy, effective/last-updated dates from <code>LEGAL_CONFIG</code>, canonical URLs via <code>src/lib/seo.ts</code>, and print styles inherited from the base sheet. Build/typecheck are run automatically by the harness.</p>
      </Section>

      <Section title="9. Items requiring attorney approval or corporate input">
        <p className="text-sm font-bold text-[var(--gold)]">Bracketed placeholders in <code>src/config/legal.ts</code> (fail-closed guards prevent public rendering):</p>
        <ul className="list-disc pl-6 text-sm space-y-1">
          <li><code>corporate.address</code>: line1, city, state, zip — public business mailing address</li>
          <li><code>dmca.agent</code>: name, address, phone — DMCA agent designation (and USPTO/Copyright Office registration)</li>
          <li>All 12 <code>documents.*</code>: <code>effective</code> and <code>updated</code> dates</li>
          <li><code>community.reportWindowDays</code></li>
          <li><code>pricing.reader/initiate/patron</code>: monthly + annual prices (must match live Stripe prices)</li>
          <li><code>annualRenewalReminderLeadDays</code></li>
        </ul>
        <p className="text-sm mt-3 font-bold text-[var(--gold)]">Missing corporate / operational input:</p>
        <ul className="list-disc pl-6 text-sm space-y-1">
          <li>Launch territory / shipping territories</li>
          <li>Sweepstakes-specific prize, dates, ARV, official rules per promotion</li>
          <li>Winner-notification email templates (drafted but pending copy sign-off)</li>
          <li>Canonical live subscriber-count source for milestone auto-close</li>
          <li>pg_cron scheduling for renewal reminders and retention endpoints</li>
          <li>Canon-voting UI (deferred at Stage 4 acceptance)</li>
        </ul>
        <p className="text-sm mt-3 font-bold text-[var(--gold)]">Consent record types and storage:</p>
        <ul className="list-disc pl-6 text-sm space-y-1">
          <li><code>consent_events</code>: signup clickwrap, checkout consent, community-guidelines ack</li>
          <li><code>cookie_consents</code>: banner interactions, GPC-derived, preference changes</li>
          <li><code>leads</code>: newsletter opt-ins (double opt-in via <code>/api/public/leads/confirm</code>)</li>
          <li><code>dmca_notices</code>: takedown notices and counter-notices</li>
          <li><code>dsar_requests</code> + <code>dsar_verification_tokens</code>: privacy requests + email verification</li>
          <li><code>moderation_reports</code> + <code>user_suspensions</code>: UGC moderation</li>
          <li><code>appearance_releases</code>: cameo talent releases (production-gated)</li>
        </ul>
        <p className="text-sm mt-3 font-bold text-[var(--gold)]">Email templates (Resend):</p>
        <ul className="list-disc pl-6 text-sm space-y-1">
          <li>Newsletter double opt-in confirmation</li>
          <li>DSAR verification link</li>
          <li>Subscription receipt / renewal reminder</li>
          <li>Cancellation confirmation</li>
          <li>DMCA acknowledgement</li>
        </ul>
        <p className="text-sm mt-4">
          <strong>Deployment status:</strong> Nothing in Stages 1–6 has been
          published to production. All routes, migrations, and content live in
          the preview environment awaiting attorney review, corporate sign-off
          on the placeholders above, and an explicit publish action.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-black text-[var(--neon)]">{title}</h2>
      <div className="mt-3 rounded-md border border-[var(--border-line)] bg-black/30 p-4">
        {children}
      </div>
    </section>
  );
}
