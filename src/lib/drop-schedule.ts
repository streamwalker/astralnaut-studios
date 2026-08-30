// Derives every date-bearing string on a series page from the issue_drops rows
// the loader already fetches.
//
// This exists because both series pages had the same failure mode from opposite
// directions. Battlefield Atlantis hardcoded its schedule in a const map, so
// "PATRON TUE · JUL 08" was still on the live page in late August. Children of
// Aquarius read the real rows but took drops[0] as "next drop", so it showed
// the *first* week of a finished run as if it were upcoming — a past date
// rendered as a countdown.
//
// The rule enforced here: nothing dated in the past is ever presented as
// something that is going to happen. A page with no future drops says so.

export type DropRow = {
  week: number;
  pages: number[] | null;
  patron_date: string;
  initiate_date: string | null;
  reader_date: string;
};

export type NextDrop = {
  week: number;
  pages: number[];
  patron: string;
  initiate: string;
  reader: string;
};

export type DerivedSchedule = {
  /** page number → "PATRON TUE · OCT 07". Only future drops appear. */
  labels: Record<number, string>;
  /** The soonest drop not yet released, or null if the run is over. */
  next: NextDrop | null;
  /** e.g. "Week of Oct 28", or null when there is nothing left to complete. */
  completes: string | null;
};

/** Today as YYYY-MM-DD in UTC, matching how `date` columns are compared here. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * "2026-10-07" → "OCT 07". Returns the input unchanged if it will not parse,
 * so a malformed row degrades to visible-but-wrong rather than to "NAN NAN".
 */
export function formatDropDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${month} ${day}`;
}

/** "2026-10-07" → "October 7". For running prose, where "OCT 07" reads as a label. */
export function formatDropDateLong(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
}

/**
 * "2026-10-07" → "Tue". Derived rather than hardcoded: both pages used to print
 * a literal "Tue"/"Thu", which silently lies the first time a drop is moved.
 */
export function dropWeekday(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { weekday: "short", timeZone: "UTC" });
}

/**
 * The Initiate tier sits between Patron and Reader. issue_drops only stored the
 * outer two until initiate_date was added, so rows written before that fall
 * back to the cadence the site has always advertised: the day after Patron.
 */
function initiateFor(row: DropRow): string {
  if (row.initiate_date) return row.initiate_date;
  const d = new Date(row.patron_date);
  if (Number.isNaN(d.getTime())) return row.patron_date;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function deriveSchedule(rows: readonly DropRow[], today: string = todayISO()): DerivedSchedule {
  const sorted = [...rows].sort((a, b) => a.patron_date.localeCompare(b.patron_date));
  // A drop is "upcoming" through the end of its own patron day, so a page does
  // not stop announcing this morning's drop at 00:00 UTC.
  const upcoming = sorted.filter((r) => r.patron_date >= today);

  const labels: Record<number, string> = {};
  for (const r of upcoming) {
    const label = `PATRON ${dropWeekday(r.patron_date).toUpperCase()} · ${formatDropDate(r.patron_date)}`;
    for (const p of r.pages ?? []) labels[p] = label;
  }

  const head = upcoming[0];
  const next: NextDrop | null = head
    ? {
        week: head.week,
        pages: head.pages ?? [],
        patron: head.patron_date,
        initiate: initiateFor(head),
        reader: head.reader_date,
      }
    : null;

  // Completion is only news while it is still ahead. Once the last reader date
  // has passed, the issue is simply out, and saying "completes <past date>"
  // reads as a stalled schedule rather than a finished one.
  const lastReader = sorted.reduce<string | null>(
    (max, r) => (max === null || r.reader_date > max ? r.reader_date : max),
    null,
  );
  const completes =
    lastReader && lastReader >= today ? `Week of ${formatDropDate(lastReader)}` : null;

  return { labels, next, completes };
}
