type IndiciaProps = {
  seriesName: string;
  volume: number;
  issueNumber: number | string;
  publicationYear: number;
  issn?: string | null;
  className?: string;
};

/**
 * Publication block / indicia — the small print-comic style ownership
 * block shown at the bottom of each issue reading page. Kept intentionally
 * quiet: mono type, muted color, single hairline top border.
 */
export function Indicia({
  seriesName,
  volume,
  issueNumber,
  publicationYear,
  issn,
  className = "",
}: IndiciaProps) {
  const issnDisplay = issn && issn.trim().length > 0 ? issn.trim() : "pending assignment";
  return (
    <section
      className={`mt-6 border-t border-[var(--border-line)] pt-4 text-center font-mono text-[10px] leading-relaxed text-[var(--mute)] ${className}`}
      aria-label="Publication information"
    >
      <p className="text-[var(--ink2)]">
        <em className="not-italic font-semibold">{seriesName}</em>, Volume {volume}, Issue {issueNumber}
      </p>
      <p>Published by Real World Comics, an Astralnaut Studios imprint</p>
      <p>© {publicationYear} Streamwalkers Corporation. All rights reserved.</p>
      <p>Available exclusively through the Astralnaut Studios subscription service.</p>
      <p>ISSN (Online): {issnDisplay}</p>
    </section>
  );
}
