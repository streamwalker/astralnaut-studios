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
 * Runs automatically before `bun run build` via the `prebuild` npm hook.
 */
import { execSync } from "node:child_process";

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

// Files/globs that ripgrep should never search.
const EXCLUDES = [
  "supabase/migrations/**",   // immutable history
  "src/routeTree.gen.ts",     // auto-generated (redirect route names leak in)
  "src/integrations/supabase/types.ts", // auto-generated DB types (raffle_entries table)
  "node_modules/**",
  ".lovable/**",
  "scripts/check-banned-terms.mjs", // this file
];

function scan(term, regex) {
  const args = [
    "rg", "-n", "-i", "--no-heading", "--color=never",
    ...EXCLUDES.flatMap((g) => ["-g", `!${g}`]),
    "-e", regex.source,
    "src/", "public/",
  ];
  try {
    const out = execSync(args.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(" "), {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return out.split("\n").filter(Boolean).map((line) => {
      const [file, lineNo, ...rest] = line.split(":");
      return { file, line: Number(lineNo), text: rest.join(":"), term };
    });
  } catch (err) {
    // rg exits 1 when no matches — treat as clean.
    if (err.status === 1) return [];
    throw err;
  }
}

function isAllowed(hit) {
  return ALLOWLIST.some(
    (a) => a.file === hit.file && a.term.toLowerCase() === hit.term.toLowerCase(),
  );
}

const violations = [];
for (const { name, regex } of BANNED) {
  for (const hit of scan(name, regex)) {
    if (!isAllowed(hit)) violations.push(hit);
  }
}

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
