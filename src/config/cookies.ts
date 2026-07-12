// Source of truth for the cookie inventory table on /cookies.
// Only list technologies that have been verified in production.
// When adding a new vendor, verify the actual cookie/localStorage name
// deployed in production before adding a row here.

export type CookieRow = {
  name: string;
  provider: string;
  purpose: string;
  category: "Essential" | "Analytics" | "Marketing" | "Preferences";
  party: "First-party" | "Third-party";
  duration: string;
};

// Flip to true once the full third-party inventory has been verified.
export const INVENTORY_COMPLETE = false;

export const COOKIE_INVENTORY: CookieRow[] = [
  { name: "sb-<project>-auth-token", provider: "Supabase (Lovable Cloud)", purpose: "Signed-in session for the reader, account, and checkout.", category: "Essential", party: "First-party", duration: "Session + refresh (persistent while signed in)" },
  { name: "rwc-cookie-consent-v1", provider: "AstralnautStudios.com", purpose: "Stores your cookie consent choice so the banner is not shown again.", category: "Essential", party: "First-party", duration: "12 months (localStorage)" },
  { name: "__stripe_mid / __stripe_sid", provider: "Stripe", purpose: "Fraud prevention during checkout.", category: "Essential", party: "Third-party", duration: "Session / up to 1 year (Stripe)" },
];
