import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { LEGAL } from "@/lib/legal-meta";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Real World Comics" },
      { name: "description", content: "What cookies and similar technologies astralnautstudios.com uses, what they're for, and how to control them." },
      { property: "og:title", content: "Cookie Policy — Real World Comics" },
      { property: "og:description", content: "Cookie categories, purposes, retention, and how to opt out." },
    ],
  }),
  component: CookiesPage,
});

function clearConsent() {
  try {
    localStorage.removeItem("rwc-cookie-consent-v1");
    location.reload();
  } catch {
    /* ignore */
  }
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xs font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-[var(--mute)]">{children}</p>;
}

function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-black text-[var(--ink)] md:text-5xl">Cookie Policy</h1>
        <p className="mt-3 text-xs text-[var(--fg-muted)]">Effective {LEGAL.effectiveDate}</p>

        <P>This page explains the cookies and similar technologies (local storage, session storage) we use on {LEGAL.site}.</P>

        <H2>Categories</H2>
        <div className="mt-4 overflow-hidden rounded border border-[var(--border-line)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-[var(--ink)]">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Required?</th>
              </tr>
            </thead>
            <tbody className="text-[var(--mute)]">
              <tr className="border-t border-[var(--border-line)]">
                <td className="p-3 font-semibold text-[var(--ink)]">Essential</td>
                <td className="p-3">Keep you signed in, remember your cart, prevent fraud, balance load.</td>
                <td className="p-3">Yes — required for the site to work.</td>
              </tr>
              <tr className="border-t border-[var(--border-line)]">
                <td className="p-3 font-semibold text-[var(--ink)]">Analytics</td>
                <td className="p-3">Anonymized usage measurement to improve the site.</td>
                <td className="p-3">No — off by default, requires your consent.</td>
              </tr>
              <tr className="border-t border-[var(--border-line)]">
                <td className="p-3 font-semibold text-[var(--ink)]">Marketing</td>
                <td className="p-3">Currently unused. Reserved for future opt-in email or promotion attribution.</td>
                <td className="p-3">No — off by default.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <H2>Global Privacy Control</H2>
        <P>If your browser sends the GPC signal (<code>Sec-GPC: 1</code>), we automatically deny optional analytics and marketing cookies and treat it as an opt-out of any "sale" or "sharing" of personal information under US state privacy laws.</P>

        <H2>Manage your choices</H2>
        <P>You can change your preferences at any time. Clearing the saved consent shows the banner again on your next visit.</P>
        <button
          onClick={clearConsent}
          className="mt-3 rounded border border-[var(--border-line)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-white/5"
        >
          Reset cookie preferences
        </button>

        <H2>Browser controls</H2>
        <P>Most browsers let you block or delete cookies in their settings. Blocking essential cookies will break sign-in and checkout.</P>
      </main>
      <SiteFooter />
    </div>
  );
}
