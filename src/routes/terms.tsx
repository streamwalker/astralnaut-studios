import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { LEGAL } from "@/lib/legal-meta";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Real World Comics" },
      { name: "description", content: "Terms governing your use of astralnautstudios.com and the Astralnaut Studios and Real World Comics imprints." },
      { property: "og:title", content: "Terms of Service — Real World Comics" },
      { property: "og:description", content: "The terms that apply when you read, subscribe, or shop on our site." },
    ],
  }),
  component: TermsPage,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xs font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-[var(--mute)]">{children}</p>;
}

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-black text-[var(--ink)] md:text-5xl">Terms of Service</h1>
        <p className="mt-3 text-xs text-[var(--fg-muted)]">Effective {LEGAL.effectiveDate}</p>

        <P>By using {LEGAL.site}, you agree to these terms. If you do not agree, do not use the service. The service is operated by {LEGAL.entity}.</P>

        <H2>Accounts</H2>
        <P>You must provide accurate information, keep your password secure, and you are responsible for activity on your account. You must be at least 13 years old (16 in jurisdictions that require it).</P>

        <H2>Subscriptions and purchases</H2>
        <P>Paid subscriptions renew automatically until cancelled. You can cancel anytime in your account. Refunds are handled case by case in line with applicable consumer law. Card payments are processed by Stripe under Stripe's terms.</P>

        <H2>Content and intellectual property</H2>
        <P>All comics, characters, art, and editorial content on this site are © {LEGAL.entity} and/or its licensors. You receive a personal, limited, non-transferable, revocable license to view content you have access to. You may not redistribute, scrape, or use the content to train machine-learning models without our written permission.</P>

        <H2>User submissions</H2>
        <P>If you post letters, comments, or votes, you grant us a worldwide, non-exclusive, royalty-free license to display, store, and use them in connection with operating the service. You are responsible for your submissions; do not post unlawful, infringing, or abusive content.</P>

        <H2>Acceptable use</H2>
        <P>Do not attempt to bypass paywalls, scrape protected content, probe for vulnerabilities outside our disclosure policy, or interfere with the service. We may suspend accounts that violate these rules.</P>

        <H2>Disclaimer & limitation of liability</H2>
        <P>The service is provided "as is" without warranties of any kind to the maximum extent allowed by law. To the maximum extent permitted by law, {LEGAL.entity}'s aggregate liability under these terms is limited to the greater of (a) the amount you paid us in the 12 months before the claim or (b) USD $100. Nothing in these terms limits liability that cannot be limited by law.</P>

        <H2>Governing law</H2>
        <P>These terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-laws principles, except where mandatory consumer-protection law of your residence applies.</P>

        <H2>Changes</H2>
        <P>We may update these terms. Material changes will be posted here with a new effective date.</P>

        <H2>Contact</H2>
        <P>Email <a className="underline" href={`mailto:${LEGAL.legalEmail}`}>{LEGAL.legalEmail}</a>.</P>
      </main>
      <SiteFooter />
    </div>
  );
}
