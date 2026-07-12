import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

const D = LEGAL_CONFIG.documents.subprocessors;

// Only vendors actually used in the production stack. Do not add rows that
// have not been verified in production, and do not claim executed DPAs/SCCs.
const ROWS: Array<{
  name: string; service: string; data: string; location: string; url: string;
}> = [
  { name: "Supabase (Lovable Cloud)", service: "Application database, authentication, file storage, edge functions", data: "Account email, hashed password, profile, subscription state, letters/comments, order metadata, visitor analytics, DSAR records", location: "United States", url: "https://supabase.com/privacy" },
  { name: "Cloudflare, Inc.", service: "CDN, DNS, TLS termination, edge runtime hosting", data: "IP address, request metadata", location: "Global edge; US-headquartered", url: "https://www.cloudflare.com/privacypolicy/" },
  { name: "Stripe, Inc.", service: "Payment processing for subscriptions", data: "Name, billing address, tokenized card data (not stored by us), transaction history", location: "United States / Ireland", url: "https://stripe.com/privacy" },
  { name: "Shopify Inc.", service: "Merchandise store and checkout", data: "Name, shipping address, order history, email", location: "Canada / United States", url: "https://www.shopify.com/legal/privacy" },
  { name: "Resend, Inc.", service: "Transactional email (subscriber alerts, confirmations, DSAR acknowledgements)", data: "Email address, message content, delivery metadata", location: "United States", url: "https://resend.com/legal/privacy-policy" },
  { name: "Google LLC", service: "Optional Google sign-in", data: "Email, OAuth identifier", location: "United States", url: "https://policies.google.com/privacy" },
  { name: "Discord Inc.", service: "External community for verified 18+ members (opt-in)", data: "Discord user handle when member opts to join", location: "United States", url: "https://discord.com/privacy" },
];

export const Route = createFileRoute("/subprocessors")({
  head: () => metaFor({
    title: "Subprocessors — Streamwalkers Corporation",
    description: "Vendors that process personal information on behalf of Streamwalkers Corporation to operate AstralnautStudios.com.",
    path: "/subprocessors",
  }),
  component: SubprocessorsPage,
});

function SubprocessorsPage() {
  return (
    <LegalPage
      title="Subprocessor Notice"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/subprocessors"
    >
      <p>Publish only vendors actually used in production. For each provider we list the legal vendor name, service, categories of data, processing location, and link to its privacy or security information. Streamwalkers does not currently claim that a Data Processing Addendum, Standard Contractual Clauses, or a UK transfer addendum has been executed with every vendor listed; contracts are being verified.</p>
      <table>
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Service</th>
            <th>Data categories</th>
            <th>Processing location</th>
            <th>Privacy page</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.service}</td>
              <td>{r.data}</td>
              <td>{r.location}</td>
              <td><a className="underline" href={r.url} target="_blank" rel="noopener noreferrer">Link</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Additional providers requiring verification before publication include additional analytics or error monitoring, customer support tooling, shipping and fulfillment services, and any AI service that may receive personal information. These will be listed only after being verified in the production environment.</p>
    </LegalPage>
  );
}
