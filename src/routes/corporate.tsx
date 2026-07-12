import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

export const Route = createFileRoute("/corporate")({
  head: () => metaFor({
    title: "Corporate Information — Streamwalkers Corporation",
    description: "Corporate information and contact directory for Streamwalkers Corporation and its Astralnaut Studios and Real World Comics imprints.",
    path: "/corporate",
  }),
  component: CorporatePage,
});

function CorporatePage() {
  const c = LEGAL_CONFIG.contacts;
  const addr = LEGAL_CONFIG.mailingAddress;
  return (
    <LegalPage
      title="Corporate Information"
      eyebrow="Streamwalkers Corporation"
      effective={LEGAL_CONFIG.documents.terms.effective}
      canonical="/corporate"
    >
      <p>AstralnautStudios.com is operated by:</p>
      <address>
        <strong>Streamwalkers Corporation</strong><br />
        A Delaware corporation<br />
        {addr.line1}<br />
        {addr.city}, {addr.state} {addr.zip}
      </address>
      <p>Astralnaut Studios and Real World Comics are publishing and entertainment imprints of Streamwalkers Corporation. Unless expressly stated in a written agreement, they are not separate legal entities.</p>

      <h2>Contact directory</h2>
      <ul>
        <li>General support: <a className="underline" href={`mailto:${c.support}`}>{c.support}</a></li>
        <li>Billing: <a className="underline" href={`mailto:${c.billing}`}>{c.billing}</a></li>
        <li>Privacy: <a className="underline" href={`mailto:${c.privacy}`}>{c.privacy}</a></li>
        <li>Legal: <a className="underline" href={`mailto:${c.legal}`}>{c.legal}</a></li>
        <li>Copyright/DMCA: <a className="underline" href={`mailto:${c.dmca}`}>{c.dmca}</a></li>
        <li>Security: <a className="underline" href={`mailto:${c.security}`}>{c.security}</a></li>
        <li>Accessibility: <a className="underline" href={`mailto:${c.accessibility}`}>{c.accessibility}</a></li>
        <li>Promotions: <a className="underline" href={`mailto:${c.promotions}`}>{c.promotions}</a></li>
      </ul>
    </LegalPage>
  );
}
