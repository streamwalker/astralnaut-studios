import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG, isSweepstakesActivatable } from "@/config/legal";

const D = LEGAL_CONFIG.documents.sweepstakes;

export const Route = createFileRoute("/sweepstakes/free-entry")({
  head: () => metaFor({
    title: "Milestone Sweepstakes — Free Entry (AMOE) · Streamwalkers Corporation",
    description: "Free alternate method of entry (AMOE) for the Streamwalkers Corporation Milestone Sweepstakes. Opens only when an entry period is active.",
    path: "/sweepstakes/free-entry",
    noindex: true,
  }),
  component: FreeEntryPage,
});

function FreeEntryPage() {
  const active = LEGAL_CONFIG.sweepstakes.active;
  const canOpen = isSweepstakesActivatable(active);
  return (
    <LegalPage
      title="Free Entry (AMOE) — Milestone Sweepstakes"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/sweepstakes/free-entry"
      noindex
    >
      <div className="rounded-lg border border-[var(--border-line)] bg-black/30 p-5">
        <p className="text-[var(--ink)] font-semibold">
          {canOpen ? "An entry period is currently open." : "No entry period is currently open."}
        </p>
        <p className="mt-2 text-sm">
          The free-entry form is available only while a Milestone Sweepstakes entry period is open. Entry periods open when the platform reaches each new 10,000-subscriber milestone and close when the next milestone is reached.
        </p>
      </div>

      <h2>NO PURCHASE NECESSARY</h2>
      <p>NO PURCHASE NECESSARY. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING. Open to legal residents of the 50 United States and District of Columbia who are 18 or older. Void where prohibited. See <a href="/sweepstakes/rules" className="underline">Official Rules</a>.</p>

      <h2>Entry parity</h2>
      <p>{LEGAL_CONFIG.sweepstakes.entryCap} {LEGAL_CONFIG.sweepstakes.amoeParity}</p>

      {canOpen ? (
        <>
          <h2>Submit a free entry</h2>
          <p>Complete the form below during the open entry period. The system will refuse duplicate entries by email.</p>
          {/* Entry form intentionally not rendered in this build pending activation and attorney review. */}
          <p><em>Form activation pending: {LEGAL_CONFIG.contacts.promotions}.</em></p>
        </>
      ) : (
        <>
          <h2>When we open</h2>
          <p>When an entry period opens, this page will publish a form that requires only the information necessary to administer the promotion and verify eligibility, in accordance with the Privacy Policy and Official Rules.</p>
          <p>Questions: {LEGAL_CONFIG.contacts.promotions}.</p>
        </>
      )}
    </LegalPage>
  );
}
