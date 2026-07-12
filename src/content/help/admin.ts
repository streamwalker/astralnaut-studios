import type { HelpTrack } from "./types";

export const adminHelp: HelpTrack = {
  id: "admin",
  label: "Admin Help Center",
  basePath: "/admin/help",
  articles: [
    {
      slug: "admin-overview",
      title: "Admin overview & access",
      category: "Admin Basics",
      summary: "Who has admin access, where the admin tools live, and the golden rules.",
      body: `## Who is an admin

Admin status is granted by adding a row to the **user_roles** table with role = \`admin\`. Never store roles on the profile table — they live in their own table for security.

## Where the tools are

- **/admin** — page and content management.
- **/growth** — growth dashboard.
- **/growth-package** — packaged growth plays.
- **Admin Mode badge** in the header — visible only to admins.

## Golden rules

1. Test changes on preview before publishing.
2. Don't touch the auto-generated files: \`src/integrations/supabase/client.ts\`, \`types.ts\`, \`.env\`.
3. All schema changes go through migrations.`,
      related: ["managing-pages", "publishing"],
    },
    {
      slug: "managing-pages",
      title: "Managing pages & content",
      category: "Content",
      summary: "Editing series pages, hero copy, and cover art.",
      body: `## From /admin

The admin panel lists every editable surface. Click a row to open the editor inline.

## Editing safely

- Save often — changes apply on save.
- Use the preview URL to check before publishing live.
- Cover and hero images should be optimized (under ~500KB).

## Adding a new series

Currently series are wired in code under \`src/routes/\`. To add a new series, duplicate an existing series route, update the slug, characters, and covers, then add it to the library and footer.`,
      related: ["publishing"],
    },
    {
      slug: "growth-playbook",
      title: "Growth playbook & tools",
      category: "Growth",
      summary: "Where to find the playbook and how to action it.",
      body: `## Two pages

- **/growth** — the live dashboard with goals and milestones.
- **/growth-package** — the packaged plays you can run.

## Recommended cadence

- **Weekly:** check subscription growth, sweepstakes entries, and forum activity.
- **Monthly:** review tier conversion and run one promotion from the playbook.
- **Quarterly:** ship a tentpole event (variant cover drop, cameo announcement).`,
      related: ["subscriptions-dashboard"],
    },
    {
      slug: "subscriptions-dashboard",
      title: "Subscriptions dashboard",
      category: "Operations",
      summary: "Read subscriber counts, churn, and active tiers.",
      body: `## Where the data lives

Subscription state is mirrored from Stripe into the **subscriptions** table by the webhook handler at \`/api/public/payments/webhook\`. Trust the table for in-app reads; trust Stripe for billing truth.

## What to watch

- **Active by tier** — Reader / Initiate / Patron split.
- **Cancellations this period** — flag if it spikes.
- **Sweepstakes entries granted** — reviewed at each 10K-milestone drawing; totals should reconcile with active subscriber-months during the 14-day window plus AMOE submissions.`,
      related: ["stripe-modes", "webhook-troubleshooting"],
    },
    {
      slug: "sweepstakes-admin",
      title: "Sweepstakes entries & winners",
      category: "Operations",
      summary: "Audit entries, run a drawing, and notify winners.",
      body: `## Entries

Every entry — paid or AMOE — lives in the **raffle_entries** table with a \`source\` (paid_tier or amoe). The webhook auto-grants paid entries when an invoice succeeds.

## Drawing a winner

1. Filter the entries for the period.
2. Use a verifiable random draw (script with a seed, recorded).
3. Record the winner; mark the entries used.
4. Notify the winner by the email on their account.

## Compliance

Always honor the published rules at **/sweepstakes/rules** and the AMOE path. Keep an audit trail.`,
      related: ["subscriptions-dashboard"],
    },
    {
      slug: "stripe-modes",
      title: "Stripe test vs live mode",
      category: "Operations",
      summary: "Don't mix them up.",
      body: `## How to tell

A banner at the top of the site shows when the app is connected to **test mode**. Real customers will not see it because live mode is connected on the production deployment.

## Test card

Use \`4242 4242 4242 4242\` with any future expiry and any CVC.

## Switching to live

The platform manages the live switch through the connector. Re-confirm products and prices are mirrored after going live.`,
      related: ["webhook-troubleshooting"],
    },
    {
      slug: "webhook-troubleshooting",
      title: "Webhook troubleshooting",
      category: "Operations",
      summary: "When subscriptions look wrong, check here first.",
      body: `## Symptoms

- A user paid but the tier didn't unlock.
- Sweepstakes entries weren't granted.
- A cancellation isn't reflected.

## Where to look

1. Stripe Dashboard → Events → find the event for the customer.
2. Compare the event payload to the latest row in the **subscriptions** table.
3. Check the public webhook route \`/api/public/payments/webhook\` is reachable from Stripe.

## Manual reconciliation

For one-off fixes you can update the row directly — but always also fix the root cause so it doesn't repeat.`,
      related: ["subscriptions-dashboard"],
    },
    {
      slug: "publishing",
      title: "Publishing & domains",
      category: "Operations",
      summary: "Push to production and confirm the live site updated.",
      body: `## Publishing

Use the **Publish** flow in the platform. The published URL is **astralnaut-studios.lovable.app** plus your custom domains (**astralnautstudios.com**, **www.astralnautstudios.com**).

## Verification checklist

- [ ] Home loads.
- [ ] Pricing page shows the right products and prices.
- [ ] A test checkout in incognito completes.
- [ ] The webhook updates the subscription row.`,
    },
    {
      slug: "training-course",
      title: "Take the admin training course",
      category: "Admin Basics",
      summary: "5 modules covering everything you need to run the platform.",
      body: `Go to **/admin/learn** and start Module 1. The course covers:

1. Orientation & roles
2. Content management
3. Growth tools & analytics
4. Subscriptions & Stripe operations
5. Publishing, domains & maintenance

Progress is saved locally in your browser.`,
    },
  ],
};
