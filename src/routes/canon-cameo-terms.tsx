import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

const D = LEGAL_CONFIG.documents.cameo;

export const Route = createFileRoute("/canon-cameo-terms")({
  head: () => metaFor({
    title: "Canon Voting and Cameo Terms — Streamwalkers Corporation",
    description: "How canon votes and cameo eligibility work at Streamwalkers Corporation and what rights are and are not granted.",
    path: "/canon-cameo-terms",
  }),
  component: CanonCameoTermsPage,
});

function CanonCameoTermsPage() {
  return (
    <LegalPage
      title="Canon Voting and Cameo Terms"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/canon-cameo-terms"
    >
      <p>Canon votes are member engagement features, not contests of skill or chance and not work-for-hire arrangements. Votes are advisory unless a specific poll expressly states otherwise. Streamwalkers retains final editorial discretion and may alter or disregard results for continuity, production, legal, safety, or creative reasons. Voters receive no copyright, coauthorship, credit, compensation, royalty, accounting, or approval right.</p>
      <p>Cameo eligibility means a member may be considered for depiction. Selection is not guaranteed and should be based on editorial suitability rather than random chance unless governed by separate promotion rules. A selected person must sign a separate appearance release. Streamwalkers may fictionalize, stylize, edit, combine, omit, or remove a depiction and retains all rights in the resulting character, artwork, issue, adaptation, merchandise, and derivative work. No likeness should be used before the signed release is received.</p>
    </LegalPage>
  );
}
