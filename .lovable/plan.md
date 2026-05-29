# Admin Users & Per-User Analytics

Add a new admin route `/admin/users` that lists every account on the platform, lets admins invite/add/edit/grant access, and drills into per-user engagement metrics derived from the existing `analytics_events` table.

## New route

`src/routes/_authenticated/admin.users.tsx`
- Two views: **directory** (list) and **detail** (`?userId=...`).
- Linked from the admin header next to "Security".

## Directory view

Table of all users with:
- Email, display name, role badge (admin / user), subscription tier + status, last sign-in, sessions (last 30d), total time on site, last seen, signup date.
- Search by email/name, filter by role and subscription status.
- Row actions: **View metrics**, **Edit**, **Grant/revoke admin**, **Remove**.
- Toolbar buttons: **Invite user** (sends Supabase invite email), **Add user** (create with temp password).

## Detail view (per user)

Header: avatar/initials, email, name, role, subscription, account created, last login.

Sections:
1. **Overview cards** — total sessions, total pageviews, total time on site, avg session length, last active.
2. **Activity timeline** — recent pageviews + clicks (path, target, timestamp, duration) with pagination.
3. **Top pages** — pages visited most, with view count and average time spent (what they linger on).
4. **Top clicks** — most-clicked targets with counts (what they engaged with).
5. **Sessions** — grouped by `session_id` with start/end, duration, page count.
6. **Subscription panel** — current plan, period, Stripe customer id, shipping address (read-only).
7. **Edit panel** — change display name, toggle admin role, send password reset, send magic link, delete user.

All metrics computed from existing `analytics_events` rows filtered by `user_id`.

## Server-side work (TanStack server functions, admin-gated)

New file `src/lib/admin-users.functions.ts` with `requireSupabaseAuth` + admin check, using `supabaseAdmin` for auth API calls. Functions:
- `listUsers({ search, page })` — `supabaseAdmin.auth.admin.listUsers()` joined with `user_roles`, `subscriptions`, and aggregated `analytics_events` (sessions, last_seen, total_ms).
- `getUserDetail({ userId })` — auth user + role + subscription + analytics aggregates + recent events.
- `inviteUser({ email })` — `supabaseAdmin.auth.admin.inviteUserByEmail`.
- `createUser({ email, password, displayName })` — `supabaseAdmin.auth.admin.createUser`.
- `updateUser({ userId, displayName, email })` — `supabaseAdmin.auth.admin.updateUserById`.
- `setUserRole({ userId, role, grant })` — insert/delete in `user_roles`.
- `sendPasswordReset({ email })`, `deleteUser({ userId })`.

Every function verifies the caller is admin via `has_role(auth.uid(), 'admin')` before touching `supabaseAdmin`.

## Technical notes

- `last_sign_in_at` comes from `auth.users` (only reachable via `supabaseAdmin`), so the directory must go through a server function — RLS-scoped browser queries can't see it.
- "Time on page" / "lingered on" reuses the `page_leave` events already emitted by `AnalyticsTracker` (duration_ms per path).
- "What they clicked" reuses the `click` events with their `target` description.
- Invites and password resets use Supabase's built-in email templates — no new email infra needed.
- Add the route to the admin header (`src/routes/_authenticated/admin.tsx`) as a "Users" pill.

## Open questions

1. Should "Add user" create the account silently with a temp password, or always go through the email **Invite** flow? (Invite is safer — user sets their own password.)
2. For "grant access," is the only role admin/user, or do you also want a moderator/editor tier?
3. Should deleting a user also wipe their `analytics_events` and `subscriptions` rows, or keep them for historical metrics?
