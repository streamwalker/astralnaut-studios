import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";
import { COOKIE_INVENTORY, INVENTORY_COMPLETE } from "@/config/cookies";

const D = LEGAL_CONFIG.documents.cookies;

export const Route = createFileRoute("/cookies")({
  head: () => metaFor({
    title: "Cookie Policy — Streamwalkers Corporation",
    description: "Necessary and optional cookies, local storage, pixels, and similar technologies used by AstralnautStudios.com.",
    path: "/cookies",
  }),
  component: CookiesPage,
});

function clearConsent() {
  try {
    localStorage.removeItem("rwc-cookie-consent-v1");
    location.reload();
  } catch { /* ignore */ }
}

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
      <p>AstralnautStudios.com uses cookies, local storage, pixels, SDKs, and similar technologies. Necessary technologies support sign-in, security, carts, checkout, load balancing, consent choices, and account features. Optional analytics measure use and performance. Optional marketing technologies, if introduced, may measure campaigns or personalize advertising.</p>
      <p>The production Cookie Policy must include an automatically maintained table containing the exact technology name, provider, purpose, category, first- or third-party status, and duration. Do not publish a generic table as if it were a verified scan.</p>

      <h2>Verified technologies currently in use</h2>
      {!INVENTORY_COMPLETE ? (
        <p><em>The table below lists only the necessary and first-party technologies that have been verified in production so far. It is updated as the production inventory is verified. Optional third-party technologies are not listed until an entry has been verified for this environment.</em></p>
      ) : null}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Provider</th>
            <th>Purpose</th>
            <th>Category</th>
            <th>Party</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {COOKIE_INVENTORY.map((c) => (
            <tr key={c.name + c.provider}>
              <td>{c.name}</td>
              <td>{c.provider}</td>
              <td>{c.purpose}</td>
              <td>{c.category}</td>
              <td>{c.party}</td>
              <td>{c.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Your controls</h2>
      <p>Users must have access to a persistent “Cookie Preferences” link. In jurisdictions requiring prior consent, Reject All must be as easy to select as Accept All, optional technologies must remain inactive until consent, and withdrawal must be as easy as consent. Record the consent version and timestamp. Honor Global Privacy Control where required.</p>
      <p>Essential technology cannot be disabled through the preference center because the Service cannot function without it, but users may block it through browser controls and accept the resulting loss of functionality.</p>
      <p>
        <button onClick={clearConsent} className="mt-2 rounded border border-[var(--border-line)] px-3 py-2 text-xs uppercase tracking-widest text-[var(--ink)] hover:bg-white/5">
          Reset my cookie preferences
        </button>
      </p>

      <h2>Questions</h2>
      <p>{LEGAL_CONFIG.contacts.privacy}.</p>
    </LegalPage>
  );
}
