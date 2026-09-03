/**
 * Deriving a page number from an upload filename, and auditing a whole upload
 * queue before it touches the database.
 *
 * The bug this replaces: the previous inference took the LAST number in the
 * filename. That is wrong for every filename a real art pipeline produces,
 * because the trailing number is almost never the page — it is the duplicate
 * counter, the version, or the retina multiplier:
 *
 *   "BA Issue 1 Page 14 copy 2.png"  -> 2   (Finder duplicate suffix)
 *   "Page 14 (1).png"                -> 1   (browser download suffix)
 *   "Page 17 v2.png"                 -> 2   (version)
 *   "Page 18@2x.png"                 -> 2   (retina export)
 *   "BA_I1_p20_final_v3.png"         -> 3   (version)
 *
 * Those pages then sort to the front of the issue instead of the back, which
 * is exactly how pages 14 and 15 ended up ahead of page 1.
 *
 * The order of precedence below is deliberate: an explicit `page N` marker
 * always beats a bare number, and version/duplicate noise is stripped before
 * anything is read. Every function here is pure so it can be tested without a
 * browser or a database.
 */

/** How confident we are in a derived page number, for surfacing in the UI. */
export type PageNumberSource =
  | "marker" // an explicit "page 14" / "p14" / "pg-14" in the filename
  | "sole" // exactly one number survived cleaning
  | "trailing" // several numbers survived; took the last one
  | "fallback"; // nothing usable; caller's positional default

export type PageNumberGuess = {
  pageNumber: number;
  source: PageNumberSource;
  /** The filename with version/duplicate noise removed, for debugging. */
  cleaned: string;
};

/**
 * Trailing tokens that are never a page number. Applied repeatedly, so
 * "Page 20 final v3 copy 2" reduces all the way back to "Page 20".
 *
 * Each pattern is anchored to the end of the string. Order does not matter
 * because we loop until nothing more matches.
 */
const NOISE_SUFFIXES: readonly RegExp[] = [
  /[\s._-]*\bcopy\b[\s._-]*\d*$/i, // "copy", "copy 2", "_copy_3"
  /[\s._-]*\(\s*\d+\s*\)$/, // "(1)"
  /[\s._-]*\[\s*\d+\s*\]$/, // "[1]"
  /[\s._-]*@\s*\d+(\.\d+)?x$/i, // "@2x", "@1.5x"
  /[\s._-]*\bv\s*\d+(\.\d+)*$/i, // "v2", "-v1.3"
  /[\s._-]*\b(final|draft|rev|revised|edit|edited|flat|flats|clean|cleaned|fix|fixed|new|old|test|temp|wip|proof|print|web|hires|hi-?res|lowres|lo-?res|small|large|full|orig|original|export|render|final2)\b[\s._-]*\d*$/i,
  /[\s._-]*\b\d{4}-\d{2}-\d{2}$/, // trailing ISO date
  /[\s._-]+$/, // leftover separators
];

/**
 * An explicit page marker. Matched globally so we can take the LAST one —
 * "BA Issue 1 Page 14" must resolve to 14, not to the issue number 1.
 *
 * The leading `(?:^|[^a-z0-9])` rather than `\b` because `_` is a word
 * character: `\bp` never matches in "BA_I1_p20", which is exactly how a
 * pipeline names files. The prefix is non-capturing, so group 1 is the number.
 *
 * Trailing `(?!\d)` rather than `\b` so "Page 16A" still yields 16: there is
 * no word boundary between "6" and "A".
 */
const PAGE_MARKER = /(?:^|[^a-z0-9])(?:pages?|pg|p)[\s._\-#]*(\d{1,4})(?!\d)/gi;

const ANY_NUMBER = /\d{1,4}/g;

/** Strip the extension and every recognised noise suffix. */
export function cleanFilename(name: string): string {
  let base = name.replace(/\.[^.]+$/, "").trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of NOISE_SUFFIXES) {
      const next = base.replace(re, "");
      if (next !== base && next.trim().length > 0) {
        base = next.trim();
        changed = true;
      }
    }
  }
  return base;
}

/**
 * Derive a page number from a filename.
 *
 * `fallback` is used only when the filename carries no usable number at all
 * (e.g. "cover.png"). It is returned with source "fallback" so the caller can
 * flag it in the UI rather than silently accepting a guess.
 */
export function guessPageFromFilename(name: string, fallback: number): PageNumberGuess {
  const cleaned = cleanFilename(name);

  const markers = [...cleaned.matchAll(PAGE_MARKER)];
  if (markers.length > 0) {
    const n = parseInt(markers[markers.length - 1][1], 10);
    if (Number.isFinite(n) && n > 0) {
      return { pageNumber: n, source: "marker", cleaned };
    }
  }

  const numbers = (cleaned.match(ANY_NUMBER) ?? [])
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (numbers.length === 1) {
    return { pageNumber: numbers[0], source: "sole", cleaned };
  }
  if (numbers.length > 1) {
    return { pageNumber: numbers[numbers.length - 1], source: "trailing", cleaned };
  }

  return { pageNumber: fallback, source: "fallback", cleaned };
}

/** Backwards-compatible thin wrapper for callers that only want the number. */
export function inferPageFromFilename(name: string, fallback: number): number {
  return guessPageFromFilename(name, fallback).pageNumber;
}

/**
 * Sort filenames the way a human reads them: "page 2" before "page 10".
 * `localeCompare` with `numeric` does this correctly for mixed text/number.
 */
export function naturalFilenameSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

// ---------------------------------------------------------------------------
// Queue auditing
// ---------------------------------------------------------------------------

export type QueuedPage = {
  id: string;
  title: string;
  pageNumber: number;
  /**
   * The slug this file would be written with. Optional so existing callers keep
   * working, but supplying it is what turns a runtime `comics_slug_key`
   * violation into a pre-flight warning.
   */
  slug?: string;
};

export type ExistingPage = {
  page_number: number;
  title?: string | null;
  /** `comics.slug` of the row already in the issue. */
  slug?: string | null;
};

export type PageNumberProblem =
  /** Two or more queued files claim the same page number. */
  | { kind: "duplicate"; pageNumber: number; titles: string[] }
  /** A queued file claims a page number the issue already has. */
  | { kind: "collision"; pageNumber: number; title: string; existingTitle: string }
  /**
   * A queued file's slug is already taken by a row in this issue — typically
   * because an earlier renumber moved a row's `page_number` but left its slug
   * behind, so the slug for page N now belongs to the row at page N-1.
   * `comics.slug` is globally unique, so this fails at insert time.
   */
  | {
      kind: "slugTaken";
      slug: string;
      title: string;
      existingTitle: string;
      existingPageNumber: number;
    }
  /** Page number is not a positive integer. */
  | { kind: "invalid"; title: string; pageNumber: number }
  /** Result would leave a hole in the issue's numbering. Warning, not an error. */
  | { kind: "gap"; missing: number[] };

export type PageNumberAudit = {
  /** Problems that must be resolved before inserting. */
  blocking: PageNumberProblem[];
  /** Problems worth showing but not worth blocking on. */
  warnings: PageNumberProblem[];
  /** The page numbers the queue would write, sorted. */
  resulting: number[];
};

/**
 * Check an upload queue against the pages already in the issue.
 *
 * Duplicates and collisions block: `comics` has no unique constraint on
 * (issue_id, page_number), so nothing at the database level prevents two rows
 * from claiming the same page. A duplicate there is silent and only shows up
 * later as a page rendering twice or a page vanishing from the reader.
 *
 * Gaps only warn — Battlefield Atlantis legitimately has one today, and an
 * admin uploading a single replacement page mid-issue should not be stopped.
 */
export function auditPageNumbers(
  queue: readonly QueuedPage[],
  existing: readonly ExistingPage[] = [],
): PageNumberAudit {
  const blocking: PageNumberProblem[] = [];
  const warnings: PageNumberProblem[] = [];

  for (const item of queue) {
    if (!Number.isInteger(item.pageNumber) || item.pageNumber < 1) {
      blocking.push({
        kind: "invalid",
        title: item.title,
        pageNumber: item.pageNumber,
      });
    }
  }

  const byNumber = new Map<number, string[]>();
  for (const item of queue) {
    const list = byNumber.get(item.pageNumber) ?? [];
    list.push(item.title);
    byNumber.set(item.pageNumber, list);
  }
  for (const [pageNumber, titles] of byNumber) {
    if (titles.length > 1) {
      blocking.push({ kind: "duplicate", pageNumber, titles });
    }
  }

  const existingByNumber = new Map<number, string>();
  for (const row of existing) {
    existingByNumber.set(row.page_number, row.title ?? `Page ${row.page_number}`);
  }
  for (const item of queue) {
    const clash = existingByNumber.get(item.pageNumber);
    if (clash !== undefined) {
      blocking.push({
        kind: "collision",
        pageNumber: item.pageNumber,
        title: item.title,
        existingTitle: clash,
      });
    }
  }

  /*
   * Slug collisions are a *separate* failure from page-number collisions and
   * this is not a theoretical distinction — it is the error Battlefield
   * Atlantis actually threw.
   *
   * Slugs are derived from the page number, so in a healthy issue a slug clash
   * always implies a number clash and this loop finds nothing new. But a
   * renumber moves `page_number` without rewriting `slug`, and from then on the
   * row sitting at page 15 owns the slug for page 16. Queue a genuine page 16
   * and the numbers do not collide, the audit passes, and the insert dies on
   * the global `comics_slug_key` constraint after the image is already in
   * storage.
   *
   * Skipped where the page number already collided, so one file never reports
   * the same underlying conflict twice.
   */
  const existingBySlug = new Map<string, { title: string; pageNumber: number }>();
  for (const row of existing) {
    if (!row.slug) continue;
    existingBySlug.set(row.slug, {
      title: row.title ?? `Page ${row.page_number}`,
      pageNumber: row.page_number,
    });
  }
  for (const item of queue) {
    if (!item.slug) continue;
    if (existingByNumber.has(item.pageNumber)) continue;
    const owner = existingBySlug.get(item.slug);
    if (owner !== undefined) {
      blocking.push({
        kind: "slugTaken",
        slug: item.slug,
        title: item.title,
        existingTitle: owner.title,
        existingPageNumber: owner.pageNumber,
      });
    }
  }

  const resulting = [...new Set([...existingByNumber.keys(), ...queue.map((q) => q.pageNumber)])]
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);

  if (resulting.length > 1) {
    const missing: number[] = [];
    for (let n = resulting[0]; n < resulting[resulting.length - 1]; n++) {
      if (!resulting.includes(n)) missing.push(n);
    }
    if (missing.length > 0) warnings.push({ kind: "gap", missing });
  }

  return { blocking, warnings, resulting };
}

/** The next free page number for an issue, for defaulting the start page. */
export function nextPageNumber(existing: readonly ExistingPage[]): number {
  const numbers = existing.map((r) => r.page_number).filter((n) => Number.isInteger(n) && n > 0);
  return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
}

/** Renumber a queue sequentially from `start`, preserving queue order. */
export function sequentialFrom<T extends QueuedPage>(queue: readonly T[], start: number): T[] {
  return queue.map((item, i) => ({ ...item, pageNumber: start + i }));
}

/** One-line human summary of a problem, for toasts and inline warnings. */
export function describeProblem(problem: PageNumberProblem): string {
  switch (problem.kind) {
    case "duplicate":
      return `Page ${problem.pageNumber} is claimed by ${problem.titles.length} files: ${problem.titles.join(", ")}.`;
    case "collision":
      return `Page ${problem.pageNumber} already exists in this issue ("${problem.existingTitle}"); "${problem.title}" would duplicate it.`;
    case "slugTaken":
      return `The address "${problem.slug}" is already used by "${problem.existingTitle}" (page ${problem.existingPageNumber}), so "${problem.title}" cannot be saved under it. Renumbering will not help — that page needs its address corrected first.`;
    case "invalid":
      return `"${problem.title}" has an invalid page number (${problem.pageNumber}).`;
    case "gap":
      return `Numbering would leave ${problem.missing.length === 1 ? "a gap at page" : "gaps at pages"} ${problem.missing.join(", ")}.`;
  }
}
