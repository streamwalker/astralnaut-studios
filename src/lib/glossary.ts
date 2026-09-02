/**
 * One definition per term, in one place, shared by every surface that shows it.
 *
 * The point of centralising this is not tidiness — it is that the admin panel,
 * the reader, and the pricing page all use the same words for the same things,
 * and when a rule changes (what "free pages" governs, when a drop lands) there
 * is exactly one line to edit rather than six scattered `title=` attributes
 * that quietly disagree with each other.
 *
 * Everything asserted below was read out of the code it describes. If a rule
 * changes, change it here in the same commit.
 */

export type GlossaryEntry = {
  /** The term as a person reading the UI would say it out loud. */
  term: string;
  /** What it is, in one sentence. Always shown. Keep it under ~140 characters. */
  short: string;
  /** Why it exists and what it buys you. Shown under the summary. */
  detail?: string;
  /** A concrete instance, rendered monospaced. */
  example?: string;
  /** The trap a first-time user falls into. Rendered as a warning line. */
  gotcha?: string;
};

export const GLOSSARY = {
  // ---------------------------------------------------------------------
  // Identity and addressing
  // ---------------------------------------------------------------------
  slug: {
    term: "Slug",
    short:
      "The lowercase, hyphenated form of a title, used in the public URL, the storage path, and as the row's unique key.",
    detail:
      "Titles contain spaces, punctuation, and apostrophes, they get edited, and two of them can be identical. None of that survives a URL or a filename. A slug is stable, safe in both, and unique in the database — so it is also what stops the same page being created twice. It is generated from the title automatically; you only need to touch it if the automatic one collides or reads badly.",
    example: "Battlefield Atlantis → battlefield-atlantis",
    gotcha:
      "Changing a slug after publishing breaks every link anyone has already shared, and orphans the artwork already sitting under the old storage path.",
  },
  seriesSlug: {
    term: "Series slug",
    short:
      "The series' slug. It is the first segment of the reader URL and the top-level folder artwork is stored under.",
    detail:
      "Reader URLs are built as /reader/{series-slug}/{issue-number}, and uploaded pages land at {series-slug}/issue-{n}/page-000.png. One value drives both, so the storage bucket stays browsable by a human rather than becoming a pile of UUIDs.",
    example: "/reader/battlefield-atlantis/1",
  },
  issueNumber: {
    term: "Issue number",
    short: "Which issue of the series this is. Part of the public reader URL.",
    detail:
      "Kept as a plain number rather than folded into the title so issues sort correctly and the URL stays short and guessable.",
    example: "Issue 1 → /reader/battlefield-atlantis/1",
  },
  title: {
    term: "Title",
    short: "The human-facing name. Shown in the admin lists and used to generate the slug.",
    detail:
      "Safe to edit at any time — unlike the slug, nothing is addressed by it. For an individual page this is mostly an internal label, so a name that tells you which file it came from is more useful than a poetic one.",
  },

  // ---------------------------------------------------------------------
  // Ordering
  // ---------------------------------------------------------------------
  pageNumber: {
    term: "Page number",
    short:
      "The reading position of this page inside its issue. Every reader-facing view is ordered by this number, never by upload time.",
    detail:
      "It is derived from the filename when you add files, and the badge next to each row tells you how confident that guess was. Getting it right is the whole of reading order: a page is where its number says it is, regardless of when it was uploaded or what it is called.",
    gotcha:
      "Two pages sharing a number in one issue is the failure that hurts — the database does not forbid it, so one page renders twice and another disappears. The uploader now blocks it before anything is written.",
  },
  startingPage: {
    term: "Starting page #",
    short:
      "The number the first queued file gets when a filename carries no page number of its own, and the base for “Renumber from”.",
    detail:
      "Defaults to the selected issue's next free number rather than to 1, so a second batch continues the issue instead of landing on top of it. Set it yourself before adding files if you are inserting somewhere other than the end.",
  },
  pageGuessed: {
    term: "Page # guessed",
    short:
      "The filename held more than one number and none of them was marked as a page, so the last one was used.",
    detail:
      "Worth a look before uploading. A name like “BA 1 17.png” could reasonably mean issue 1 page 17 or page 1 of 17. An explicit marker removes the ambiguity entirely.",
    example: "Page 17 — unambiguous. 1-17 — a guess.",
  },
  pageMissing: {
    term: "No page # in filename",
    short:
      "Nothing in the filename looked like a page number, so this row fell back to its position in the queue.",
    detail:
      "Correct often enough to be useful and wrong often enough to check. Set the number by hand, or rename the file to include “page N” and add it again.",
  },
  numberingGap: {
    term: "Gap in numbering",
    short: "The issue would end up with a page number missing from the middle of its run.",
    detail:
      "A warning rather than a block, because it is sometimes exactly right — you might be uploading page 22 today and page 21 tomorrow. Worth reading twice if you did not mean it.",
  },

  // ---------------------------------------------------------------------
  // Access
  // ---------------------------------------------------------------------
  freePages: {
    term: "Free pages",
    short:
      "How many pages from the front of the issue anyone can read without an account. Pages above this number require a subscription.",
    detail:
      "This is the sample that sells the subscription, so it is a marketing decision more than a technical one: enough story to create the question, not enough to answer it.",
    gotcha:
      "This number is applied at upload time — it decides whether each page in this batch is marked free. Changing it later does not retroactively free or lock pages that are already uploaded.",
  },
  published: {
    term: "Published",
    short:
      "The moment a page becomes eligible to be shown. A page with no publish date is not live.",
    detail:
      "Separate from access tier on purpose. Publishing asks “does this page exist yet?”; the tier asks “who is allowed to see it?”. A page can be published and still invisible to everyone below Patron.",
  },
  tierReader: {
    term: "Reader",
    short: "The entry paid tier. Gets every page, on the slowest release schedule.",
    detail:
      "Tiers are cumulative: anything a Reader can see, an Initiate and a Patron can see too. What separates them is how long they wait, not how much they eventually get.",
  },
  tierInitiate: {
    term: "Initiate",
    short: "The middle paid tier. Same pages as Reader, one day earlier.",
    detail:
      "Tiers are cumulative — Initiate sees everything Reader sees, sooner, plus whatever Initiate-specific extras the tier advertises.",
  },
  tierPatron: {
    term: "Patron",
    short: "The top paid tier. Gets each new drop first, before every other tier.",
    detail:
      "Being first is the product. A Patron reads a page on Tuesday that an Initiate reads Wednesday and a Reader reads Thursday.",
  },
  drop: {
    term: "Drop",
    short:
      "A scheduled release of a batch of pages, staggered so each tier gets them on a different day.",
    detail:
      "The advertised cadence is Patron first, Initiate the next day, Reader the day after. A drop turns “these pages are paid” into “these pages open to you on this date”, which is what makes the higher tiers worth paying for.",
    gotcha:
      "An issue with no drop rows is not staggered at all — every paid page is visible to every paying tier the moment it publishes.",
  },
  entitlement: {
    term: "Entitlement",
    short: "The record of what an account has actually paid for, written by Stripe's webhook.",
    detail:
      "Deliberately separate from the account itself: signing in proves who someone is, an entitlement proves what they bought. Keeping them apart means a billing change updates one row rather than touching identity.",
  },
  unreleased: {
    term: "Unreleased",
    short: "The page is published and paid, but its drop date has not arrived for any tier yet.",
    detail: "Nobody can read it today, including Patrons. It becomes readable on the drop date.",
  },
  allSubs: {
    term: "All subs",
    short: "Every paying tier can read this page right now, with no stagger between them.",
    detail:
      "Usually means the issue has no drop schedule. Correct for back catalogue; a missed opportunity on a new issue, where staggering is what makes the top tier worth buying.",
  },
  noFile: {
    term: "No file",
    short: "The row exists in the database but points at no artwork.",
    detail:
      "Nothing renders for the reader. Either the upload failed partway or the row was created ahead of the art.",
  },

  // ---------------------------------------------------------------------
  // Accessibility and content
  // ---------------------------------------------------------------------
  altText: {
    term: "Alt text",
    short:
      "A one-line description of what the artwork shows, read aloud by screen readers and displayed if the image fails to load.",
    detail:
      "Three benefits from one field: blind readers get the page, everyone on a bad connection gets something instead of a blank box, and search engines get text to index on a page that is otherwise entirely image. Describe what is happening, not that it is a comic page.",
    example: "Zeus braces against the hull as the Ryuken breaches — not “comic page 14”.",
  },
  transcript: {
    term: "Transcript",
    short: "The page's dialogue and captions as plain text.",
    detail:
      "Makes the page searchable and readable by assistive technology, and gives search engines real prose to index. Optional, but it is the difference between an issue that can be found by a line someone half-remembers and one that cannot.",
  },
  imagePath: {
    term: "Image path",
    short: "Where the artwork actually lives in storage, relative to the bucket.",
    detail:
      "Generated from the series slug, issue number, and page number so the bucket stays legible to a human. Set at upload; not something to edit by hand.",
    example: "battlefield-atlantis/issue-1/page-014.png",
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;

/**
 * Read one entry as a `GlossaryEntry`.
 *
 * `satisfies` is what keeps `GlossaryKey` a union of the real key names rather
 * than a bare `string` — but it also means `GLOSSARY[k]` for a variable `k` is
 * a union of narrow literal shapes, and the optional fields only exist on the
 * members that happen to define them. Widening here once is the whole reason
 * this function exists; callers get a stable shape with optional fields.
 */
export function glossaryEntry(key: GlossaryKey): GlossaryEntry {
  return GLOSSARY[key];
}

/** Every term, alphabetised — for a glossary page or a help panel. */
export function allTerms(): (GlossaryEntry & { key: GlossaryKey })[] {
  return (Object.keys(GLOSSARY) as GlossaryKey[])
    .map((key) => ({ key, ...GLOSSARY[key] }))
    .sort((a, b) => a.term.localeCompare(b.term));
}
