import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

const D = LEGAL_CONFIG.documents.privacy;

export const Route = createFileRoute("/privacy")({
  head: () => metaFor({
    title: "Privacy Policy — Streamwalkers Corporation",
    description: "How Streamwalkers Corporation collects, uses, discloses, and retains personal information for AstralnautStudios.com.",
    path: "/privacy",
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const addr = LEGAL_CONFIG.mailingAddress;
  return (
    <LegalPage
      title="Privacy Policy"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/privacy"
    >
      <h2>1. Scope and controller</h2>
      <p>Streamwalkers Corporation operates AstralnautStudios.com and the Astralnaut Studios and Real World Comics imprints. This Privacy Policy explains how Streamwalkers collects, uses, discloses, and retains personal information in connection with the Service.</p>
      <p>Streamwalkers Corporation is the controller or business responsible for the personal information described here. Contact: {LEGAL_CONFIG.contacts.privacy} or {addr.line1}, {addr.city}, {addr.state} {addr.zip}.</p>

      <h2>2. Information we collect</h2>
      <p><strong>Information you provide:</strong> name, email address, password credentials processed by our authentication provider, display name, profile details, age or eligibility confirmations, communications, support requests, comments, forum posts, letters, poll and canon votes, survey responses, marketing choices, sweepstakes entries, shipping address, order details, Discord handle, and information supplied for member benefits.</p>
      <p><strong>Subscription and transaction information:</strong> plan, subscription status, renewal and cancellation dates, transaction identifiers, purchase history, billing address, payment status, and limited payment details received from the payment processor. Streamwalkers does not intend to store full payment-card numbers.</p>
      <p><strong>Reading and engagement information:</strong> titles, issues and pages accessed; timestamps; progress; feature interactions; votes; referral source; and engagement with emails, promotions, and member benefits.</p>
      <p><strong>Device and network information:</strong> IP address, approximate location derived from IP, browser, operating system, device type, language, identifiers, cookie or local-storage data, log information, crash data, security events, and diagnostic information.</p>
      <p><strong>Information from third parties:</strong> authentication information from Google if you use Google sign-in; transaction and payment status from Stripe; store and fulfillment information from Shopify or shipping providers; community information from Discord when you choose to connect; and analytics or security information from approved providers.</p>
      <p><strong>Cameo and winner information:</strong> if selected, identity and eligibility documentation, mailing information, tax forms when required, publicity preferences, photographs or likeness materials, and a signed release. Do not collect government identification unless reasonably necessary and protected by appropriate controls.</p>

      <h2>3. How we use information</h2>
      <p>We use personal information to:</p>
      <ul>
        <li>create and secure accounts;</li>
        <li>provide subscriber access and track reading progress;</li>
        <li>process payments, orders, shipments, renewals, cancellations, and member benefits;</li>
        <li>administer polls, canon votes, community features, sweepstakes, and potential cameos;</li>
        <li>authenticate users, prevent fraud, piracy, abuse, and security incidents;</li>
        <li>provide support and send transactional communications;</li>
        <li>send marketing when permitted and honor unsubscribe requests;</li>
        <li>analyze performance and improve content, accessibility, and user experience;</li>
        <li>maintain records, enforce agreements, resolve disputes, and comply with law; and</li>
        <li>protect the rights, safety, and integrity of users, Streamwalkers, and others.</li>
      </ul>
      <p>We do not use subscriber comic pages, private communications, or personal information to train a general-purpose artificial-intelligence model unless we first provide a clear notice and obtain any legally required consent.</p>

      <h2>4. Legal bases for users in the EEA or UK</h2>
      <p>Where applicable, processing is based on performance of a contract, legitimate interests such as security and service improvement, consent for optional cookies or marketing, and compliance with legal obligations. Users may withdraw consent without affecting processing already performed. Streamwalkers must confirm whether it intentionally offers subscriptions to EEA or UK residents and, if so, complete appropriate transfer, representative, tax, and consumer-withdrawal compliance before launch.</p>

      <h2>5. How we disclose information</h2>
      <p>We may disclose information to service providers that perform hosting, authentication, content delivery, security, payments, commerce, fulfillment, communications, analytics, support, and professional services. Providers may use information only for contracted purposes subject to applicable agreements.</p>
      <p>We may also disclose information:</p>
      <ul>
        <li>when requested through valid legal process;</li>
        <li>to investigate fraud, security, abuse, piracy, or policy violations;</li>
        <li>to protect rights, safety, or property;</li>
        <li>in a merger, financing, reorganization, sale, bankruptcy, or transfer of all or part of the business, subject to applicable law; or</li>
        <li>with your direction or consent.</li>
      </ul>
      <p>We do not sell personal information for money. We do not share personal information for cross-context behavioral advertising unless the Privacy Policy and preference tools are updated before that activity begins.</p>

      <h2>6. Cookies and similar technology</h2>
      <p>We use necessary cookies and storage for authentication, security, carts, checkout, consent preferences, and core operation. Optional analytics or marketing technology will be activated only as described in the Cookie Policy and consent interface. Where legally required, optional technology remains off until consent.</p>
      <p>We honor Global Privacy Control as required by applicable law. Browser “Do Not Track” signals do not have a uniform legal meaning; our handling of them is described in the Cookie Policy.</p>

      <h2>7. Retention</h2>
      <p>We retain information only as long as reasonably necessary for the stated purpose, including:</p>
      <ul>
        <li>account and reading data while the account is active and for a limited period after closure;</li>
        <li>transaction, tax, shipping, and consent records for up to seven years or another legally required period;</li>
        <li>sweepstakes administration records for the period stated in the Official Rules and legal schedule;</li>
        <li>security logs for a limited period appropriate to investigation and prevention;</li>
        <li>support and dispute records while needed to resolve the matter and establish legal claims;</li>
        <li>community material until deleted, removed, or no longer needed; and</li>
        <li>marketing contact information until unsubscribe, plus a suppression record needed to honor the request.</li>
      </ul>
      <p>Streamwalkers must configure actual deletion schedules consistent with these statements.</p>

      <h2>8. Security</h2>
      <p>We use administrative, technical, and physical safeguards designed to protect information, but no system is completely secure. Users should use unique passwords, protect devices, and notify us of suspected unauthorized access. Do not state specific certifications, encryption versions, audit status, or controls unless verified for the production environment.</p>

      <h2>9. Your choices and rights</h2>
      <p>Depending on location and applicable law, users may request access, correction, deletion, portability, restriction, or an appeal; opt out of targeted advertising, sale, sharing, or certain profiling; withdraw consent; or complain to a regulator.</p>
      <p>Requests may be submitted at <a href="/dsar" className="underline">/dsar</a> or {LEGAL_CONFIG.contacts.privacy}. We may verify identity and authorized-agent status. We will not unlawfully discriminate against users for exercising privacy rights.</p>
      <p>Users may cancel marketing emails through the unsubscribe link. Transactional messages concerning accounts, billing, security, or policy changes may continue while an account remains active.</p>

      <h2>10. Children</h2>
      <p>The Service is not directed to children under 13, and we do not knowingly collect personal information directly from them. Paid accounts, sweepstakes, community participation, purchases, and cameo submissions are limited to adults who are at least 18. Contact {LEGAL_CONFIG.contacts.privacy} if you believe a child supplied information.</p>

      <h2>11. International transfers</h2>
      <p>Information may be processed in the United States and other locations where approved providers operate. Where required, we use recognized transfer mechanisms. Do not claim executed Standard Contractual Clauses or a UK addendum unless the relevant vendor agreements are in place.</p>

      <h2>12. Changes</h2>
      <p>We may update this policy. Material changes will be communicated as required by law. The effective date identifies the current version.</p>

      <h2>13. Contact</h2>
      <address>
        Streamwalkers Corporation<br />
        Attn: Privacy<br />
        {addr.line1}<br />
        {addr.city}, {addr.state} {addr.zip}<br />
        {LEGAL_CONFIG.contacts.privacy}
      </address>
    </LegalPage>
  );
}
