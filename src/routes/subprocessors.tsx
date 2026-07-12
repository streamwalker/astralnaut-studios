import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { LEGAL } from "@/lib/legal-meta";

export const Route = createFileRoute("/subprocessors")({
  head: () => ({
    meta: [
      { title: "Subprocessors — Real World Comics" },
      { name: "description", content: "The vendors Streamwalkers Corporation uses to operate astralnautstudios.com, what they do, and where they process data." },
      { property: "og:title", content: "Subprocessors — Real World Comics" },
      { property: "og:description", content: "Our current list of data subprocessors and their roles." },
    ],
  }),
  component: SubprocessorsPage,
});

const ROWS: { name: string; purpose: string; data: string; region: string; site: string }[] = [
  { name: "Lovable Cloud (Supabase)", purpose: "Application database, authentication, file storage", data: "Account email, hashed password, profile, subscription state, letters/comments, order metadata, visitor analytics", region: "United States", site: "https://supabase.com/privacy" },
  { name: "Cloudflare", purpose: "CDN, DNS, TLS termination, edge runtime (Workers)", data: "IP address, request metadata", region: "Global edge; US-headquartered", site: "https://www.cloudflare.com/privacypolicy/" },
  { name: "Stripe", purpose: "Payment processing for subscriptions", data: "Name, billing address, card data (tokenized; not stored by us), transaction history", region: "United States / Ireland", site: "https://stripe.com/privacy" },
  { name: "Shopify", purpose: "Merchandise store and checkout", data: "Name, shipping address, order history, email", region: "Canada / United States", site: "https://www.shopify.com/legal/privacy" },
  { name: "Resend", purpose: "Transactional email (drop alerts, confirmations, account email)", data: "Email address, message content, delivery metadata", region: "United States", site: "https://resend.com/legal/privacy-policy" },
  { name: "Google (Sign-In)", purpose: "Optional OAuth sign-in", data: "Email, OAuth identifier", region: "United States", site: "https://policies.google.com/privacy" },
];

function SubprocessorsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-black text-[var(--ink)] md:text-5xl">Subprocessors</h1>
        <p className="mt-3 text-xs text-[var(--fg-muted)]">Last updated {LEGAL.effectiveDate}</p>
        <p className="mt-4 text-sm leading-relaxed text-[var(--mute)]">
          {LEGAL.entity} uses the following vendors to operate {LEGAL.site}. Each is bound by a written data processing agreement. International transfers of EU/UK personal data rely on Standard Contractual Clauses where applicable. We will update this page when we add or remove a vendor.
        </p>

        <div className="mt-8 overflow-x-auto rounded border border-[var(--border-line)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-[var(--ink)]">
              <tr>
                <th className="p-3">Vendor</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Categories of data</th>
                <th className="p-3">Processing region</th>
              </tr>
            </thead>
            <tbody className="text-[var(--mute)]">
              {ROWS.map((r) => (
                <tr key={r.name} className="border-t border-[var(--border-line)] align-top">
                  <td className="p-3 font-semibold text-[var(--ink)]">
                    <a href={r.site} target="_blank" rel="noopener noreferrer" className="underline">{r.name}</a>
                  </td>
                  <td className="p-3">{r.purpose}</td>
                  <td className="p-3">{r.data}</td>
                  <td className="p-3">{r.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-xs text-[var(--fg-muted)]">Questions: <a className="underline" href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
