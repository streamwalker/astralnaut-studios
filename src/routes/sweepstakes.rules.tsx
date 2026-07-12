import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, metaFor } from "@/components/legal-page";
import { LEGAL_CONFIG, isSweepstakesActivatable } from "@/config/legal";

const D = LEGAL_CONFIG.documents.sweepstakes;

export const Route = createFileRoute("/sweepstakes/rules")({
  head: () => metaFor({
    title: "Milestone Sweepstakes — Official Rules · Streamwalkers Corporation",
    description: "Standing Official Rules template for the Streamwalkers Corporation Milestone Sweepstakes. No sweepstakes is currently open.",
    path: "/sweepstakes/rules",
  }),
  component: RulesPage,
});

function RulesPage() {
  const addr = LEGAL_CONFIG.mailingAddress;
  const active = LEGAL_CONFIG.sweepstakes.active;
  const isOpen = isSweepstakesActivatable(active);
  return (
    <LegalPage
      title="Milestone Sweepstakes — Official Rules"
      eyebrow="Streamwalkers Corporation"
      effective={D.effective}
      updated={D.updated}
      version={D.version}
      canonical="/sweepstakes/rules"
    >
      <div className="rounded-lg border border-[var(--border-line)] bg-black/30 p-5">
        <p className="text-[var(--ink)] font-semibold">
          {isOpen ? "A Milestone Sweepstakes is currently open." : "No sweepstakes is currently open."}
        </p>
        <p className="mt-2 text-sm">
          These are the standing template rules. Promotion-specific Official Rules with completed prize, dates, value, eligibility, drawing date, and Sponsor contact fields will be published before any entry period opens.
        </p>
      </div>

      <h2>NO PURCHASE NECESSARY</h2>
      <p>NO PURCHASE NECESSARY TO ENTER OR WIN. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING. VOID WHERE PROHIBITED.</p>

      <h2>1. Sponsor</h2>
      <p>The sponsor is Streamwalkers Corporation, {addr.line1}, {addr.city}, {addr.state} {addr.zip} (“Sponsor”). Astralnaut Studios and Real World Comics are Sponsor’s imprints.</p>

      <h2>2. Eligibility</h2>
      <p>Open to legal residents of the 50 United States and District of Columbia who are at least 18 years old at entry. Employees, officers, directors, contractors directly involved in administration, and members of their immediate households are ineligible. Void where prohibited.</p>

      <h2>3. Promotion period (milestone cadence)</h2>
      <p>The [PROMOTION NAME] entry period is triggered by a platform subscriber milestone rather than a fixed calendar date. An entry period <strong>opens</strong> when the previous drawing closes and <strong>closes</strong> when the platform reaches the next 10,000-subscriber milestone. One drawing occurs per milestone. Sponsor will publish the opening timestamp of each period and will announce the milestone closure. Sponsor’s systems are the official timekeeping and subscriber-count device.</p>

      <h2>4. How to enter</h2>
      <p>There are two equivalent methods:</p>
      <ol>
        <li><strong>Automatic subscriber entry:</strong> An eligible person with an active paid subscription during the entry period receives one entry.</li>
        <li><strong>Free online entry:</strong> An eligible person may submit the form at <a href="/sweepstakes/free-entry" className="underline">/sweepstakes/free-entry</a> during the entry period and receives one entry.</li>
      </ol>
      <p>Limit one total entry per person and email address per entry period regardless of method. A person who enters through both methods receives only one entry. Reader, Initiate, and Patron tiers receive the same number of entries. Automated, bulk, fraudulent, or manipulated entries are void.</p>

      <h2>5. Prize</h2>
      <p>One [PRIZE DESCRIPTION], approximate retail value US $[ARV]. No transfer or substitution except Sponsor may substitute a prize of equal or greater value if unavailable. No cash alternative unless Sponsor chooses. Winner is responsible for taxes and expenses not expressly included.</p>

      <h2>6. Winner selection and odds</h2>
      <p>One potential winner will be selected at random from eligible entries on or about [NUMBER] days after the milestone is reached. Odds depend on the number of eligible entries received.</p>

      <h2>7. Notification and verification</h2>
      <p>The potential winner will be notified using the submitted email and must respond within [NUMBER] days. Sponsor may require eligibility verification, a declaration, liability/publicity release where lawful, and tax documentation. Failure to respond or qualify may result in disqualification and selection of an alternate.</p>

      <h2>8. Publicity</h2>
      <p>Except where prohibited, acceptance permits Sponsor to use the winner’s name, city and state, and prize information for promotion without additional compensation. Do not require broader likeness rights than necessary for the sweepstakes.</p>

      <h2>9. General conditions</h2>
      <p>Sponsor may disqualify fraud, tampering, abuse, or rule violations and may suspend, modify, or cancel the promotion if integrity is compromised. If canceled, Sponsor may award the prize from eligible entries received before the disruption where lawful.</p>

      <h2>10. Release and limitation</h2>
      <p>To the extent permitted by law, entrants release Sponsor and promotion administrators from claims arising from participation or prize use, except liability that cannot legally be waived. Sponsor is not responsible for network failures, lost entries, unauthorized intervention, or events beyond reasonable control.</p>

      <h2>11. Privacy</h2>
      <p>Entry information is used to administer the promotion, verify eligibility, communicate with entrants, comply with law, and as otherwise described in the Privacy Policy. Sweepstakes entry does not automatically enroll a person in marketing without separate consent.</p>

      <h2>12. Winner list and questions</h2>
      <p>For winner information or questions, contact {LEGAL_CONFIG.contacts.promotions} within [TIME PERIOD].</p>

      <h2>Operational restrictions</h2>
      <ul>
        <li>Do not use tier-weighted entries.</li>
        <li>Do not say “raffle.”</li>
        <li>Do not require a subscription, purchase, extensive survey, social sharing, or referral as the only entry method.</li>
        <li>Do not combine prize chance, consideration, and random selection.</li>
        <li>Review registration and bonding requirements before any promotion with total prize value above $5,000 or before materially expanding outside the United States.</li>
        <li>Publish promotion-specific start time, trigger milestone, prize value, eligibility, drawing date, and winner process before entries open.</li>
      </ul>
    </LegalPage>
  );
}
