# Deployment — Astralnaut Studios

The site is a TanStack Start SSR app built by Vite + Nitro into a Cloudflare
Worker. There is no Lovable dependency in the build, the runtime, or the deploy
path. IONOS keeps the domain registration; Cloudflare serves the site.

## How a deploy happens

Push to `main`. `.github/workflows/deploy.yml` builds, typechecks, verifies the
bundle with a dry-run, and then deploys. Pull requests run the same build and
verification but never deploy.

To deploy by hand from a clean checkout:

```
npm ci
npm run build
npm run deploy
```

`npm run build` emits `.output/`, including a generated
`.output/server/wrangler.json`. That generated file — not the `wrangler.jsonc`
at the repo root — is what gets deployed. Nitro copies `name`,
`compatibility_date`, `compatibility_flags`, and `routes` from the root config
into it, and overrides `main`.

## One-time setup

### 1. Repository secrets

Settings -> Secrets and variables -> Actions:

| Secret | Where it comes from |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare -> My Profile -> API Tokens -> Create Token -> "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard sidebar |

These two only authorize the deploy. No application secret belongs in GitHub.

### 2. Worker runtime secrets

Application secrets live on the Worker and persist across deploys, so they are
set once and never appear in CI. Build first so the generated config exists:

```
npm run build
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY   --config .output/server/wrangler.json
npx wrangler secret put STRIPE_LIVE_API_KEY         --config .output/server/wrangler.json
npx wrangler secret put STRIPE_SANDBOX_API_KEY      --config .output/server/wrangler.json
npx wrangler secret put PAYMENTS_LIVE_WEBHOOK_SECRET    --config .output/server/wrangler.json
npx wrangler secret put PAYMENTS_SANDBOX_WEBHOOK_SECRET --config .output/server/wrangler.json
npx wrangler secret put RESEND_API_KEY              --config .output/server/wrangler.json
npx wrangler secret put ARCHIVE_GAME_EVENTS_HMAC_SECRET --config .output/server/wrangler.json
```

See `.env.example` for what each one is and which code path reads it. The
`VITE_*` values are publishable, are inlined at build time, and are already
committed in `.env` / `.env.development` / `.env.production` — they are build
inputs, not secrets.

`SUPABASE_SERVICE_ROLE_KEY` must be the key for `scjatmhkwcrqwssyypkd` — the
Streamwalkers-owned project the repo points at. Do not carry over the old
project's key: it authenticates against a different database, so every
server-side read would silently hit the Lovable-owned copy instead. There is no
rotation to do, because this project's key has never left the dashboard.

### 3. Supabase redirect allow-list

**Done — 2026-08-28.** Recorded here so it can be re-verified, not repeated.

This applies to the Streamwalkers-owned project `scjatmhkwcrqwssyypkd`, which is
what `.env` and `supabase/config.toml` point at. The old Lovable-owned project
`xcznyhkaispxnjrvhdnc` still serves the live site and is not configured here.

Google sign-in goes through Supabase directly rather than Lovable's wrapper.
Supabase rejects any redirect target it does not recognize. Under
Authentication -> URL Configuration:

- Site URL: `https://astralnautstudios.com`
- Redirect URLs:

```
https://astralnautstudios.com/**
https://www.astralnautstudios.com/**
http://localhost:8080/**
```

Wildcards, not literal `/login` paths. `src/routes/login.tsx` builds
`redirectTo` from `window.location.origin` and appends more than one path
(`/verify-email?...` and `/login?oauth=1...`), so a per-path allow-list would
reject the verification round trip.

(`vite dev` serves on 8080 — pinned in `vite.config.ts` — not Vite's default
5173, and not the 3000 Supabase pre-fills.)

Leaked-password protection is also enabled, under Authentication -> Providers ->
Email. The Attack Protection page only reports status; it does not toggle it.

### 4. Resend sending domain

`noreply@astralnautstudios.com` and `hello@astralnautstudios.com` will both
bounce until `astralnautstudios.com` is verified in Resend. Add the SPF and
DKIM records Resend gives you at whichever DNS provider is authoritative at the
time — IONOS before the cutover, Cloudflare after. If you add them at IONOS and
then move nameservers, carry them across, or verification lapses.

### 5. Stripe webhook endpoint

The webhook handler requires an `env` query parameter and ignores the request
without it. Point the Stripe endpoints at:

```
https://astralnautstudios.com/api/public/payments/webhook?env=live
https://astralnautstudios.com/api/public/payments/webhook?env=sandbox
```

Each endpoint's signing secret is the corresponding `PAYMENTS_*_WEBHOOK_SECRET`
above.

## DNS cutover

Do this only after a `workers.dev` deploy has been smoke tested.

1. Deploy. Confirm the app works at
   `astralnaut-studios.<your-subdomain>.workers.dev`.
2. Add `astralnautstudios.com` as a zone in Cloudflare. Cloudflare will scan
   existing records — check that MX and any TXT records survived the import,
   because losing MX silently kills inbound mail.
3. At IONOS: Domains -> DNS -> Nameservers -> Use custom nameservers, and enter
   the pair Cloudflare gives you. Propagation is usually under an hour.
4. Wait for the Cloudflare zone to report **Active**.
5. Uncomment the `routes` block in `wrangler.jsonc` and deploy. Wrangler
   attaches both hostnames and creates the proxied DNS records itself. Do not
   hand-create A or CNAME records for the apex or `www` — they conflict.

## Known state

`npm run typecheck` is at **zero errors**. The 33 TanStack Router `search` prop
mismatches (TS2741/TS2345) inherited from the Lovable-era code were cleared
during the migration, and `continue-on-error` has been removed from the workflow
step — a new type error now blocks the deploy rather than warning.

Verified 2026-08-28 against the current tree: `npm run build` succeeds,
`npm run typecheck` exits 0, and `npm run deploy:dry` packages 300 modules at
9,139 KiB (1,714 KiB gzipped) with a single `env.ASSETS` binding.

`npm run lint` reports several thousand errors, nearly all `prettier/prettier`
formatting. The repo has never been formatted. `npm run format` will fix it, but
it rewrites almost every file, so it is worth doing as its own commit rather
than mixed into feature work.
