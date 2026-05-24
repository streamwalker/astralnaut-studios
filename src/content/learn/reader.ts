import type { Course } from "./types";

export const readerCourse: Course = {
  id: "reader",
  label: "Reader Track",
  basePath: "/learn",
  modules: [
    {
      id: "01-welcome",
      title: "Welcome & creating your account",
      summary: "Get oriented and sign up in under a minute.",
      body: `## What you'll learn

- What Astralnaut Studios is and who it's for.
- How to create an account and sign in safely.
- How to take the guided tour anytime you want a refresher.

## The 30-second pitch

Astralnaut Studios is a creator-direct comics platform. New pages drop here first. Subscribers vote on canon, win original art, and get patron perks like signed prints.

## Create your account

1. Click **Sign in** → **Create account**.
2. Use email + password or continue with Google.
3. Confirm your email.

## Take the tour

Hit **Restart guided tour** from the Help Center anytime. It points to every key part of the site in about a minute.`,
      quiz: [
        {
          q: "Which is true about Astralnaut Studios?",
          options: [
            "It's a comics aggregator that re-hosts pages from other sites.",
            "It's a creator-direct platform where new pages drop first.",
            "It's a print-only subscription with no digital reader.",
          ],
          answerIndex: 1,
        },
        {
          q: "How do you create an account?",
          options: [
            "Email me a request.",
            "Click Sign in → Create account, then use email or Google.",
            "Buy a print first and an account is mailed to you.",
          ],
          answerIndex: 1,
        },
        {
          q: "Where do you relaunch the guided tour?",
          options: ["From the Help Center.", "From Stripe.", "You can't — it only runs once."],
          answerIndex: 0,
        },
      ],
    },
    {
      id: "02-tiers",
      title: "Choosing a subscription tier",
      summary: "Reader, Initiate, Patron — what each includes and how to switch.",
      body: `## The three tiers

| Tier | Monthly | Annual | Raffle entries/week | Highlights |
|---|---|---|---|---|
| Reader | $4.99 | $49.90 | 1 | Forum, canon voting |
| Initiate | $9.99 | $99.90 | 3 | + numbered digital variants |
| Patron | $24.99 | $249.90 | 10 | + cameo eligibility, quarterly signed print, creator Discord |

## Monthly vs annual

Annual is ~2 months free. Switch anytime from the billing portal.

## Subscribe

Pricing page → toggle billing cycle → pick a tier → checkout.`,
      quiz: [
        {
          q: "Which tier includes the quarterly signed physical print?",
          options: ["Reader", "Initiate", "Patron"],
          answerIndex: 2,
        },
        {
          q: "How many raffle entries per week does Initiate get?",
          options: ["1", "3", "10"],
          answerIndex: 1,
        },
        {
          q: "Annual billing saves you roughly:",
          options: ["No savings", "About 2 months free", "Half off"],
          answerIndex: 1,
        },
      ],
    },
    {
      id: "03-reading",
      title: "Reading & navigating issues",
      summary: "Use the reader like a power user.",
      body: `## Open an issue

Library → series → issue cover, or hit **Start reading** in the header for the latest.

## Shortcuts

- **← / →** previous / next page
- **F** fullscreen
- Click the page to advance

## Tips

- Progress is saved per account.
- Use the issue picker to jump.
- Hover the **(?)** icons in the reader for in-context help.`,
      quiz: [
        {
          q: "What does F do in the reader?",
          options: ["Favorite the page", "Toggle fullscreen", "Flag a typo"],
          answerIndex: 1,
        },
        {
          q: "Where is reading progress saved?",
          options: ["On your device only", "To your account", "Nowhere — start over each time"],
          answerIndex: 1,
        },
        {
          q: "Fastest way to jump to the latest issue:",
          options: ["Browser history", "Start reading in the header", "Email support"],
          answerIndex: 1,
        },
      ],
    },
    {
      id: "04-raffles",
      title: "Raffles, rewards & free entry",
      summary: "Get the most out of weekly entries and the AMOE path.",
      body: `## Entries per tier

- Reader: 1/week
- Initiate: 3/week
- Patron: 10/week

Entries are granted automatically each billing cycle.

## Free path (AMOE)

No purchase necessary. Go to **/raffle/free-entry** and submit your details. Limits apply per the rules.

## What you can win

Numbered variant covers, signed prints, original art, and cameos (Patron only).

## Rules

The binding text lives at **/raffle/rules**.`,
      quiz: [
        {
          q: "Do you have to subscribe to enter raffles?",
          options: ["Yes, always.", "No — the AMOE path is free.", "Only during launches."],
          answerIndex: 1,
        },
        {
          q: "Where do the official rules live?",
          options: ["/help", "/raffle/rules", "Only in the email confirmation"],
          answerIndex: 1,
        },
        {
          q: "Patrons get how many entries per week?",
          options: ["3", "5", "10"],
          answerIndex: 2,
        },
      ],
    },
    {
      id: "05-patron",
      title: "Patron perks & community",
      summary: "Cameos, shipping, Discord, and canon voting.",
      body: `## Patron perks

- Cameo eligibility for upcoming issues.
- Quarterly signed physical print — shipped to the address on file.
- Direct creator Discord — unique invite on your account page.

## Keep shipping current

Account → Shipping. Update before the next quarter to avoid a missed print.

## Canon voting

All paid tiers vote on canon decisions. One vote per account.

## You're done

You've finished the reader track. Print your certificate from the course overview page.`,
      quiz: [
        {
          q: "Where do you update your shipping address?",
          options: ["Stripe directly", "Account → Shipping", "Email support each quarter"],
          answerIndex: 1,
        },
        {
          q: "Who can vote on canon decisions?",
          options: ["Only Patrons", "All paid tiers", "Anyone with an email"],
          answerIndex: 1,
        },
        {
          q: "Cameo eligibility is for:",
          options: ["Reader tier", "Initiate tier", "Patron tier"],
          answerIndex: 2,
        },
      ],
    },
  ],
};
