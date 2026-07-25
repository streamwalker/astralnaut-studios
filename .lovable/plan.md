## Problem

The `/login` page currently reads "Admin access for Astralnaut Studios" in its default (no-plan) copy, which makes regular readers like emily@streamwalkers.com think the page is staff-only. The auth flow itself already works for any user — only the framing is wrong — but the default post-login redirect also sends everyone to `/admin`, which is a 403-feeling dead end for non-admins.

## Changes (src/routes/login.tsx only)

1. **Rewrite the default header copy** (the `else` branch, ~lines 185–190) so it speaks to all readers:
   - Sign-in title stays "Sign in"; sign-up title stays "Create account".
   - Subhead changes from "Admin access for Astralnaut Studios." to reader-facing copy, e.g. "Sign in to read free previews, track your standing, and unlock subscriber perks."
2. **Fix the default post-login destination** (`successDestination`, ~line 64): when there's no `search.next` and no `search.plan`, send users to `/account` instead of `/admin`. Admins can still reach `/admin` from the header. If `search.next` is provided (e.g. the reader gate passing `?next=/reader/...`), that continues to win.
3. **Minor**: update the page `<title>` if needed — current "Sign in — Astralnaut Studios" is already fine, leave it.

No changes to auth logic, Supabase config, profile gate, email verification, or the `_authenticated` layout — those already work for any signed-in user.

## Out of scope

- Any RLS / role changes.
- Redesign of the login card.
- Changes to the reader gate or profile-completion flow.
