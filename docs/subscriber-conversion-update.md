# Subscriber conversion update — 2026-09-11

## Implemented

- Anonymous visitors can open published free comic pages without signing in, verifying email, or completing a location profile. Paid paths still require the existing authenticated server entitlement function. Unpublished, invalid-date, and future-dated free images are stripped from public responses.
- Homepage tour no longer launches automatically. Admin tour remains available.
- Email signup asks for email, password, and existing account consent. Profile details are deferred. Google sign-in and email verification remain intact.
- Reader $4.99/month is the primary offer. Supporter plans remain available behind an explicit control. Removed unsupported popularity claims and the prize hero slot. Existing prices and subscriber benefits are retained.
- Paid-page offer precedes optional email capture. When an issue has no released Reader pages, the reader shows release signup instead of selling an unavailable continuation.
- Reader destination survives plan selection, login, Stripe return, and active subscription confirmation. Return URLs accept only constrained reader paths.
- Availability counts use server publication and tier-release rules. Battlefield Atlantis and Children of Aquarius no longer advertise hardcoded weekly page quotas. The monthly model is explicitly a studio-wide publishing plan, not a fabricated release guarantee.
- Admin schedule editor can prepare every subscriber page as one issue release. No live schedules or publication timestamps were changed.
- Consented preview, offer, subscription-click, and real Stripe-session-start events persist in the existing analytics table. Admin analytics adds stage session counts, campaign and device filtering, and corrects the misleading unique-visitors label. Counts use the existing 10,000-event sample limit. These are observations rather than an ordered, attribution-complete cohort analysis.

## Production completion requirements

1. Validate a signed-out preview, existing subscriber access, Google/email signup, email verification, Stripe sandbox checkout, webhook entitlement update, reader return, and cancel flow against the actual deployed backend. No production payment was made in this task.
2. Confirm which completed issue will release next and its date. Use Announcements & schedule to put its paid pages in one scheduled release; resolve overlapping legacy drop rows deliberately. Do not invent dates or auto-publish unfinished artwork. Do not remove already granted reader access.
3. Production purchase attribution still comes from Stripe. This patch does not add a verified paid-purchase event to the client-writable analytics table. A server-only deduplicated purchase ledger and consent-aware session attribution are needed for a trustworthy end-to-end sales funnel.
4. Verify analytics consent and RLS inserts against production. Counts exclude visitors without analytics consent and are sessions, not people. Mobile reading usability and real browser completion have not been tested here.
5. Review current database/storage/payment security configuration. Existing server code documents a public comic asset bucket protected by withholding paid paths, and existing entitlement logic accepts sandbox subscriptions. These pre-existing boundaries are retained, not certified as secure.
6. Complete repository security evidence before release. The installed platform gate currently returns not_assessed; assurance is not ready/not assessed and external status is none. No certification or attestation is claimed. Protection cannot be considered enforced until branch/deployment settings require the check.

## Validation

- Production build: passed locally.
- TypeScript: passed locally.
- `node scripts/check-conversion-access.mjs`: passed; covers public published previews, paid/draft/future path stripping, and external/invalid checkout return rejection.
- Deployment packaging dry-run: see recorded execution result.
- Live backend, paid checkout, visual/mobile QA, dependency vulnerability assessment, and independent control review: not assessed.

## Rollback

This branch does not migrate the database or change prices. Revert the application change commit to restore the prior UI and routing. If operators later change issue schedules, preserve a separate database export of those rows before editing and restore them independently. Do not roll back a paid entitlement by guessing dates.
