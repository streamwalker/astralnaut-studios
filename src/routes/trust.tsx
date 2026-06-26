import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { LEGAL } from "@/lib/legal-meta";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust & Security — Real World Comics" },
      { name: "description", content: "How Real World Comics, LLC protects your data: encryption, access controls, subprocessors, retention, and how to report a vulnerability." },
      { property: "og:title", content: "Trust & Security — Real World Comics" },
      { property: "og:description", content: "Security and privacy practices for astralnautstudios.com." },
    ],
  }),
  component: TrustPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xs font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--mute)]">{children}</div>
    </section>
  );
}

function TrustPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-black text-[var(--ink)] md:text-5xl">Trust & Security</h1>
        <p className="mt-4 text-sm text-[var(--mute)]">
          This page is maintained by {LEGAL.entity} to answer common security and privacy questions about {LEGAL.site}. It describes practices that are live today. It is not an independent audit or certification.
        </p>

        <Section title="Access & Authentication">
          <p>Reader accounts use email-and-password or Google sign-in via our authentication provider. Passwords are never stored in plaintext — they are hashed by the provider.</p>
          <p>Admin access to publishing tools is gated by a role table checked on every privileged request, with all admin actions traceable to a signed-in user.</p>
        </Section>

        <Section title="Hosting & Encryption">
          <p>The site is delivered over HTTPS (TLS 1.2+) by Cloudflare. Application data is stored in a managed Postgres database with encryption at rest provided by our cloud provider. Payment card data is tokenized by Stripe and never reaches our servers.</p>
        </Section>

        <Section title="What we collect">
          <p>Account email, optional display name, subscription/order history, comments and votes you submit, and basic analytics (pages viewed, anonymized visit metadata) to operate and improve the service. See the <Link to="/privacy" className="underline">Privacy Policy</Link> for a full list.</p>
        </Section>

        <Section title="Subprocessors">
          <p>We use a small set of vendors to run the service. See the <Link to="/subprocessors" className="underline">Subprocessors list</Link> for current providers, what they do, and where they process data.</p>
        </Section>

        <Section title="Cookies & analytics">
          <p>Essential cookies keep you signed in and remember your cart. Optional analytics cookies are off until you accept them, and we automatically honor the Global Privacy Control (GPC) signal as an opt-out. Details in the <Link to="/cookies" className="underline">Cookie Policy</Link>.</p>
        </Section>

        <Section title="Retention & deletion">
          <p>We keep account and order data for as long as your account is active, plus a limited window afterward to meet tax and dispute obligations. Visitor analytics are kept on a short rolling window. You can request access, correction, or deletion at any time via our <Link to="/dsar" className="underline">privacy request form</Link>.</p>
        </Section>

        <Section title="Privacy & data rights">
          <p>If you live in the EU, UK, California, or another jurisdiction with a comprehensive privacy law, you have rights of access, correction, deletion, portability, and opt-out of "sale" or "sharing." Use the <Link to="/dsar" className="underline">privacy request form</Link> to exercise them. Read the <Link to="/privacy" className="underline">Privacy Policy</Link> for the full notice.</p>
        </Section>

        <Section title="Report a vulnerability">
          <p>We welcome coordinated disclosure from security researchers. Email <a className="underline" href={`mailto:${LEGAL.securityEmail}`}>{LEGAL.securityEmail}</a> with reproduction steps. Please give us a reasonable window to remediate before public disclosure. Our machine-readable contact lives at <a className="underline" href="/.well-known/security.txt">/.well-known/security.txt</a>.</p>
        </Section>

        <Section title="Compliance posture">
          <p>{LEGAL.entity} is a direct-to-consumer digital comics publisher. We are <strong>not</strong> currently audited under SOC 2, ISO 27001, HIPAA, PCI DSS Level 1, FedRAMP, HITRUST, CMMC, TISAX, NIS 2, or DORA, and we make no such claims. We process card payments through Stripe under SAQ-A scope. We will publish updates here if our certification status changes.</p>
        </Section>

        <p className="mt-12 text-xs text-[var(--fg-muted)]">Last updated {LEGAL.effectiveDate}. Questions: <a className="underline" href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
