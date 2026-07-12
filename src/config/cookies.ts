// Verified cookie / storage / third-party technology inventory for
// astralnautstudios.com. Every row below was confirmed by reading source
// under src/ on 2026-07-12. Do not add speculative rows; add a row only
// after the code that sets the technology exists in production.
//
// Categories:
//   Necessary   — required for the site to function (auth, checkout, cart,
//                 consent state, load balancing, security).
//   Functional  — remembers non-essential preferences (language, dismissed
//                 promo bar, motion preference).
//   Analytics   — first-party usage measurement. Loads only with consent.
//   Marketing   — advertising / cross-site tracking. Not currently in use;
//                 category exists so future additions inherit the gate.

export type CookieCategory = "necessary" | "functional" | "analytics" | "marketing";

export type CookieRow = {
  name: string;
  provider: string;
  purpose: string;
  category: CookieCategory;
  party: "First-party" | "Third-party";
  storage: "cookie" | "localStorage" | "sessionStorage" | "IndexedDB" | "request";
  duration: string;
};

// Full inventory of what the app is actually observed to set today.
export const COOKIE_INVENTORY: CookieRow[] = [
  // ── Necessary ────────────────────────────────────────────────────────────
  {
    name: "sb-<project>-auth-token",
    provider: "Supabase (Lovable Cloud)",
    purpose: "Signed-in session for the reader, account, checkout, and community features.",
    category: "necessary",
    party: "First-party",
    storage: "localStorage",
    duration: "Session + refresh, persistent while signed in.",
  },
  {
    name: "rwc-cookie-consent-v1",
    provider: "AstralnautStudios.com",
    purpose: "Stores your cookie-category consent so the banner is not shown again.",
    category: "necessary",
    party: "First-party",
    storage: "localStorage",
    duration: "12 months.",
  },
  {
    name: "pending_signup_consent_v1",
    provider: "AstralnautStudios.com",
    purpose: "Temporarily holds the signup clickwrap text so it can be recorded after OAuth completes.",
    category: "necessary",
    party: "First-party",
    storage: "localStorage",
    duration: "Deleted immediately once the consent record is written.",
  },
  {
    name: "as-cart",
    provider: "AstralnautStudios.com",
    purpose: "Remembers items in your shop cart across page loads.",
    category: "necessary",
    party: "First-party",
    storage: "localStorage",
    duration: "Persistent until the cart is emptied or manually cleared.",
  },
  {
    name: "__stripe_mid / __stripe_sid",
    provider: "Stripe",
    purpose: "Fraud prevention during Stripe embedded checkout. Loaded only when a checkout is opened.",
    category: "necessary",
    party: "Third-party",
    storage: "cookie",
    duration: "Session / up to one year (Stripe-managed).",
  },

  // ── Functional ───────────────────────────────────────────────────────────
  {
    name: "rwc-lang",
    provider: "AstralnautStudios.com",
    purpose: "Remembers your language preference so the site loads in your chosen language.",
    category: "functional",
    party: "First-party",
    storage: "localStorage",
    duration: "Persistent until changed.",
  },
  {
    name: "as_promo_bar_dismiss",
    provider: "AstralnautStudios.com",
    purpose: "Remembers that you dismissed the promotional bar during this browser session.",
    category: "functional",
    party: "First-party",
    storage: "sessionStorage",
    duration: "Cleared when you close the tab.",
  },
  {
    name: "archive-booted",
    provider: "AstralnautStudios.com",
    purpose: "Skips the Astralnaut Archive boot sequence on repeat visits within the same session.",
    category: "functional",
    party: "First-party",
    storage: "sessionStorage",
    duration: "Cleared when you close the tab.",
  },
  {
    name: "rwc-reader-motion",
    provider: "AstralnautStudios.com",
    purpose: "Remembers whether you disabled non-essential animations inside the comic reader.",
    category: "functional",
    party: "First-party",
    storage: "localStorage",
    duration: "Persistent until changed.",
  },
  {
    name: "reader-lead-capture-<series>",
    provider: "AstralnautStudios.com",
    purpose: "Remembers, per series, that you dismissed or completed the reader lead-capture prompt.",
    category: "functional",
    party: "First-party",
    storage: "sessionStorage",
    duration: "Cleared when you close the tab.",
  },

  // ── Analytics (first-party only, gated on consent) ───────────────────────
  {
    name: "as_analytics_sid / as_analytics_sstart",
    provider: "AstralnautStudios.com",
    purpose: "First-party session identifier used to aggregate pageviews and clicks. Loads only if you consent to analytics.",
    category: "analytics",
    party: "First-party",
    storage: "sessionStorage",
    duration: "Cleared when you close the tab.",
  },
  {
    name: "analytics_events (server-side)",
    provider: "AstralnautStudios.com",
    purpose: "First-party record of pageviews, clicks, and page-leave durations used for aggregate usage reporting.",
    category: "analytics",
    party: "First-party",
    storage: "request",
    duration: "Rolling retention per Privacy Policy.",
  },

  // ── Marketing ────────────────────────────────────────────────────────────
  // No marketing / advertising / cross-site tracking technologies are
  // currently deployed. The category is retained so any future addition
  // must load through the same consent gate before it can run.
];

export const COOKIE_INVENTORY_VERIFIED_AT = "2026-07-12";
