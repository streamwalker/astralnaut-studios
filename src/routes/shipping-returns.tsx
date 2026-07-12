import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

const D = LEGAL_CONFIG.documents.shipping;

export const Route = createFileRoute("/shipping-returns")({
  head: () => metaFor({
    title: "Shipping and Returns — Streamwalkers Corporation",
    description: "Shipping, delivery, and returns policy for physical merchandise and Patron print benefits from AstralnautStudios.com.",
    path: "/shipping-returns",
  }),
  component: ShippingReturnsPage,
});

function ShippingReturnsPage() {
  return (
    <LegalPage
      title="Shipping and Returns"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/shipping-returns"
    >
      <p>Physical merchandise and Patron print benefits require a supported delivery address. Checkout must disclose shipping charges, estimated processing, supported regions, taxes and duties, preorder status, and material return restrictions.</p>
      <p>Custom, signed, numbered, personalized, digital, or made-to-order products may be final sale where lawful and clearly disclosed before purchase. Damaged, defective, or incorrect items should be reported within {LEGAL_CONFIG.shipping.reportWindowDays} days with order information and photographs. Digital subscription cancellation and refunds are governed by the Subscription and Billing Policy, not the merchandise return policy.</p>
      <p>Support: {LEGAL_CONFIG.contacts.shop}.</p>
    </LegalPage>
  );
}
