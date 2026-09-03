/**
 * The single source of truth for a comic page's *identity*: its storage path,
 * its slug, and whether it is free.
 *
 * Before this module those three values were minted inline in three different
 * places — `BatchUploadForm.handleUploadAll`, the deleted `SinglePageForm`, and
 * `PageRow.onReplace`/`duplicatePage` — each with slightly different rules. The
 * consequences were all visible in Battlefield Atlantis Issue 1 in production:
 *
 *   - Rows whose `slug` said page 16 while `page_number` said 15, because a
 *     renumber moved the number and left the slug behind.
 *   - Storage paths that chained version segments without bound:
 *     `page-003.v1784783810234.v1788116824680.v1788116927267.png`
 *   - `is_free` computed from a form field defaulting to 9 while the issue row
 *     said `free_pages = 10`.
 *
 * Every write path must now derive these values here. Nothing in this file
 * touches the network or the DOM, so it is testable in isolation.
 */

/** Everything needed to describe where a page lives and who may read it. */
export type PageIdentityInput = {
  /** `series.slug`, e.g. "battlefield-atlantis". */
  seriesSlug: string;
  /** `issues.issue_number`, e.g. 1. */
  issueNumber: number;
  /** `issues.slug`, e.g. "battlefield-atlantis-issue-1". */
  issueSlug: string;
  /** 1-based page number. */
  pageNumber: number;
  /**
   * `issues.free_pages`. Numeric in the schema (Battlefield Atlantis has used
   * 9.5 to mark a half-page title plate), so it is floored before comparison.
   */
  freePages: number;
  /** File extension without the dot. Defaults to "png". */
  extension?: string;
};

export type PageIdentity = {
  /** Globally-unique `comics.slug`. */
  slug: string;
  /** Object key inside the `comic-pages` bucket. */
  storagePath: string;
  /** Value for `comics.is_free`. */
  isFree: boolean;
  /** The zero-padded page number used in both, exposed for messages. */
  padded: string;
};

/**
 * Extensions we are willing to write. Anything else is coerced to png rather
 * than trusted, because the extension ends up inside a storage key and a
 * user-supplied filename is not a safe source for that.
 */
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "avif", "gif"]);

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/**
 * Pick a safe extension from a filename, falling back to the MIME type and
 * then to png. Never returns anything outside `ALLOWED_EXTENSIONS`, so the
 * result is always safe to interpolate into a storage key.
 */
export function normalizeExtension(fileName: string, mimeType?: string | null): string {
  const fromName = fileName.split(".").pop()?.toLowerCase().trim() ?? "";
  if (ALLOWED_EXTENSIONS.has(fromName)) return fromName === "jpeg" ? "jpg" : fromName;

  const fromMime = mimeType ? MIME_EXTENSIONS[mimeType.toLowerCase()] : undefined;
  if (fromMime) return fromMime;

  return "png";
}

/**
 * Zero-pad to three digits so lexical sort matches numeric sort for the range
 * a comic issue actually occupies. Pages past 999 are emitted unpadded rather
 * than truncated — correctness beats alignment.
 */
export function padPage(pageNumber: number): string {
  const n = Math.trunc(pageNumber);
  return n >= 0 && n < 1000 ? String(n).padStart(3, "0") : String(n);
}

/** Canonical `comics.slug` for a page. */
export function pageSlug(issueSlug: string, pageNumber: number): string {
  return `${issueSlug}-p${padPage(pageNumber)}`;
}

/** Canonical object key inside the `comic-pages` bucket. */
export function pageStoragePath(
  seriesSlug: string,
  issueNumber: number,
  pageNumber: number,
  extension = "png",
): string {
  return `${seriesSlug}/issue-${issueNumber}/page-${padPage(pageNumber)}.${extension}`;
}

/**
 * Free-preview test. `freePages` is floored because the column is numeric and
 * a half value means "the plate at N.5 is the last free thing", which still
 * makes page `floor(N.5)` the last free whole page.
 */
export function isPageFree(pageNumber: number, freePages: number): boolean {
  if (!Number.isFinite(freePages)) return false;
  return pageNumber <= Math.floor(freePages);
}

/** Derive slug, storage path and free-flag together. */
export function pageIdentity(input: PageIdentityInput): PageIdentity {
  const extension = input.extension ?? "png";
  return {
    slug: pageSlug(input.issueSlug, input.pageNumber),
    storagePath: pageStoragePath(input.seriesSlug, input.issueNumber, input.pageNumber, extension),
    isFree: isPageFree(input.pageNumber, input.freePages),
    padded: padPage(input.pageNumber),
  };
}

// ---------------------------------------------------------------------------
// Versioned paths (image replacement)
// ---------------------------------------------------------------------------

/**
 * Matches one or more trailing `.v<digits>` or `.copy-<digits>` segments that
 * sit immediately before the extension.
 *
 * The old replace path did `oldPath.replace(/\.[^./]+$/, "")` and appended a
 * new `.v<timestamp>`, which stripped only the *extension* — so every replace
 * added another segment on top of the last one. Production carries the proof:
 * `page-003.v1784783810234.v1788116824680.v1788116927267.png`.
 */
const VERSION_SEGMENTS = /(?:\.(?:v\d+|copy-[a-z0-9]+))+$/i;

/** Remove the extension and any accumulated version/copy segments. */
export function stripVersionSuffix(path: string): string {
  const withoutExt = path.replace(/\.[^./]+$/, "");
  return withoutExt.replace(VERSION_SEGMENTS, "");
}

/**
 * Build the object key for a replacement image.
 *
 * Always derived from the *canonical* base, never from the current path, so a
 * path can be replaced any number of times and still only ever carry a single
 * version segment.
 */
export function versionedStoragePath(
  currentPath: string,
  extension: string,
  now = Date.now(),
): string {
  return `${stripVersionSuffix(currentPath)}.v${now}.${extension}`;
}

/** Build the object key for a duplicated page. */
export function copyStoragePath(currentPath: string, extension: string, now = Date.now()): string {
  return `${stripVersionSuffix(currentPath)}.copy-${now.toString(36)}.${extension}`;
}

// ---------------------------------------------------------------------------
// Drift detection
// ---------------------------------------------------------------------------

/** A row as stored, for comparing against what it *should* be. */
export type StoredPageIdentity = {
  slug: string;
  page_number: number;
  image_path: string;
  is_free?: boolean | null;
};

export type IdentityDrift = {
  /** Slug encodes a different page number than `page_number`. */
  slugPage?: number;
  /** Storage path encodes a different page number than `page_number`. */
  pathPage?: number;
  /** `is_free` disagrees with the issue's `free_pages`. */
  freeShouldBe?: boolean;
};

const SLUG_PAGE = /-p(\d{1,4})$/i;
const PATH_PAGE = /\/page-(\d{1,4})(?:\.|$)/i;

/**
 * Report where a stored row's slug, path and free-flag disagree with its own
 * page number. Read-only: this reports drift, it never repairs it, because
 * renaming a slug or moving an object are separate decisions with separate
 * blast radii (slugs may be linked externally; objects are referenced by path).
 *
 * Battlefield Atlantis Issue 1 currently drifts from page 15 onward — the row
 * at page 15 carries slug `…-p016` and path `page-016.png`.
 */
export function detectIdentityDrift(
  row: StoredPageIdentity,
  freePages?: number,
): IdentityDrift | null {
  const drift: IdentityDrift = {};

  const slugMatch = SLUG_PAGE.exec(row.slug ?? "");
  if (slugMatch) {
    const n = parseInt(slugMatch[1], 10);
    if (Number.isFinite(n) && n !== row.page_number) drift.slugPage = n;
  }

  const pathMatch = PATH_PAGE.exec(row.image_path ?? "");
  if (pathMatch) {
    const n = parseInt(pathMatch[1], 10);
    if (Number.isFinite(n) && n !== row.page_number) drift.pathPage = n;
  }

  if (freePages !== undefined && row.is_free != null) {
    const shouldBe = isPageFree(row.page_number, freePages);
    if (shouldBe !== row.is_free) drift.freeShouldBe = shouldBe;
  }

  return Object.keys(drift).length > 0 ? drift : null;
}

/**
 * Rewrite the trailing `-pNNN` of a slug so it matches a new page number.
 *
 * Returns `null` when the slug carries no page segment — inventing one for a
 * hand-written slug would be a rename, not a repair, and renames are a
 * decision for a human. Used when an admin edits `page_number` directly, which
 * is the one remaining way to create slug drift.
 */
export function realignSlug(slug: string, pageNumber: number): string | null {
  if (!slug || !SLUG_PAGE.test(slug)) return null;
  const next = slug.replace(SLUG_PAGE, `-p${padPage(pageNumber)}`);
  return next === slug ? null : next;
}

/** One-line human summary of drift, for admin badges and tooltips. */
export function describeDrift(row: StoredPageIdentity, drift: IdentityDrift): string {
  const parts: string[] = [];
  if (drift.slugPage !== undefined) {
    parts.push(`slug says page ${drift.slugPage}`);
  }
  if (drift.pathPage !== undefined) {
    parts.push(`file says page ${drift.pathPage}`);
  }
  if (drift.freeShouldBe !== undefined) {
    parts.push(drift.freeShouldBe ? "should be free" : "should be paid");
  }
  return `Page ${row.page_number}: ${parts.join("; ")}.`;
}
