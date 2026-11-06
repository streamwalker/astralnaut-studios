# Gridiron Zero private production library

The existing administrator account opens `/admin/gridiron-zero` from the admin dashboard. The page loads the approved interactive Bible through `/api/admin/gridiron-zero/library`. Search, references, documents, exports, printing and character deep links remain inside that library. Review notes are browser-local and scoped to the signed-in administrator; the local-file edition's notes can be transferred with Export / Import.

## Access and storage

This repository is public. Never commit the plaintext HTML, dossiers, images, scripts or decryption keys. `private-content/gridiron-zero/library-v1.enc` is an AES-256-GCM encrypted gzip document. Its key lives in the GitHub Actions secret and Cloudflare runtime binding `GRIDIRON_LIBRARY_KEY_V1`. Only ciphertext is included in public assets and CI artifacts. The manifest records hashes and byte counts, not story content.

The entry wrapper verifies the bearer token through Supabase Auth, then checks the verified user's `admin` role through the existing `user_roles` policy. It decrypts only after both checks pass. No subscription tier grants access. Failures deny access and successful document responses use `private, no-store` and `Vary: Authorization`. Keys and auth tokens are never sent to the iframe. The ordinary public website continues through the unchanged Nitro entry.

Cloudflare implementation references: https://developers.cloudflare.com/workers/static-assets/routing/worker-script/ and https://developers.cloudflare.com/workers/static-assets/binding/ .

## Build and deployment

`npm run build` runs `scripts/package-gridiron-library.mjs` after Nitro. It copies ciphertext, installs the gate, and selects `gridiron-entry.mjs` as the deployment entry. Do not deploy a bare `vite build` output without this packaging step. GitHub's production workflow provisions the private runtime key before deploying the verified build.

Validation: `npm run typecheck`, `npm run test:gridiron`, existing repository checks, and `npm run deploy:dry`. The gate tests cover anonymous requests, invalid/expired sessions, non-admin roles, failed role lookups, successful authenticated decryption, tampered ciphertext, missing configuration and generated deployment wiring. Live acceptance must include the logged-in browser and an unauthenticated request to the document endpoint.

## Future content updates

`prepare-gridiron-library.mjs` documents the one-time v1 import and hosted adaptations. For a subsequent edition, introduce a new versioned payload/key binding (v2, etc.) and matching manifest/gate/workflow changes. Keep v1's runtime key for rollback; do not overwrite its key while v1 is live. The source-of-truth manuscript stays in the private creative workspace. Never paste keys into commands, logs or chat.

A code rollback can restore the prior Git revision through the normal production workflow. Keeping the versioned key preserves access to its matching ciphertext.
