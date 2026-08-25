#!/usr/bin/env node
/**
 * Fail-the-build guard for user-facing banned terms.
 *
 * Scans src/ and public/ for terms the legal review team has forbidden in
 * shipped copy. Matches are word-bounded so DB identifiers and internal
 * variable names (raffle_entries, raffleEntries) do not trigger.
 *
 * A narrow allowlist covers strictly legitimate occurrences (the Google LLC
 * subprocessor legal name, the /raffle/* → /sweepstakes/* redirect stubs,
 * and the admin compliance change-log which documents the sweep itself).
 *
 * Implemented with node:fs only. It deliberately does NOT shell out to
 * ripgrep: `rg` is not installed on GitHub's ubuntu-latest runners, so an
 * rg-based implementation passes locally and dies in CI with
 * `/bin/sh: 1: rg: not found`.
 *
 * Runs automatically before `npm run build` via the `prebuild` npm hook.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOTS = ["src", "public"];

const BANNED = [
  { name: "LLC", regex: /\bLLC\b/i },
  { name: "raffle", regex: /\braffle\b/i },
];

// Files/paths that are exempt because the term is legitimate there.
// Keep this list SHORT and DOCUMENTED — every entry needs a real reason.
const ALLOWLIST = [
  // Real legal name of an actual third-party subprocessor.
  { file: "src/routes/subprocessors.tsx", term: "LLC", reason: "Google LLC — real vendor name" },
  // Permanent redirect stubs so old /raffle/* URLs still resolve.
  { file: "src/routes/raffle.rules.tsx", term: "raffle", reason: "Legacy redirect stub" },
  { file: "src/routes/raffle.free-entry.tsx", term: "raffle", reason: "Legacy redirect stub" },
  // Engineering change-log that intentionally references the swept terms.
  { file: "src/routes/_authenticated/admin.compliance-changelog.tsx", term: "LLC", reason: "Compliance change-log documents the sweep" },
  { file: "src/routes/_authenticated/admin.compliance-changelog.tsx", term: "raffle", reason: "Compliance change-log documents the sweep" },
];

// Paths that are never scanned. A trailing "/**" excludes the whole directory;
// anything else is an exact repo-relative file path.
const EXCLUDES = [
  "supabase/migrations/**",   // immutable history
  "src/routeTree.gen.ts",     // auto-generated (redirect route names leak in)
  "src/integrations/supabase/types.ts", // auto-generated DB types (raffle_entries table)
  "node_modules/**",
  "docs/**",                  // planning/compliance notes, not shipped copy
  ".reports/**",              // scratch output from scripts/safe-area-visual-check.mjs
  "scripts/check-banned-terms.mjs", // this file
];

const EXCLUDED_DIRS = EXCLUDES.filter((p) => p.endsWith("/**")).map((p) => p.slice(0, -3));
const EXCLUDED_FILES = new Set(EXCLUDES.filter((p) => !p.endsWith("/**")));

/** Repo-relative POSIX path, so ALLOWLIST/EXCLUDES entries match on Windows too. */
function rel(absolutePath) {
  return relative(process.cwd(), absolutePath).split(sep).join("/");
}

function isExcluded(relPath) {
  if (EXCLUDED_FILES.has(relPath)) return true;
  return EXCLUDED_DIRS.some((dir) => relPath === dir || relPath.startsWith(`${dir}/`));
}

/** A NUL byte in the first 8 KiB means binary — images, video, fonts. */
function isBinary(buffer) {
  return buffer.subarray(0, 8192).includes(0);
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return; // root not present in this checkout
    throw err;
  }
  for (const entry of entries) {
    const abs = join(dir, entry.name);
    const relPath = rel(abs);
    if (isExcluded(relPath)) continue;
    if (entry.isDirectory()) {
      yield* walk(abs);
    } else if (entry.isFile()) {
      yield { abs, relPath };
    }
  }
}

function scanAll() {
  const hits = [];
  for (const root of ROOTS) {
    for (const { abs, relPath } of walk(root)) {
      let buffer;
      try {
        buffer = readFileSync(abs);
      } catch {
        continue; // unreadable (broken symlink, permissions) — not our problem
      }
      if (isBinary(buffer)) continue;

      const lines = buffer.toString("utf8").split(/\r?\n/);
      for (const { name, regex } of BANNED) {
        // Fresh regex per file: avoids any lastIndex state leaking between files.
        const matcher = new RegExp(regex.source, "i");
        lines.forEach((text, i) => {
          if (matcher.test(text)) {
            hits.push({ file: relPath, line: i + 1, text, term: name });
          }
        });
      }
    }
  }
  return hits;
}

function isAllowed(hit) {
  return ALLOWLIST.some(
    (a) => a.file === hit.file && a.term.toLowerCase() === hit.term.toLowerCase(),
  );
}

const violations = scanAll().filter((hit) => !isAllowed(hit));

if (violations.length === 0) {
  console.log("✓ Banned-term check passed (LLC, raffle).");
  process.exit(0);
}

console.error("\n✗ Banned-term check FAILED. User-facing copy contains forbidden terms.\n");
for (const v of violations) {
  console.error(`  [${v.term}] ${v.file}:${v.line}  ${v.text.trim()}`);
}
console.error(
  "\nFix the copy or, if the occurrence is legitimate (e.g. a real vendor legal name),",
  "\nadd a narrow, documented entry to ALLOWLIST in scripts/check-banned-terms.mjs.\n",
);
process.exit(1);
