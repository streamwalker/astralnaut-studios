import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

const D = LEGAL_CONFIG.documents.community;

export const Route = createFileRoute("/community-guidelines")({
  head: () => metaFor({
    title: "Community Guidelines — Streamwalkers Corporation",
    description: "Rules for participating in AstralnautStudios.com community features and the Real World Comics Discord.",
    path: "/community-guidelines",
  }),
  component: CommunityGuidelinesPage,
});

function CommunityGuidelinesPage() {
  return (
    <LegalPage
      title="Community Guidelines"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/community-guidelines"
    >
      <p>Community features exist for respectful discussion of comics and related creative work. Users must be at least 18 to post or participate in external member communities.</p>
      <p>Do not post harassment, threats, hate speech, sexual exploitation, graphic unlawful content, doxing, private information, impersonation, scams, spam, malware, piracy links, paywalled pages, infringement, or instructions for bypassing security. Do not organize harassment or manipulate votes, promotions, or engagement metrics.</p>
      <p>Do not submit story pitches, scripts, characters, artwork, world-building concepts, or other unsolicited creative material through comments, forums, Discord, support, or social messages. Streamwalkers may remove content, limit features, suspend accounts, preserve evidence, or report conduct when reasonably necessary. Moderation decisions do not create an obligation to monitor every post.</p>
      <p>Users may report violations to {LEGAL_CONFIG.contacts.community}. Immediate threats should be reported to emergency services.</p>
    </LegalPage>
  );
}
