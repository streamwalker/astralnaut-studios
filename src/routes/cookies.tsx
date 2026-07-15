import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";
import { COOKIE_INVENTORY, COOKIE_INVENTORY_VERIFIED_AT } from "@/config/cookies";
import { openCookiePreferences } from "@/lib/cookies-client";

const D = LEGAL_CONFIG.documents.cookies;

export const Route = createFileRoute("/cookies")({
  head: () => metaFor({
    title: "Cookie Policy — Streamwalkers Corporation",
    description: "Necessary and optional cookies, local storage, pixels, and similar technologies used by AstralnautStudios.com.",
    path: "/cookies",
  }),
  component: CookiesPage,
});

const CATEGORY_LABEL: Record<string, string> = {
  necessary: "Necessary",
  functional: "Functional",
  analytics: "Analytics",
  marketing: "Marketing",
};

function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/cookies"
    >
      <p>AstralnautStudios.com uses cookies, local storage, session storage, and similar technologies. Necessary technologies support sign-in, security, carts, checkout, load balancing, consent choices, and account features. Functional technologies remember non-essential preferences such as your language and whether you disabled non-essential animations. Analytics technologies (first-party only) measure use and performance and load only after you consent. Marketing technologies would enable advertising or cross-site tracking — none are currently deployed; the category exists so any future addition must pass the same consent gate before it can run.</p>

      <h2>Technologies verified in use</h2>
      <p><em>Inventory verified on {COOKIE_INVENTORY_VERIFIED_AT}. This table lists what the site is actually observed to set, not a generic template.</em></p>
      <div className="table-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Category</th>
              <th>Party</th>
              <th>Storage</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {COOKIE_INVENTORY.map((c) => (
              <tr key={c.name + c.provider}>
                <td>{c.name}</td>
                <td>{c.provider}</td>
                <td>{c.purpose}</td>
                <td>{CATEGORY_LABEL[c.category]}</td>
                <td>{c.party}</td>
                <td>{c.storage}</td>
                <td>{c.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Your controls</h2>
      <p>Necessary technologies cannot be disabled through the preference center because the Service cannot function without them. Functional, analytics, and marketing categories are opt-in and can be changed or withdrawn at any time. Withdrawal takes effect immediately: category cookies are removed where feasible and the associated scripts are unloaded. We honor the Global Privacy Control (Sec-GPC) browser signal — when present we automatically treat analytics and marketing as opted out and record that the choice was derived from GPC.</p>
      <p>
        <button
          type="button"
          onClick={() => openCookiePreferences()}
          className="mt-2 rounded border border-[var(--border-line)] px-3 py-2 text-xs uppercase tracking-widest text-[var(--ink)] hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--neon)]"
        >
          Manage cookie preferences
        </button>
      </p>

      <h2>Questions</h2>
      <p>{LEGAL_CONFIG.contacts.privacy}.</p>
    </LegalPage>
  );
}
