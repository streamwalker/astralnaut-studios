#!/usr/bin/env node
/**
 * Delete orphaned blobs from the `comic-pages` storage bucket.
 *
 * WHY THIS EXISTS: the old upload path wrote the storage object *first* and the
 * `comics` row second, so every failed or re-run upload left a blob behind with
 * nothing pointing at it. The replace path made it worse by chaining version
 * segments onto the key instead of replacing them, so a page replaced three
 * times left two dead blobs and a key like
 * `page-003.v1784783810234.v1788116824680.v1788116927267.png`.
 *
 * Both causes are fixed in the app (src/lib/page-identity.ts is now the single
 * authority for keys, and the upload writes the DB row before the object). This
 * script cleans up what the old code already left behind.
 *
 * WHY IT RECOMPUTES INSTEAD OF TAKING A LIST: a hard-coded path list goes stale
 * the moment anyone uploads, and deleting a blob by a path you did not just
 * verify is how you lose artwork. Every run re-derives the orphan set live.
 *
 * SAFETY RULES, in the order that matters:
 *
 *   1. Dry-run is the default. Deletion requires --apply.
 *   2. A blob is only ever a candidate if it is BOTH unreferenced by any
 *      `comics.image_path` AND byte-identical (same ETag/MD5) to a blob that IS
 *      referenced. An unreferenced blob with unique content is assumed to be
 *      real artwork that simply has no row yet — cover plates live in this
 *      bucket and look exactly like that — and is reported, never deleted.
 *   3. Anything under a directory named in KEEP_PREFIXES is skipped outright.
 *   4. The service-role key is read from the environment. It is never written
 *      to disk, never echoed, and must not be pasted into a shell prompt.
 *
 * Usage, from the repo root:
 *   node --env-file=.env scripts/cleanup-orphan-storage.mjs
 *   node --env-file=.env scripts/cleanup-orphan-storage.mjs --apply
 *
 * Optional flags:
 *   --bucket=comic-pages     bucket to scan (default: comic-pages)
 *   --unique                 also list unique-content orphans in the report
 *   --include-canonical      also delete duplicates sitting at canonical
 *                            `page-NNN.ext` paths (see below — read first)
 *   --json=/tmp/report.json  write the full report for review
 *
 * ABOUT --include-canonical: some duplicates sit at paths that *look* like the
 * real page, e.g. `battlefield-atlantis/issue-1/page-003.png`. They are
 * unreferenced because the row for page 3 points at the chained-version key
 * `page-003.v1784783810234.v1788116824680.v1788116927267.png` instead, and the
 * bytes at the canonical path are the older art now serving as a different
 * page. Deleting them is correct and reclaims the most space, but "delete
 * page-003.png" is alarming enough on its own that it gets a separate flag.
 *
 * Requires in the environment:
 *   VITE_SUPABASE_URL (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * The service-role key bypasses RLS. Run this from a machine you control, and
 * do not run it against a project you are not the owner of.
 */
import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const APPLY = flag("apply");
const SHOW_UNIQUE = flag("unique");
const INCLUDE_CANONICAL = flag("include-canonical");
const BUCKET = value("bucket", "comic-pages");
const JSON_OUT = value("json", null);

/**
 * Directory prefixes never touched, whatever the content hash says. Add to this
 * rather than reaching for a one-off exclusion.
 *
 * `carousel/` holds homepage cover art keyed by nothing in `comics`, so it is
 * unreferenced by construction and must never be swept.
 */
const KEEP_PREFIXES = ["carousel/", "logos/", "characters/", "blog-covers/"];

/**
 * Belt-and-braces on top of the content-hash rule: never delete a file whose
 * name says "cover" or "variant". Cover plates are unreferenced by design, and
 * the unique-content rule already spares them — but two independent reasons to
 * skip a file is the right number when the failure mode is losing artwork.
 */
const KEEP_NAME = /(cover|variant|logo)/i;

/**
 * A path that looks like the canonical home of a page rather than a stray
 * upload: `.../page-017.png` with no version, copy or timestamp segment.
 */
const CANONICAL_PAGE = /\/page-\d{1,4}\.[a-z0-9]+$/i;

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing environment. Need VITE_SUPABASE_URL (or SUPABASE_URL) and " +
      "SUPABASE_SERVICE_ROLE_KEY.\n\n" +
      "Put them in .env and run with `node --env-file=.env`. Do not pass the " +
      "key as a shell argument — it ends up in your shell history.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

/**
 * Recursively list every object in the bucket.
 *
 * `storage.list` returns directories as entries with a null `id`, and it pages
 * at 100 by default — both are easy to miss, and missing either makes the
 * orphan set wrong in the dangerous direction (a referenced blob you failed to
 * list looks like nothing references it).
 */
async function listAll(prefix = "", out = []) {
  const PAGE = 100;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list ${prefix || "/"}: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        await listAll(path, out);
      } else {
        out.push({
          path,
          size: entry.metadata?.size ?? null,
          // Supabase surfaces the S3 ETag, which for a single-part upload is
          // the MD5 of the object. Quotes are part of the header value.
          etag: (entry.metadata?.eTag ?? "").replace(/"/g, "") || null,
          mime: entry.metadata?.mimetype ?? null,
          updated: entry.updated_at ?? null,
        });
      }
    }
    if (data.length < PAGE) break;
  }
  return out;
}

/** Every `image_path` any `comics` row points at, paged past PostgREST limits. */
async function listReferencedPaths() {
  const referenced = new Set();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("comics")
      .select("image_path")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`comics select: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (!row.image_path) continue;
      // Rows have been written both bucket-qualified and bare. Normalise to the
      // in-bucket key so the comparison cannot miss.
      referenced.add(
        row.image_path.startsWith(`${BUCKET}/`)
          ? row.image_path.slice(BUCKET.length + 1)
          : row.image_path,
      );
    }
    if (data.length < PAGE) break;
  }
  return referenced;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Mode:   ${APPLY ? "APPLY — will delete" : "dry run — nothing will be deleted"}\n`);

  const [objects, referenced] = await Promise.all([listAll(), listReferencedPaths()]);
  console.log(`Objects in bucket:      ${objects.length}`);
  console.log(`Paths referenced by DB: ${referenced.size}`);

  // Content hashes of everything a row points at. An orphan is only safe to
  // delete if its bytes are already reachable through one of these.
  const referencedEtags = new Set(
    objects.filter((o) => referenced.has(o.path) && o.etag).map((o) => o.etag),
  );

  const kept = [];
  const duplicates = [];
  const canonical = [];
  const unique = [];
  const unhashed = [];

  for (const obj of objects) {
    if (referenced.has(obj.path)) continue;
    if (KEEP_PREFIXES.some((p) => obj.path.startsWith(p)) || KEEP_NAME.test(obj.path)) {
      kept.push(obj);
      continue;
    }
    if (!obj.etag) {
      // No hash means no proof of duplication. Never delete on a guess.
      unhashed.push(obj);
      continue;
    }
    if (referencedEtags.has(obj.etag)) {
      const entry = {
        ...obj,
        identicalTo: objects.find((o) => referenced.has(o.path) && o.etag === obj.etag)?.path,
      };
      (CANONICAL_PAGE.test(obj.path) ? canonical : duplicates).push(entry);
    } else {
      unique.push(obj);
    }
  }

  const mb = (list) => (list.reduce((s, o) => s + (o.size ?? 0), 0) / 1024 / 1024).toFixed(2);

  console.log(`\nUnreferenced, byte-identical to a live page — DELETABLE: ${duplicates.length}`);
  for (const o of duplicates) {
    console.log(`  ${o.path}`);
    console.log(`      ${o.size ?? "?"} bytes, identical to ${o.identicalTo}`);
  }
  console.log(`  reclaims ~${mb(duplicates)} MB`);

  console.log(
    `\nUnreferenced duplicates at CANONICAL page paths: ${canonical.length}` +
      `${INCLUDE_CANONICAL ? " — INCLUDED (--include-canonical)" : " — held back"}`,
  );
  for (const o of canonical) {
    console.log(`  ${o.path}`);
    console.log(`      ${o.size ?? "?"} bytes, identical to ${o.identicalTo}`);
  }
  if (canonical.length) {
    console.log(`  reclaims ~${mb(canonical)} MB`);
    console.log(
      "  These look like the real page but nothing points at them — the row " +
        "moved to a versioned key. The bytes survive at the path shown above. " +
        "Pass --include-canonical to sweep them too.",
    );
  }

  console.log(`\nUnreferenced but unique content — LEFT ALONE: ${unique.length}`);
  if (SHOW_UNIQUE) {
    for (const o of unique) console.log(`  ${o.path} (${o.size ?? "?"} bytes)`);
  } else if (unique.length) {
    console.log("  (re-run with --unique to list them)");
  }
  console.log(
    "  These are probably real artwork with no comics row yet — cover plates " +
      "live here. Review by eye before deciding anything about them.",
  );
  console.log(`  (~${mb(unique)} MB)`);

  if (unhashed.length) {
    console.log(`\nUnreferenced with no ETag — LEFT ALONE: ${unhashed.length}`);
    for (const o of unhashed) console.log(`  ${o.path}`);
  }
  if (kept.length) {
    console.log(`\nSkipped by KEEP_PREFIXES: ${kept.length}`);
  }

  if (JSON_OUT) {
    await writeFile(
      JSON_OUT,
      JSON.stringify({ bucket: BUCKET, duplicates, canonical, unique, unhashed, kept }, null, 2),
    );
    console.log(`\nFull report written to ${JSON_OUT}`);
  }

  const target = INCLUDE_CANONICAL ? [...duplicates, ...canonical] : duplicates;

  if (!APPLY) {
    console.log(
      `\nDry run. Nothing was deleted. Re-run with --apply to delete ${target.length} object(s).`,
    );
    return;
  }

  if (target.length === 0) {
    console.log("\nNothing to delete.");
    return;
  }

  // Delete in batches. `remove` reports per-object outcomes, so re-verify
  // against the bucket afterwards rather than trusting the call's return.
  const paths = target.map((o) => o.path);
  const BATCH = 50;
  let removed = 0;
  for (let i = 0; i < paths.length; i += BATCH) {
    const slice = paths.slice(i, i + BATCH);
    const { data, error } = await supabase.storage.from(BUCKET).remove(slice);
    if (error) throw new Error(`remove batch ${i / BATCH}: ${error.message}`);
    removed += data?.length ?? 0;
  }
  console.log(`\nDeleted ${removed} of ${paths.length} objects.`);

  // Verify. A green return from `remove` is not proof the blob is gone.
  const after = await listAll();
  const stillThere = paths.filter((p) => after.some((o) => o.path === p));
  if (stillThere.length) {
    console.error(`\nSTILL PRESENT after delete (${stillThere.length}):`);
    for (const p of stillThere) console.error(`  ${p}`);
    process.exitCode = 1;
  } else {
    console.log("Verified: none of the deleted paths are still in the bucket.");
  }
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}`);
  process.exit(1);
});
