import type { HelpTrack } from "./types";

export const readerHelp: HelpTrack = {
  id: "reader",
  label: "Reader Help Center",
  basePath: "/help",
  articles: [
    {
      slug: "welcome",
      title: "Welcome to Astralnaut Studios",
      category: "Getting Started",
      summary: "What the platform is, who it's for, and how to get the most out of it.",
      body: `## What is Astralnaut Studios?

Astralnaut Studios is a creator-direct comics platform. New pages drop here first, you can vote on canon, win original art through raffles, and support creators directly through tiered subscriptions.

## What you can do as a reader

- **Read** ongoing series in the in-browser reader.
- **Subscribe** to unlock premium issues and raffle entries.
- **Enter raffles** for cameos, signed prints, and exclusive variant covers.
- **Vote** on community canon decisions.
- **Earn** patron perks like quarterly signed physical prints.

## Where to go next

- Create an account → see "Create your account".
- Pick a tier → see "Choosing a subscription tier".
- Take the guided tour from the home page (re-launch it from this help center anytime).`,
      related: ["create-account", "choose-tier", "guided-tour"],
    },
    {
      slug: "create-account",
      title: "Create your account",
      category: "Getting Started",
      summary: "Sign up with email or Google in under a minute.",
      body: `## Sign up

1. Click **Sign in** in the top right, then choose **Create account**.
2. Enter your email and a password, or continue with Google.
3. Confirm your email address from the message we send you.

## Sign in later

Use the same **Sign in** link. Your reading progress, raffle entries, and subscription stay attached to your account.

## Trouble signing in?

- Double-check the email address.
- Use the **Forgot password** link on the sign-in screen.
- If a Google sign-in is unexpectedly blocked, try email + password instead.`,
      related: ["account-privacy", "manage-subscription"],
    },
    {
      slug: "guided-tour",
      title: "Take the guided tour",
      category: "Getting Started",
      summary: "A 60-second overlay that points out the most important parts of the site.",
      body: `## Launching the tour

The tour runs automatically the first time you land on the home page. To restart it:

1. Open the **Help Center** (this page).
2. Click **Restart guided tour** at the top of any article list.

## What it covers

- The series library
- Opening the reader
- Pricing and tiers
- Your account dashboard
- The help center and training

You can skip at any time with **Esc** or the **Skip** button.`,
      related: ["welcome"],
    },
    {
      slug: "using-the-reader",
      title: "Using the reader",
      category: "Reading",
      summary: "Navigate pages, jump issues, and read in fullscreen.",
      body: `## Opening an issue

From the library, pick a series, then click an issue cover. Or use the **Start reading** button in the header to jump into the latest.

## Navigation

- **Arrow keys** or on-screen arrows to move between pages.
- Click the page to advance.
- Use the **Issue picker** in the toolbar to jump.
- **F** toggles fullscreen.

## Tips

- Hover small **(?)** icons anywhere in the app for inline help.
- If a page won't load, refresh — your progress is saved.`,
      related: ["choose-tier"],
    },
    {
      slug: "choose-tier",
      title: "Choosing a subscription tier",
      category: "Subscriptions & Billing",
      summary: "Reader, Initiate, and Patron — what's included and how to pick.",
      body: `## The three tiers

- **Reader — $4.99/mo or $49.90/yr.** Forum access, canon voting, 1 raffle entry per week.
- **Initiate — $9.99/mo or $99.90/yr.** 3 raffle entries per week, numbered digital variant covers.
- **Patron — $24.99/mo or $249.90/yr.** 10 raffle entries per week, cameo eligibility, quarterly signed physical print, and direct creator Discord access.

## Monthly vs annual

Annual plans give you ~2 months free. You can switch any time from your account.

## How to subscribe

1. Go to **Pricing**.
2. Toggle **Monthly** or **Annual**.
3. Click the tier you want — checkout opens in a secure window.
4. After payment, your perks unlock immediately.`,
      related: ["manage-subscription", "raffle-entries", "patron-perks"],
    },
    {
      slug: "manage-subscription",
      title: "Manage or cancel your subscription",
      category: "Subscriptions & Billing",
      summary: "Update card, switch tier, change billing cycle, or cancel.",
      body: `## Open the billing portal

1. Go to **Account**.
2. Click **Manage subscription**.
3. The secure billing portal opens in a new window.

## What you can do there

- Update payment method.
- Switch between tiers.
- Switch monthly ↔ annual.
- Cancel — your access continues until the end of the paid period.

## Refunds

Contact us through the support link in the portal. We handle refunds case-by-case.`,
      related: ["choose-tier"],
    },
    {
      slug: "raffle-entries",
      title: "How raffles work",
      category: "Raffles & Rewards",
      summary: "Entry counts per tier, what you can win, and how winners are picked.",
      body: `## Entries per tier

- **Reader:** 1 entry per week
- **Initiate:** 3 entries per week
- **Patron:** 10 entries per week

Entries are granted automatically each billing cycle.

## What you can win

- Numbered digital variant covers
- Signed physical prints
- Cameos in upcoming issues (Patron only)
- Original art pages

## How winners are drawn

Drawings happen on a fixed schedule, audited and random. See **Raffle rules** for full mechanics, eligibility, and odds.`,
      related: ["amoe", "raffle-rules"],
    },
    {
      slug: "amoe",
      title: "Free entry (no purchase necessary)",
      category: "Raffles & Rewards",
      summary: "How to enter raffles without subscribing — Alternate Method of Entry.",
      body: `## The free path

We offer a free Alternate Method of Entry (AMOE) so anyone can participate.

## How to enter

1. Go to **/raffle/free-entry**.
2. Fill in your details.
3. Submit — your entry is logged the same way a paid one is.

## Rules

- Limits apply per person and per period.
- Full eligibility, drawing dates, and prize details live on the **Raffle rules** page.`,
      related: ["raffle-entries", "raffle-rules"],
    },
    {
      slug: "raffle-rules",
      title: "Raffle rules (full text)",
      category: "Raffles & Rewards",
      summary: "Official rules, eligibility, odds, and prize details.",
      body: `The full official rules are published at **/raffle/rules**. They cover:

- Eligibility (age, location)
- Entry periods and drawing dates
- Odds of winning per prize
- Notification and claim deadlines
- AMOE details
- Sponsor information

Always defer to the rules page for the binding text.`,
    },
    {
      slug: "patron-perks",
      title: "Patron perks: cameos and signed prints",
      category: "Patron Perks",
      summary: "What Patrons get and how to claim physical rewards.",
      body: `## Cameos

Patrons are eligible to appear as background or named characters in upcoming issues. We contact eligible patrons through the email on your account.

## Quarterly signed physical print

Each quarter you receive a signed print shipped to the address on your subscription. Update your shipping address from **Account → Shipping**.

## Direct creator Discord

After subscribing, you'll see an invite link on your account page. The link is unique to you — don't share it.`,
      related: ["shipping-address", "manage-subscription"],
    },
    {
      slug: "shipping-address",
      title: "Update your shipping address",
      category: "Patron Perks",
      summary: "For Patron physical prints, keep this current.",
      body: `## Where to update

1. Go to **Account**.
2. Find **Shipping address** (Patron tier only).
3. Edit and save.

We use the address on file at the time we ship each quarter. If you move mid-quarter, update it as soon as possible.`,
    },
    {
      slug: "canon-voting",
      title: "Community & canon voting",
      category: "Community",
      summary: "Have a real say in where the story goes.",
      body: `## How voting works

When the team opens a canon decision, eligible subscribers see it on the community page with options and context. One vote per account. Results are published after the window closes.

## Who can vote

All paid tiers. Free accounts can read forum threads but not vote on canon decisions.`,
      related: ["choose-tier"],
    },
    {
      slug: "account-privacy",
      title: "Account & privacy",
      category: "Account",
      summary: "What we store, how to delete your account, and how to export data.",
      body: `## What we store

- Email and login info.
- Subscription status and history.
- Raffle entries.
- Reading progress.
- Shipping address (Patron only).

## Delete your account

Contact support. We'll remove your personal data subject to legal/billing retention requirements.

## Data export

Available on request through support.`,
    },
  ],
};
