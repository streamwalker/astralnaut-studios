import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

const D = LEGAL_CONFIG.documents.subscription;

export const Route = createFileRoute("/subscription-policy")({
  head: () => metaFor({
    title: "Subscription and Billing Policy — Streamwalkers Corporation",
    description: "How subscriptions, automatic renewal, cancellation, refunds, and price changes work on astralnautstudios.com.",
    path: "/subscription-policy",
  }),
  component: SubscriptionPolicyPage,
});

function SubscriptionPolicyPage() {
  return (
    <LegalPage
      title="Subscription and Billing Policy"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/subscription-policy"
    >
      <ol>
        <li><strong>Automatic renewal.</strong> Monthly and annual subscriptions renew automatically until canceled.</li>
        <li><strong>Charges.</strong> The checkout page displays the amount, currency, tax treatment, billing interval, trial or promotion if any, and renewal terms before enrollment.</li>
        <li><strong>Consent.</strong> We obtain affirmative consent to recurring charges and retain a record of the consent.</li>
        <li><strong>Cancellation.</strong> Members may cancel through Account &gt; Subscription. Cancellation does not require a telephone call, chat, or email. A confirmation appears onscreen and is sent by email.</li>
        <li><strong>Effective date.</strong> Cancellation takes effect at the end of the current paid billing period unless applicable law requires a different result. Members ordinarily retain access through that date.</li>
        <li><strong>Refunds.</strong> Except where required by law or expressly stated in a promotion, fees are nonrefundable and no prorated refunds or credits are provided. We may issue discretionary credits.</li>
        <li><strong>Failed payments.</strong> We may retry a failed charge and suspend paid benefits until payment succeeds.</li>
        <li><strong>Plan changes.</strong> Upgrades may take effect immediately with a prorated charge or credit disclosed before confirmation. Downgrades ordinarily take effect at the next renewal.</li>
        <li><strong>Price changes.</strong> Existing members receive legally required advance notice. A member may cancel before the new price takes effect.</li>
        <li><strong>Annual reminders.</strong> Streamwalkers should send a renewal reminder before annual renewals and whenever required by applicable state law.</li>
        <li><strong>Taxes.</strong> Prices may exclude sales, use, value-added, or similar taxes. The checkout page will show applicable amounts.</li>
        <li><strong>Physical Patron benefits.</strong> Eligibility for a quarterly print should be defined by a published record date. Members must maintain a valid shipping address. International duties and unsupported destinations must be disclosed before enrollment. A selected cameo requires a separate release and is never guaranteed.</li>
        <li><strong>Third-party billing.</strong> If subscriptions later become available through an app store or partner, that provider’s billing and cancellation rules may apply, and cancellation may need to occur through that provider.</li>
        <li><strong>Billing support.</strong> {LEGAL_CONFIG.contacts.billing}.</li>
      </ol>
    </LegalPage>
  );
}
