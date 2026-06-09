
# Letters Pages — "Battlefield at Letters" / "Mail of Aquarius" / "Darker Pages"

Bring back the classic comic letters page: subscribers mail in, the editor (admin) picks a few, publishes them with an editorial reply, and other subscribers comment under each selected letter. The whole page only goes public once the issue's final story page has dropped.

## User-facing surface

**Per-issue letters route:** `/reader/$series/$issue/letters` (or `/letters/$series/$issue`)
- Series-specific masthead with the branded title:
  - `battlefield-atlantis` → **BATTLEFIELD AT LETTERS**
  - `children-of-aquarius` → **MAIL OF AQUARIUS**
  - `darker-ages` → **DARKER PAGES**
- Newsprint two-column layout styled to evoke the uploaded references (bold masthead bar, two-column body, signature block right-aligned under each letter, italic editor reply with em-dash sign-off).
- Three states:
  1. **Issue not fully published** → "Letters open after Issue N concludes" + (if subscribed) a "Submit your letter" CTA that stores a draft for when it opens.
  2. **Issue concluded, no approved letters yet** → "The editor is reading your mail" placeholder + submit form.
  3. **Approved letters present** → Rendered letters with editorial replies and a per-letter comments thread.
- Linked from the reader's last page ("Turn the page → Letters") and from each series page once unlocked.

**Submission form (subscribers only):**
- Fields: subject, body (markdown-lite, length capped), display name (defaults to profile), city/handle line.
- One pending submission per user per issue (can edit until approved/rejected).

**Comments under approved letters (subscribers only):**
- Flat thread per letter, oldest-first, max length, soft-rate-limited.
- Author can delete their own; admin can hide any.

## Admin surface

New tab in `/admin`: **Letters**.
- Filter by series + issue, status (pending / approved / rejected / hidden).
- For each submission: full body, submitter, submitted-at, edit textarea for the **editorial reply**, approve / reject / hide buttons, "feature order" number.
- Moderation for comments: list flagged/recent, hide/restore.

## Visibility / publish gate

A letters page is **publicly visible** only when every page of that issue is published (`comics.published_at <= now()` for all `page_number <= total_pages`). Computed in the server fn that loads the page; admins always see it. Subscribers can always submit (form visible when signed in + active sub) even before the page goes public, so mail accumulates ahead of the reveal.

## Data model (new tables, all RLS-on)

- **`letters`** — `id, issue_id (fk issues), user_id (fk auth.users), subject, body, display_name, location, status ('pending'|'approved'|'rejected'|'hidden'), editor_reply (nullable), feature_order (int, nullable), approved_at, approved_by, created_at, updated_at`. Unique `(issue_id, user_id)` while status in pending/approved.
- **`letter_comments`** — `id, letter_id (fk letters), user_id, body, hidden (bool), created_at, updated_at`.

RLS:
- `letters`: subscriber can insert/update own pending row; subscriber can select own row any status; everyone authed can select approved rows **only when issue fully published** (enforced via security-definer helper `public.issue_is_concluded(issue_id)`); admin all.
- `letter_comments`: any active subscriber can insert on an approved+visible letter; select where `hidden=false` and parent letter visible; author can update/delete own; admin all.

GRANTs to `authenticated` + `service_role` per project rules.

## Server functions (TanStack `createServerFn`)

`src/lib/letters.functions.ts`:
- `getLettersPage({ series, issue })` — returns `{ unlocked, issue, letters: [{...letter, comments: [...] }], canSubmit, mySubmission }`.
- `submitLetter({ issueId, subject, body, displayName, location })` — subscriber-gated, upsert own pending row.
- `addLetterComment({ letterId, body })` — subscriber-gated, rate-limited.
- `deleteOwnComment({ commentId })`.

`src/lib/admin-letters.functions.ts` (admin-only via `has_role`):
- `listLetters({ filter })`, `setLetterStatus({ id, status, editorReply, featureOrder })`, `setCommentHidden`.

All read RLS-respecting via `requireSupabaseAuth`; admin writes use the same supabase client plus a server-side `has_role` check.

## Files

**New**
- `supabase/migrations/<ts>_letters.sql` — tables, helper fn, RLS, grants.
- `src/lib/letters.functions.ts`, `src/lib/admin-letters.functions.ts`.
- `src/routes/reader.$series.$issue.letters.tsx` — public letters page.
- `src/routes/_authenticated/admin.letters.tsx` — admin curation UI.
- `src/components/letters/LetterCard.tsx`, `LetterMasthead.tsx`, `SubmitLetterForm.tsx`, `LetterComments.tsx`.
- `src/lib/letters-branding.ts` — series → masthead title/colors map.

**Edited**
- `src/routes/reader.$series.$issue.tsx` — "→ Letters" link on the final page.
- `src/routes/battlefield-atlantis.tsx`, `children-of-aquarius.tsx`, `darker-ages.tsx` — link to letters page when unlocked.
- `src/routes/_authenticated/admin.index.tsx` — nav link to Letters admin.

## Open questions before build

1. **Submission eligibility** — any active subscriber tier, or only Initiate/Patron?
2. **Comment editing** — allow edits within N minutes, or delete-only?
3. **Profanity / spam** — start with admin-hide-only, add an automated filter later?
4. **Anonymous display** — allow "Name withheld" option, or always require a display name?
