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

## Comic reader (November 7, 2026)

`/admin/gridiron-comics` sits beside the Story Bible. It contains all 50 produced images: 35 latest pages and 15 earlier versions, filtered by season, episode, and edition. The admin dashboard and Bible header link to it. Images load individually and lazily; the site does not download the 41 MB offline HTML.

The catalog and each JPEG viewing image are separately encrypted under `GRIDIRON_COMICS_KEY_V1`. The public repository and static deployment contain only ciphertext in `private-content/gridiron-zero/comics-v1`. `/api/admin/gridiron-zero/comics` returns the catalog only after session and admin-role verification; `/api/admin/gridiron-zero/comics/:id` repeats the same checks for every image. Responses use private/no-store headers. The browser creates temporary blob URLs, revokes them when the library closes or refreshes, and scopes the saved reading position to the authenticated administrator.

`node scripts/prepare-gridiron-comics.mjs /absolute/private/path/to/comic-reader` is the one-time v1 import. It encrypts in memory, verifies every round trip, and provisions the key through stdin to GitHub Secrets without exposing it. Subsequent publication batches require a new versioned payload/key and matching gate, packaging, and CI binding changes. Keep old keys for rollback. Never place the offline HTML, plaintext catalog, JPEGs, original PNGs, or private source paths into this public repository.

Local production updates are not automatically public deployments. Rebuild the private local reader, import the new version, run the gate tests/build/typecheck/deploy dry run, and publish through the normal production workflow. Verify the new page count in a signed-in admin browser and reject anonymous catalog/image requests before reporting it published.

## Season 2 opening-block publication (v2)

The v2 catalog used `comics-v2` and `GRIDIRON_COMICS_KEY_V2`: 62 images, comprising 47 current pages and 15 earlier published versions. Season 2 Episodes 1–5 each contain three current pages. Twelve new finished pages were added for Episodes 2–5; rejected generation attempts remain in the private production workspace and are not reader editions.

## Season 3 opening-block publication (v3)

The current catalog uses `comics-v3` and `GRIDIRON_COMICS_KEY_V3`: 77 images, comprising 62 current pages and 15 earlier versions. Season 3 Episodes 1–5 each add three current pages, for 15 new pages. The v1 and v2 ciphertext and secrets remain available for rollback. The importer targets v3 and refuses an existing v3 secret; introduce another version for a future batch.

The private source reader embeds all 77 viewing images in one portable HTML file. Its source art, adaptation scripts, generation prompts, continuity corrections and verification records remain in the private creative workspace. The public repository receives only the encrypted catalog and 77 encrypted images; the existing admin role checks apply to every new page.


## Official visual continuity publication (November 8, 2026)

Current editions: Story Bible `library-v2.enc` / `GRIDIRON_LIBRARY_KEY_V2`; comics `comics-v4` / `GRIDIRON_COMICS_KEY_V4`. The Bible retains 52 character dossiers and 58 reference sheets. The reader contains 105 images: 62 current pages and 43 earlier editions. This batch adds 28 visual continuity revisions across three seasons; their source pages remain clearly marked as earlier appearances.

Old payloads and versioned secrets are retained for rollback. Use new payload/key versions for future publication. The latest counts and bindings supersede historical sections above. All artwork and manuscripts remain encrypted in this public repository.
