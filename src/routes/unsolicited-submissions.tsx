import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

const D = LEGAL_CONFIG.documents.unsolicited;

export const Route = createFileRoute("/unsolicited-submissions")({
  head: () => metaFor({
    title: "Unsolicited Submissions Policy — Streamwalkers Corporation",
    description: "Streamwalkers Corporation does not accept unsolicited scripts, pitches, stories, characters, or artwork.",
    path: "/unsolicited-submissions",
  }),
  component: UnsolicitedSubmissionsPage,
});

function UnsolicitedSubmissionsPage() {
  return (
    <LegalPage
      title="Unsolicited Submissions Policy"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/unsolicited-submissions"
    >
      <p>Streamwalkers does not accept unsolicited scripts, pitches, stories, characters, artwork, concepts, treatments, adaptations, or other creative material. Do not send them through email, comments, forums, Discord, social media, support forms, or physical mail.</p>
      <p>Materials sent despite this policy may be deleted or returned unread where practical. Receipt does not create confidentiality, a fiduciary relationship, an evaluation obligation, compensation, credit, or any restriction on Streamwalkers’ development of material that may be similar. This policy does not replace a written submission agreement expressly authorized by an officer of Streamwalkers.</p>
    </LegalPage>
  );
}
