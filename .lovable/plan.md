## Goal
Log every unique visitor's IP (plus minimal context) so you can distinguish your own traffic from organic users.

## Approach

### 1. New table: `visitor_hits`
Columns:
- `id uuid pk default gen_random_uuid()`
- `ip text` (from `CF-Connecting-IP` / `X-Forwarded-For`)
- `ip_hash text` (sha256 of ip+day, for unique-per-day counting without PII duplication)
- `user_agent text`
- `path text`
- `referrer text`
- `country text` (from `CF-IPCountry` header if present)
- `user_id uuid null` (if signed in)
- `created_at timestamptz default now()`

RLS:
- `GRANT SELECT` to authenticated, `GRANT ALL` to service_role.
- SELECT policy: admins only (`public.has_role(auth.uid(),'admin')`).
- No insert policy needed — writes go through the server route using the service role.

Index: `(created_at desc)`, `(ip)`, unique `(ip_hash, path)` partial to dedupe within day (optional — or keep all hits).

### 2. Server route: `src/routes/api/public/track.ts`
- `POST` handler.
- Reads IP from request headers (`cf-connecting-ip`, `x-forwarded-for` first hop, `x-real-ip`).
- Validates input with zod (`path`, `referrer`).
- Inserts into `visitor_hits` via `supabaseAdmin` (loaded inside handler).
- Returns 204.
- No signature needed (public beacon), but rate-limit by ignoring if path is missing/oversized.

### 3. Client beacon
- New tiny module `src/lib/track-visit.ts` that POSTs `{ path, referrer }` to `/api/public/track` via `navigator.sendBeacon` (fallback to `fetch keepalive`).
- Wired in `src/routes/__root.tsx` inside a `useEffect` that fires on route change (subscribe to `router.subscribe('onResolved', ...)` or watch `location.pathname`).
- Runs once per pathname per session (in-memory `Set`) to avoid spam.

### 4. Admin view
- New route `src/routes/_authenticated/admin.visitors.tsx` (or a tab on existing `/admin`).
- Lists last 500 hits with IP, country, path, UA, time.
- Aggregates: unique IPs today / 7d / 30d.
- Lets you tag/recognize your own IP visually (simple client-side filter input — "hide IP =").

### 5. Self-identification
Simplest: just look at the table and recognize your IP. Optional follow-up (not in this plan): an `ignored_ips` table you can add your IP to, with the admin view auto-filtering them out.

## Out of scope
- GeoIP enrichment beyond the `CF-IPCountry` header.
- Bot filtering (can add UA blocklist later).
- GDPR/cookie banner changes — IP logging for security/abuse-prevention is generally legitimate interest, but let me know if you want a privacy note added.

## Confirm before I build
1. OK to store raw IP, or hash-only?
2. Add an `ignored_ips` allowlist now, or just eyeball the table for v1?
