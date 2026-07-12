import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

export const Route = createFileRoute("/trust")({
  head: () => metaFor({
    title: "Trust Center — Streamwalkers Corporation",
    description: "Every legal, privacy, security, and compliance policy for AstralnautStudios.com, in one place.",
    path: "/trust",
  }),
  component: TrustPage,
});

const LINKS: Array<{ to: string; label: string; blurb: string }> = [
  { to: "/terms",                    label: "Terms of Service",                blurb: "The contract that governs your access and use of the Service." },
  { to: "/subscription-policy",      label: "Subscription & Billing Policy",   blurb: "How renewals, cancellation, refunds, and price changes work." },
  { to: "/privacy",                  label: "Privacy Policy",                  blurb: "What personal information we collect and how it is used." },
  { to: "/cookies",                  label: "Cookie Policy",                   blurb: "Necessary and optional cookies, and how to change your choices." },
  { to: "/community-guidelines",     label: "Community Guidelines",            blurb: "Rules for participating in comments, letters, and Discord." },
  { to: "/copyright-dmca",           label: "Copyright & DMCA Policy",         blurb: "How to report copyright infringement; DMCA agent contact." },
  { to: "/sweepstakes/rules",        label: "Milestone Sweepstakes Rules",     blurb: "Standing template Official Rules — no promotion currently open." },
  { to: "/canon-cameo-terms",        label: "Canon & Cameo Terms",             blurb: "How canon voting and cameo eligibility work; no rights transfer." },
  { to: "/unsolicited-submissions",  label: "Unsolicited Submissions Policy",  blurb: "We do not accept unsolicited pitches, scripts, or artwork." },
  { to: "/content-accessibility",    label: "Content & Accessibility Notice",  blurb: "Fiction notice, content advisories, accessibility commitments." },
  { to: "/shipping-returns",         label: "Shipping & Returns",              blurb: "Delivery, taxes, and returns for physical merchandise." },
  { to: "/subprocessors",            label: "Subprocessors",                   blurb: "Vendors that process data on our behalf." },
  { to: "/corporate",                label: "Corporate Information",           blurb: "Legal entity, mailing address, and contact directory." },
  { to: "/dsar",                     label: "Your Privacy Rights",             blurb: "Submit an access, correction, deletion, or opt-out request." },
];

function TrustPage() {
  return (
    <LegalPage
      title="Trust Center"
      eyebrow="Streamwalkers Corporation"
      effective={LEGAL_CONFIG.documents.terms.effective}
      canonical="/trust"
    >
      <p>Every legal, privacy, security, and compliance document for {LEGAL_CONFIG.site} in one place. This page is maintained by Streamwalkers Corporation to answer common security and privacy questions about the Astralnaut Studios and Real World Comics services. It is not an independent certification.</p>

      <h2>Security contact</h2>
      <p>Report a vulnerability or security concern to <a href={`mailto:${LEGAL_CONFIG.contacts.security}`} className="underline">{LEGAL_CONFIG.contacts.security}</a>. Please provide enough detail to reproduce the issue. Do not perform testing that would degrade service or expose other users’ data.</p>
      <p>See also: <a href="/.well-known/security.txt" className="underline">security.txt</a>.</p>

      <h2>Policies</h2>
      <ul>
        {LINKS.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-[var(--ink)] underline">{l.label}</Link>
            {" — "}
            <span>{l.blurb}</span>
          </li>
        ))}
      </ul>
    </LegalPage>
  );
}
