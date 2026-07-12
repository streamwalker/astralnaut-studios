import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

const D = LEGAL_CONFIG.documents.dmca;

export const Route = createFileRoute("/copyright-dmca")({
  head: () => metaFor({
    title: "Copyright and DMCA Policy — Streamwalkers Corporation",
    description: "How to send a DMCA copyright notice for material posted on AstralnautStudios.com.",
    path: "/copyright-dmca",
  }),
  component: CopyrightDmcaPage,
});

function CopyrightDmcaPage() {
  const agent = LEGAL_CONFIG.dmcaAgent;
  const pending = agent.registrationStatus !== "designated";
  return (
    <LegalPage
      title="Copyright and DMCA Policy"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/copyright-dmca"
    >
      <p>Streamwalkers Corporation respects intellectual-property rights and expects users to do the same. All Astralnaut Studios and Real World Comics properties displayed on the Service are owned by Streamwalkers Corporation or used with authorization.</p>
      <p>If you believe material posted by a user infringes your copyright, send a notice containing: identification of the copyrighted work; identification and URL of the allegedly infringing material; your contact information; a good-faith statement; a statement under penalty of perjury that the notice is accurate and you are authorized to act; and your physical or electronic signature.</p>

      <h2>Send notices to</h2>
      <address>
        DMCA Agent for Streamwalkers Corporation<br />
        {pending ? (
          <em>Registration in progress — agent details will be published upon U.S. Copyright Office designation.</em>
        ) : (
          <>
            {agent.name}<br />
            {agent.address}<br />
            {agent.phone}<br />
          </>
        )}
        <a href={`mailto:${agent.email}`} className="underline">{agent.email}</a>
      </address>

      <p>Counter-notices must meet 17 U.S.C. §512 requirements. We may remove material and terminate repeat infringers where appropriate.</p>

      <h2>Implementation status</h2>
      <p><strong>DMCA safe-harbor registration:</strong> registration in progress. We do not currently claim registered DMCA safe-harbor status. Streamwalkers is preparing the designation of a DMCA agent with the U.S. Copyright Office; matching contact information will be published on this page upon designation.</p>
    </LegalPage>
  );
}
