import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { LEGAL } from "@/lib/legal-meta";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Real World Comics" },
      { name: "description", content: "How Streamwalkers Corporation collects, uses, and protects personal data, and how to exercise your privacy rights under GDPR, CCPA, and other US state privacy laws." },
      { property: "og:title", content: "Privacy Policy — Real World Comics" },
      { property: "og:description", content: "Our privacy notice covering GDPR, CCPA/CPRA, and US state privacy laws." },
    ],
  }),
  component: PrivacyPage,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xs font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-[var(--mute)]">{children}</p>;
}

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-black text-[var(--ink)] md:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-xs text-[var(--fg-muted)]">Effective {LEGAL.effectiveDate}</p>

        <P>
          {LEGAL.entity} ("we," "us") operates {LEGAL.site} and the {LEGAL.imprints} imprints. This policy explains what personal data we collect, why, how long we keep it, who we share it with, and the rights you have under applicable laws including the EU/UK GDPR, the California Consumer Privacy Act as amended by the CPRA, and other US state privacy laws (Virginia VCDPA, Colorado CPA, Connecticut CTDPA, Utah UCPA, Texas TDPSA, Oregon OCPA, Montana MCDPA, Delaware DPDPA, Iowa ICDPA, Tennessee TIPA, and similar).
        </P>

        <H2>1. Information we collect</H2>
        <P><strong>You give us:</strong> email address, password (hashed), optional display name, billing details processed by Stripe, comments / letters / votes you submit, and survey or contact-form responses.</P>
        <P><strong>Collected automatically:</strong> IP address, browser type, device type, pages visited, referrer, approximate location derived from IP, and timestamps. We do this to operate the site, prevent abuse, and improve the product.</P>
        <P><strong>From third parties:</strong> sign-in identifiers from Google when you choose Google sign-in; payment status from Stripe; shop order details from Shopify.</P>

        <H2>2. How we use it</H2>
        <P>To provide and secure the service, process subscriptions and orders, deliver email you've asked for (drop alerts, confirmations), respond to support, comply with law, and analyze aggregate usage. We do not use your personal data to train AI models, and we do not sell personal data.</P>

        <H2>3. Legal bases (GDPR)</H2>
        <P>Contract (to deliver the service you signed up for), legitimate interests (security, fraud prevention, product analytics in aggregate), consent (optional analytics cookies, marketing email), and legal obligation (tax, accounting, responses to lawful requests).</P>

        <H2>4. Sharing</H2>
        <P>We share data only with the subprocessors listed on our <Link to="/subprocessors" className="underline">Subprocessors</Link> page, each bound by a written data processing agreement. We may disclose data when required by law, to enforce our terms, or to protect rights and safety.</P>

        <H2>5. International transfers</H2>
        <P>Our subprocessors include US-based providers. Where personal data of EU/UK residents is transferred outside the EEA/UK, we rely on Standard Contractual Clauses (SCCs) and the UK International Data Transfer Addendum as appropriate.</P>

        <H2>6. Retention</H2>
        <P>Account and order records: while the account is active plus up to 7 years for tax/dispute purposes. Letters and comments: until you delete them or your account. Visitor logs: rolling 30 days. Analytics events: up to 13 months. Email-list subscribers: until you unsubscribe.</P>

        <H2>7. Your rights</H2>
        <P>You may request access, correction, deletion, portability, and (for US state laws) opt-out of "sale" / "sharing" / targeted advertising and profiling. Submit a request through our <Link to="/dsar" className="underline">privacy request form</Link> or by emailing <a className="underline" href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>. We will verify your identity (typically by confirming control of the email on file) and respond within the statutory window (30 days under GDPR, 45 days under CCPA, extendable as permitted).</P>
        <P>You will not be discriminated against for exercising these rights. EU/UK residents may lodge a complaint with their local Data Protection Authority. California residents may designate an authorized agent.</P>

        <H2>8. "Do Not Sell or Share My Personal Information"</H2>
        <P>We do not sell personal information for money, and we do not "share" it for cross-context behavioral advertising as those terms are defined under California law. We automatically honor the Global Privacy Control (GPC) browser signal as an opt-out of any future such activity. You can re-confirm an opt-out at any time via the <Link to="/dsar" className="underline">privacy request form</Link>.</P>

        <H2>9. Cookies</H2>
        <P>See our <Link to="/cookies" className="underline">Cookie Policy</Link>. Optional cookies are off until you accept them and can be revoked anytime.</P>

        <H2>10. Children</H2>
        <P>The service is intended solely for adults 18 years of age or older. We do not knowingly collect personal data from anyone under 18. If you believe a minor has provided us data, contact us and we will delete it.</P>

        <H2>11. Security</H2>
        <P>TLS in transit, encryption at rest via our cloud provider, role-based access controls, hashed passwords, and audit-logged admin actions. See <Link to="/trust" className="underline">Trust & Security</Link> for details and how to report a vulnerability.</P>

        <H2>12. Changes</H2>
        <P>We will post material changes to this policy on this page and update the effective date.</P>

        <H2>13. Contact</H2>
        <P>{LEGAL.entity} — Privacy. Email: <a className="underline" href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.</P>
      </main>
      <SiteFooter />
    </div>
  );
}
