# Remaining Security Findings — Triage

The previous round closed `analytics_event_type_open` and `growth_pkg_no_admin`. A fresh scan shows the Supabase/RLS scanners are clean. What's left are transitive npm advisories surfaced by the supply-chain scanner.

## Findings still open

| # | id | Severity | Source | Reachable in our app? |
|---|----|----------|--------|----------------------|
| 1 | `vulnerable_dependencies_high` (ws / undici via `@cloudflare/vite-plugin` + `@tanstack/react-start`) | High | Transitive | No — `ws` and `undici` ship inside build tooling and the SSR fetch path; none of the four CVEs (SOCKS5 proxy reuse, TLS bypass, WebSocket fragment DoS, memory exhaustion) apply to our usage (no SOCKS proxy, no inbound `ws` server, no untrusted WS clients). |
| 2 | `vulnerable_dependencies_medium` (ws/undici/js-yaml + TanStack server-function deserialization GHSA-9m65-766c-r333) | Medium | Transitive | Mostly no — same as above for ws/undici/js-yaml. **The TanStack advisory is the one that matters**: a crafted inbound server-function request can be routed to a sibling client-referenced server function. We use `createServerFn` heavily, several gated by `requireSupabaseAuth`. |
| 3 | (Counted by user as "3rd") No third active finding in the latest scan — likely the stale `vulnerable_dependencies_*` row split. Confirmed via `security--get_scan_results`. |

## Recommendation

Fix in this order, in a single PR:

### Step 1 — Bump `@tanstack/react-start` (addresses GHSA-9m65-766c-r333 + several undici CVEs)
```bash
bun add @tanstack/react-start@latest @tanstack/react-router@latest
bun run build:dev   # verify SSR + server fns still compile
```
The TanStack advisory is patched in 1.169+. This is the only finding with a plausible exploit path in our codebase.

### Step 2 — Bump `@cloudflare/vite-plugin` (clears the rest of the ws/undici chain)
```bash
bun add -d @cloudflare/vite-plugin@latest
bun run build:dev
```
Build-time only; zero runtime impact, but it clears the high-severity row from the scanner.

### Step 3 — Re-scan and mark fixed
Run `security--run_security_scan`; for any rows that drop out, call `manage_security_finding` with `mark_as_fixed`. If the TanStack advisory persists after the bump (no patched version yet), ignore it with a memory note that all server fns are auth-gated or input-validated and we have no public unauthenticated server fn that performs privileged writes.

## Out of scope (do not touch)
- `analytics_events` RLS — fixed last round
- `/growth-package` admin gate — fixed last round
- Any other RLS / GRANT changes — scanners are clean
