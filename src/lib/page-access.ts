// Single source of truth for "who can read page N of this issue, today".
//
// Before this module existed the answer was a boolean: `has_active_subscription`
// said yes or no, and every paid page in an issue unlocked at the same instant
// for every paying account. The staggered cadence the site advertises — Patron
// Tuesday, Initiate Wednesday, Reader Thursday — lived only in `issue_drops` and
// only ever reached the screen as a *label*. Nothing enforced it.
//
// Two rules hold this together. Break either one and subscribers get told a page
// is unlocked on a page that will not render it:
//
//  1. The tier dates come from `initiateDateFor` in drop-schedule.ts. Do not
//     re-derive the "day after Patron" fallback here or anywhere else.
//  2. A paid page with NO drop row covering it stays readable by ANY active
//     subscriber. This is not a nicety — Battlefield Atlantis has zero rows in
//     `issue_drops` today, so a strict reading of the schedule would instantly
//     re-lock pages 11-14 that were deliberately opened to subscribers. An
//     unscheduled page is an unstaggered page, not a forbidden one.
//
// Everything here is pure: same inputs, same answer, no clock reads except the
// default `today`. That is what lets the server gate and the admin grid agree.

import { initiateDateFor, type DropRow } from "./drop-schedule";
import { tierRank, type Tier } from "./tier";

/** Why a page is in the state it is in. Drives the admin marker vocabulary. */
export type ReleaseKind =
  | "free" // `comics.is_free` — no subscription of any kind required
  | "unpublished" // `published_at` is null or still in the future
  | "no_file" // row exists, `image_path` is empty — nothing to serve
  | "scheduled" // a drop row covers this page; the stagger applies
  | "unscheduled"; // paid + published, no drop row — open to all subscribers

export type TierDates = {
  patron: string;
  initiate: string;
  reader: string;
};

export type PageRelease = {
  pageNumber: number;
  kind: ReleaseKind;
  /**
   * Lowest tier that may read this page as of `today`, or `null` when the page
   * is readable by nobody yet (unpublished, no file, or every tier date still
   * in the future). `"none"` means free to signed-out visitors.
   */
  minTier: Tier | null;
  /** The tier the page will eventually be readable by everyone at, once dated. */
  finalTier: Tier;
  /** The three dates from the covering drop row, or null when unscheduled. */
  dates: TierDates | null;
  /** `issue_drops.week`, when a row covers this page. */
  week: number | null;
};

/** Today as YYYY-MM-DD in UTC — the same basis `issue_drops.*_date` is stored in. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** A `date` column is "reached" from the start of that day, inclusive. */
function reached(date: string, today: string): boolean {
  return !!date && date <= today;
}

export type PageInput = {
  page_number: number;
  is_free: boolean | null;
  published_at: string | null;
  image_path: string | null;
};

/** Find the drop row whose `pages[]` contains this page number. */
function dropFor(pageNumber: number, drops: readonly DropRow[]): DropRow | null {
  for (const row of drops) {
    if ((row.pages ?? []).includes(pageNumber)) return row;
  }
  return null;
}

/**
 * Resolve one page against the schedule.
 *
 * Order matters: publication is checked before the stagger, because a drop row
 * cannot release a page whose file has not been published. `issue_drops` is a
 * plan; `comics.published_at` is the fact.
 */
export function releaseForPage(
  page: PageInput,
  drops: readonly DropRow[],
  today: string = todayISO(),
): PageRelease {
  const pageNumber = page.page_number;
  const published =
    !!page.published_at && new Date(page.published_at).toISOString().slice(0, 10) <= today;

  if (!published) {
    return {
      pageNumber,
      kind: "unpublished",
      minTier: null,
      finalTier: page.is_free ? "none" : "reader",
      dates: null,
      week: null,
    };
  }

  if (page.is_free) {
    return {
      pageNumber,
      kind: "free",
      minTier: "none",
      finalTier: "none",
      dates: null,
      week: null,
    };
  }

  if (!page.image_path) {
    // A paid row with no file: the schedule may say it is out, but there is
    // nothing to hand a reader. Surfaced rather than silently treated as locked.
    return {
      pageNumber,
      kind: "no_file",
      minTier: null,
      finalTier: "reader",
      dates: null,
      week: null,
    };
  }

  const row = dropFor(pageNumber, drops);
  if (!row) {
    // Rule 2. See the header comment before changing this.
    return {
      pageNumber,
      kind: "unscheduled",
      minTier: "reader",
      finalTier: "reader",
      dates: null,
      week: null,
    };
  }

  const dates: TierDates = {
    patron: row.patron_date,
    initiate: initiateDateFor(row),
    reader: row.reader_date,
  };

  const minTier: Tier | null = reached(dates.reader, today)
    ? "reader"
    : reached(dates.initiate, today)
      ? "initiate"
      : reached(dates.patron, today)
        ? "patron"
        : null;

  return { pageNumber, kind: "scheduled", minTier, finalTier: "reader", dates, week: row.week };
}

/** True when a viewer holding `tier` may read the page described by `release`. */
export function tierCanRead(release: PageRelease, tier: Tier): boolean {
  if (release.minTier === null) return false;
  if (release.minTier === "none") return true;
  return tierRank(tier) >= tierRank(release.minTier);
}

/** Resolve every page of an issue in one pass, ordered by page number. */
export function releaseMap(
  pages: readonly PageInput[],
  drops: readonly DropRow[],
  today: string = todayISO(),
): PageRelease[] {
  return [...pages]
    .sort((a, b) => a.page_number - b.page_number)
    .map((p) => releaseForPage(p, drops, today));
}

/**
 * The paid page numbers a given tier may read today. Free pages are excluded —
 * callers already have those, and mixing them in would hide a bug where a paid
 * page is wrongly marked free.
 */
export function readablePaidPages(
  pages: readonly PageInput[],
  drops: readonly DropRow[],
  tier: Tier,
  today: string = todayISO(),
): number[] {
  return releaseMap(pages, drops, today)
    .filter((r) => r.kind !== "free" && tierCanRead(r, tier))
    .map((r) => r.pageNumber);
}

/** Admin marker text. Kept next to the logic so the two cannot drift apart. */
export function releaseBadge(release: PageRelease): string {
  switch (release.kind) {
    case "free":
      return "FREE";
    case "unpublished":
      return "UNPUBLISHED";
    case "no_file":
      return "NO FILE";
    case "unscheduled":
      return "ALL SUBS";
    case "scheduled":
      return release.minTier === "reader"
        ? "READER+"
        : release.minTier === "initiate"
          ? "INITIATE+"
          : release.minTier === "patron"
            ? "PATRON"
            : "UNRELEASED";
  }
}
