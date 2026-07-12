import type { Course } from "./types";

export const adminCourse: Course = {
  id: "admin",
  label: "Admin Track",
  basePath: "/admin/learn",
  modules: [
    {
      id: "01-orientation",
      title: "Orientation & roles",
      summary: "How admin access works and where the tools live.",
      body: `## Admin roles

Roles live in the **user_roles** table, never on the profile. The \`has_role()\` security-definer function is what RLS policies call to authorize access.

## Tools you'll use

- **/admin** — pages and content.
- **/growth** — dashboard.
- **/growth-package** — packaged plays.
- **Admin Mode** badge in the header — your sign that you're operating live.

## Golden rules

1. Preview before publish.
2. Don't edit auto-generated files (\`client.ts\`, \`types.ts\`, \`.env\`).
3. Schema changes only via migrations.`,
      quiz: [
        {
          q: "Where should user roles be stored?",
          options: [
            "On the profiles table.",
            "In a dedicated user_roles table.",
            "In localStorage on the client.",
          ],
          answerIndex: 1,
        },
        {
          q: "Which file should you never edit by hand?",
          options: [
            "src/routes/pricing.tsx",
            "src/integrations/supabase/client.ts",
            "src/content/help/admin.ts",
          ],
          answerIndex: 1,
        },
        {
          q: "Schema changes go through:",
          options: ["A migration", "A direct SQL paste", "A support ticket"],
          answerIndex: 0,
        },
      ],
    },
    {
      id: "02-content",
      title: "Content management",
      summary: "Editing pages, swapping covers, adding series.",
      body: `## /admin

Lists editable surfaces. Click a row to open the inline editor; changes apply on save.

## Images

Optimize covers and heroes (<500KB). Use the existing aspect ratios; the layout depends on them.

## Adding a series

1. Duplicate an existing series route under \`src/routes/\`.
2. Update slug, characters, and cover art.
3. Add it to the library and the footer.
4. Preview, then publish.`,
      quiz: [
        {
          q: "Recommended max size for cover art:",
          options: ["~50KB", "~500KB", "~5MB"],
          answerIndex: 1,
        },
        {
          q: "To add a new series you:",
          options: [
            "Click a button in /admin.",
            "Duplicate an existing series route and update it.",
            "File a support ticket.",
          ],
          answerIndex: 1,
        },
        {
          q: "Changes apply when:",
          options: ["You publish", "You save", "Nightly"],
          answerIndex: 1,
        },
      ],
    },
    {
      id: "03-growth",
      title: "Growth tools & analytics",
      summary: "Use the playbook on a real cadence.",
      body: `## Cadence

- **Weekly:** subscriptions delta, sweepstakes entries, forum activity.
- **Monthly:** tier conversion + one playbook promotion.
- **Quarterly:** tentpole event (variant drop, cameo reveal).

## Where to look

- **/growth** for the live dashboard.
- **/growth-package** for ready-to-run plays.

## Pick one play per month

Don't run five at once — pick the play that targets your weakest metric and ship it cleanly.`,
      quiz: [
        {
          q: "Recommended monthly action:",
          options: ["Run every play.", "Run one targeted play.", "Skip if metrics look fine."],
          answerIndex: 1,
        },
        {
          q: "Which page has the live dashboard?",
          options: ["/admin", "/growth", "/pricing"],
          answerIndex: 1,
        },
        {
          q: "Quarterly cadence is for:",
          options: ["Bug triage", "Tentpole events", "Password rotations"],
          answerIndex: 1,
        },
      ],
    },
    {
      id: "04-stripe",
      title: "Subscriptions & Stripe operations",
      summary: "Read the data, fix mismatches, manage test vs live.",
      body: `## Source of truth

- **Stripe** = billing truth.
- **subscriptions** table = in-app reads, populated by the webhook at \`/api/public/payments/webhook\`.

## Test mode banner

A banner shows when test mode is active. Real customers never see it in production.

## Test card

\`4242 4242 4242 4242\`, any future expiry, any CVC.

## When something looks off

1. Stripe Dashboard → Events → find the customer event.
2. Compare to the latest **subscriptions** row.
3. If the webhook didn't fire, check the public route is reachable.
4. Patch the row only after confirming root cause.`,
      quiz: [
        {
          q: "Source of truth for billing is:",
          options: ["The subscriptions table", "Stripe", "Your spreadsheet"],
          answerIndex: 1,
        },
        {
          q: "The Stripe test card number is:",
          options: ["1111 1111 1111 1111", "4242 4242 4242 4242", "0000 0000 0000 0000"],
          answerIndex: 1,
        },
        {
          q: "When a paid user's tier didn't unlock, first step:",
          options: [
            "Email the user an apology.",
            "Check the Stripe event for that customer.",
            "Re-deploy the site.",
          ],
          answerIndex: 1,
        },
      ],
    },
    {
      id: "05-publish",
      title: "Publishing, domains & maintenance",
      summary: "Ship safely and verify the live site.",
      body: `## Publish

Use the **Publish** flow. Live URLs: **astralnaut-studios.lovable.app**, **astralnautstudios.com**, and **www.astralnautstudios.com**.

## Post-publish checklist

- [ ] Home loads on apex and www.
- [ ] Pricing shows the right products and prices.
- [ ] Incognito test checkout completes.
- [ ] Webhook updates the subscription row.
- [ ] Help Center and Training routes load.

## Routine maintenance

- Weekly: glance at error logs.
- Monthly: rotate any expiring secrets.
- Quarterly: review RLS policies for new tables.

## You're certified

Print your **Astralnaut Certified — Admin** badge from the course overview.`,
      quiz: [
        {
          q: "After publishing, you should:",
          options: [
            "Trust it worked.",
            "Run a live checkout in incognito.",
            "Wait a day before checking.",
          ],
          answerIndex: 1,
        },
        {
          q: "How often should you review RLS policies?",
          options: ["Never", "Quarterly", "Only when something breaks"],
          answerIndex: 1,
        },
        {
          q: "The published custom domain is:",
          options: ["astra.com", "astralnautstudios.com", "studios.lovable.dev"],
          answerIndex: 1,
        },
      ],
    },
  ],
};
