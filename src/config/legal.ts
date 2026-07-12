// Central legal configuration — single source of truth for every legal page.
// Pending attorney review. Bracketed placeholders are intentional and must
// remain visible on legal-text pages until final review completes.

export const LEGAL_CONFIG = {
  entity: "Streamwalkers Corporation",
  entityJurisdiction: "Delaware",
  imprints: "Astralnaut Studios and Real World Comics",
  site: "astralnautstudios.com",
  siteUrl: "https://astralnautstudios.com",
  launchTerritory: "United States (50 states and District of Columbia)",
  mailingAddress: {
    line1: "[PUBLIC BUSINESS MAILING ADDRESS]",
    city: "San Antonio",
    state: "Texas",
    zip: "[ZIP]",
  },
  contacts: {
    support: "support@astralnautstudios.com",
    billing: "billing@astralnautstudios.com",
    privacy: "privacy@astralnautstudios.com",
    legal: "legal@astralnautstudios.com",
    dmca: "dmca@astralnautstudios.com",
    security: "security@astralnautstudios.com",
    accessibility: "accessibility@astralnautstudios.com",
    promotions: "promotions@astralnautstudios.com",
    community: "community@astralnautstudios.com",
    shop: "shop@astralnautstudios.com",
  },
  dmcaAgent: {
    registrationStatus: "in_progress" as "in_progress" | "designated",
    name: "[DMCA AGENT NAME OR SERVICE]",
    address: "[PUBLIC DMCA STREET ADDRESS]",
    phone: "[DMCA TELEPHONE NUMBER]",
    email: "dmca@astralnautstudios.com",
  },
  // Effective / last-updated dates per document (ISO for stability)
  documents: {
    terms:                { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
    subscription:         { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
    privacy:              { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
    cookies:              { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
    community:            { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
    dmca:                 { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
    sweepstakes:          { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
    cameo:                { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
    unsolicited:          { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
    contentAccessibility: { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
    shipping:             { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
    subprocessors:        { version: "2026.07.12", effective: "[EFFECTIVE DATE]", updated: "[LAST UPDATED DATE]" },
  },
  shipping: {
    territories: "United States (50 states and District of Columbia)",
    reportWindowDays: "[NUMBER]",
  },
  plans: {
    reader:   { name: "Reader",   monthly: "[PRICE]", annual: "[PRICE]" },
    initiate: { name: "Initiate", monthly: "[PRICE]", annual: "[PRICE]" },
    patron:   { name: "Patron",   monthly: "[PRICE]", annual: "[PRICE]" },
  },
  // Milestone sweepstakes registry. Each entry represents one promotion.
  // A promotion may only be ACTIVATED if every required field is non-bracketed.
  sweepstakes: {
    active: null as null | ActiveSweepstakes,
    // Standing template descriptors (used on the rules page):
    cadence:
      "A drawing occurs at each 10,000-subscriber platform milestone. An entry period opens when the previous drawing closes and closes when the platform reaches the next 10,000-subscriber milestone. One drawing per milestone.",
    entryCap: "One (1) entry per eligible person per milestone entry period, regardless of method or subscription tier.",
    amoeParity: "The free-entry (AMOE) cap equals the paid-subscriber cap: exactly one (1). A person who both holds a paid subscription and submits the free form is deduplicated to one total entry.",
  },
  // Renewal disclosure text version stamped into consent_events at checkout time.
  renewalDisclosureVersion: "2026.07.12",
  // Consent line clickwrap texts (verbatim). $PRICE token is replaced at render.
  clickwrap: {
    signup:
      "I am at least 18 years old. I agree to the Terms of Service and acknowledge the Privacy Policy.",
    checkoutMonthly:
      "I understand this is a recurring monthly subscription of $PRICE that will automatically renew each month until I cancel through my account. I have read and agree to the Terms of Service, Subscription and Billing Policy, and Privacy Policy.",
    checkoutAnnual:
      "I understand this is a recurring annual subscription of $PRICE that will automatically renew each year until I cancel through my account. I have read and agree to the Terms of Service, Subscription and Billing Policy, and Privacy Policy.",
  },
  // Annual-plan renewal reminder lead time. Fail-closed default is 30 days.
  annualRenewalReminderLeadDays: "[NUMBER]" as string,
} as const;


export type ActiveSweepstakes = {
  promotionId: string;
  name: string;
  milestoneNumber: number;
  openTimestamp: string;
  drawingRule: string;
  winnerProcess: string;
  prizeDescription: string;
  arv: string;
  responseWindowDays: string;
  drawingDaysAfterMilestone: string;
};

// Fail-closed helpers ---------------------------------------------------------

/** Returns true when a value still contains a bracketed placeholder. */
export function isPlaceholder(value: unknown): boolean {
  return typeof value === "string" && /\[[^\]]+\]/.test(value);
}

/** Returns true only when every required field for an active sweepstakes
 * is populated with real (non-bracketed) values. Used by the entry form
 * to refuse to open if any required config is still a placeholder. */
export function isSweepstakesActivatable(promo: ActiveSweepstakes | null): promo is ActiveSweepstakes {
  if (!promo) return false;
  const required: unknown[] = [
    promo.promotionId, promo.name, promo.milestoneNumber, promo.openTimestamp,
    promo.drawingRule, promo.winnerProcess, promo.prizeDescription, promo.arv,
    promo.responseWindowDays, promo.drawingDaysAfterMilestone,
  ];
  return required.every((v) => v !== undefined && v !== null && !isPlaceholder(v));
}
