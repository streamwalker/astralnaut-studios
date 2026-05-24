## Goal

Ship a complete in-app help, training, and onboarding system for Astralnaut Studios — split into a public **Reader** experience and a gated **Admin/Creator** experience. Progress and dismissals stored in `localStorage` (no DB changes).

## Deliverables

### 1. Help Center routes (searchable manual)

```
src/routes/help.tsx              -> /help (Reader hub — landing + search)
src/routes/help.$slug.tsx        -> /help/:slug (Reader article)
src/routes/_authenticated/admin.help.tsx          -> /admin/help (Admin hub)
src/routes/_authenticated/admin.help.$slug.tsx    -> /admin/help/:slug (Admin article)
```

- Sidebar with categories, top search bar (client-side filter over article frontmatter).
- Each article: title, summary, body, "Related articles", "Was this helpful?" (localStorage feedback).
- Per-route `head()` metadata (title, description, og:title, og:description).

**Reader categories (~12 articles):**
- Getting Started (account, sign in, pick a tier)
- Reading (using the reader, navigation, offline tips)
- Subscriptions & Billing (tiers, monthly vs annual, Stripe portal, cancel)
- Raffles & Rewards (entries per tier, AMOE free entry, rules)
- Patron Perks (cameos, signed prints, shipping)
- Community & Canon Voting
- Account & Privacy

**Admin categories (~10 articles):**
- Admin overview & access
- Managing pages & content
- Growth playbook & tools
- Subscriptions dashboard
- Raffle entries & winners
- Stripe test vs live mode
- Webhook troubleshooting
- Publishing & domains

### 2. Step-by-step guided tour (overlay)

`src/components/tour/` — lightweight driver:
- `TourProvider` (context + localStorage `tour:<id>:done` flag)
- `TourOverlay` (spotlight + tooltip card, prev/next/skip, progress dots)
- `useTour(steps)` triggered on first visit to a route, or via "Restart tour" button in help center.

**Reader tour** (auto on first `/` visit): Library → Series card → Reader CTA → Pricing → Account → Help.
**Admin tour** (auto on first `/admin` visit): Admin panel → page editor → growth tab → subscriptions → publish.

Steps target elements via `data-tour="step-id"` attributes added to existing UI. No business logic changes.

### 3. Tooltips & hover popovers

Reusable `<HelpTip id="...">` component using shadcn `Tooltip` (short) and `HoverCard` (rich). Wraps a small `(?)` icon. Each tip is keyed so dismissals/seen state persist in localStorage.

Sprinkle across high-value spots (no logic changes):
- Pricing page: each tier card, monthly/annual toggle, raffle entries badge
- Account page: subscription status, billing portal button, shipping address
- Raffle pages: AMOE explanation, entry count
- Reader: page nav, fullscreen
- Admin: each panel section header

### 4. Training course

`src/routes/learn.tsx` (Reader track) and `src/routes/_authenticated/admin.learn.tsx` (Admin track).

Course structure (5 modules each, slider answer = max depth):
- Module list with progress bar, completion checkmarks (localStorage `course:<track>:<moduleId>`).
- Each module: `src/routes/learn.$moduleId.tsx` — lesson content, "Mark complete" button, prev/next, end-of-module quiz (3 MC questions), optional certificate at 100%.

**Reader course (5 modules):**
1. Welcome & creating your account
2. Choosing a subscription tier
3. Reading & navigating issues
4. Raffles, rewards & AMOE
5. Patron perks & community

**Admin course (5 modules):**
1. Admin orientation & roles
2. Content management
3. Growth tools & analytics
4. Subscriptions & Stripe operations
5. Publishing, domains & maintenance

Final lesson awards a printable "Astralnaut Certified" badge component (localStorage).

### 5. Navigation wiring

- Add **Help** link to `SiteHeader` nav and **Help / Training** column to `SiteFooter`.
- Add **Help** + **Training** entries to the admin sidebar/header on admin routes.
- Add `data-tour` attributes to existing nav items, CTAs, and admin panels.

### 6. Content authoring

Articles + lessons live as typed TS modules:
```
src/content/help/reader/*.ts
src/content/help/admin/*.ts
src/content/learn/reader/*.ts
src/content/learn/admin/*.ts
```
Each exports `{ slug, title, category, summary, body (MDX-lite JSX or string with simple markdown renderer), related[] }`. Avoids new build deps — uses a small in-file markdown→JSX renderer or plain JSX bodies.

## Technical notes

- **Persistence:** all progress/dismissal in `localStorage` under namespaced keys (`astra:tour:*`, `astra:tip:*`, `astra:course:*`). SSR-safe wrapper hook (`useLocalStorage`) that defers reads to `useEffect`.
- **No DB migrations, no server functions, no Stripe changes.**
- **Styling:** reuse existing tokens (`--neon`, `--gold`, `--ink`, `--ink2`, `--border-line`); match current dark sci-fi aesthetic.
- **SEO:** every help/learn route sets distinct `head()` meta. Sitemap updated to include `/help`, `/learn`, and top-level help articles.
- **Accessibility:** tour overlay traps focus, ESC to skip; tooltips keyboard-accessible (shadcn defaults).

## Out of scope

- Backend tracking of course completion (local-only per your choice).
- Video lessons / external course platform.
- Editing existing subscription, raffle, or admin logic.

## Open question

The admin training references the admin panel features. I'll document what's currently in `/admin`, `/growth`, `/growth-package` as-is. If anything is missing or you'd like a feature added before documenting, flag it after approving this plan.