import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG } from "@/config/legal";

const D = LEGAL_CONFIG.documents.contentAccessibility;

export const Route = createFileRoute("/content-accessibility")({
  head: () => metaFor({
    title: "Content, Fiction, and Accessibility Notice — Streamwalkers Corporation",
    description: "Fiction notice, content advisories, and accessibility commitments for AstralnautStudios.com.",
    path: "/content-accessibility",
  }),
  component: ContentAccessibilityPage,
});

function ContentAccessibilityPage() {
  return (
    <LegalPage
      title="Content, Fiction, and Accessibility Notice"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/content-accessibility"
    >
      <h2>Fiction notice</h2>
      <p>The stories, characters, organizations, technologies, and events presented by Astralnaut Studios and Real World Comics are fictional or used fictitiously. Any resemblance to actual persons, organizations, or events is coincidental unless expressly identified as historical commentary.</p>
      <p>Astralnaut Studios and Real World Comics publish fictional entertainment. Unless expressly identified otherwise, characters, organizations, technologies, and events are fictional or used fictitiously. Historical or mythological references are dramatized. Content does not provide legal, medical, financial, religious, historical, or other professional advice.</p>

      <h2>Content advisories</h2>
      <p>Some material may include violence, war, death, supernatural themes, mature language, flashing or pulsing visual effects, or audio. Provide issue-level advisories and a visible reduced-motion control. Respect the operating system’s <code>prefers-reduced-motion</code> setting, provide keyboard navigation, alt text or equivalent descriptions where appropriate, sufficient contrast, focus indicators, captions/transcripts for meaningful audio, and an accessibility contact.</p>

      <h2>Accessibility feedback</h2>
      <p>{LEGAL_CONFIG.contacts.accessibility}. Include the page URL, device, browser, assistive technology, and problem encountered. Do not promise perfect conformity or certification unless independently verified; state the standard the team is working toward, such as WCAG 2.2 AA.</p>
    </LegalPage>
  );
}
