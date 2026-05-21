# Persistent admin session + ADMIN indicator

The Supabase session already persists across the site via `localStorage` — being signed in on `/admin` means you're signed in everywhere. What's missing is a visible signal in the main site header and a quick way to jump back into admin tools. So this is a header-only change.

## Changes

**`src/components/site-header.tsx`**
- Add a small `useAdminSession()` hook (inline) that uses TanStack Query to:
  - read `supabase.auth.getUser()`
  - if signed in, check `user_roles` for `role = 'admin'` (uses the existing `has_role` RLS-friendly pattern via direct select scoped by `user_id`)
  - subscribe to `supabase.auth.onAuthStateChange` to invalidate the query on sign-in / sign-out so the badge appears/disappears immediately
- When `isAdmin` is true, render in the right-side action area:
  - A pulsing **ADMIN MODE** pill (gold border, gold text, small dot) that links to `/admin`
  - Replace the "Sign in" link with a "Sign out" button that calls `supabase.auth.signOut()` and navigates to `/`
  - Keep "Start reading →" CTA unchanged
- When not admin, header behaves exactly as today.

## Out of scope
- No DB / RLS changes — session persistence is already provided by Supabase.
- No changes to `/admin` page itself; the existing `_authenticated` guard + role check stays.
- No global "admin bar" across the top — the pill in the header is the indicator.

## Files touched
- `src/components/site-header.tsx` (only)
