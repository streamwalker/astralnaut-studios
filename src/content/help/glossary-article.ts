import { allTerms, type GlossaryKey } from "@/lib/glossary";
import type { HelpArticle } from "./types";

/**
 * The help-centre glossary article is *generated* from `src/lib/glossary.ts`
 * rather than written out again here.
 *
 * The reason is drift. The same words appear in three places — the ⓘ next to an
 * admin field, the hover on a release-matrix badge, and the help centre — and
 * hand-maintained copies of a definition always end up disagreeing after the
 * second or third rule change. Generating this one means the tooltip and the
 * article are the same sentence by construction, and a term added to the
 * glossary shows up in the admin article without anyone remembering to add it.
 *
 * The reader article is deliberately *not* everything. A subscriber has no use
 * for "image path" or "starting page #", and a glossary that opens with storage
 * layout teaches a reader that this page is not for them. So the admin track
 * gets the full list and the reader track gets an explicit, curated subset.
 */

/** Terms a paying reader has a legitimate reason to look up. */
const READER_TERMS: GlossaryKey[] = [
  "freePages",
  "drop",
  "tierPatron",
  "tierInitiate",
  "tierReader",
  "entitlement",
  "unreleased",
  "pageNumber",
  "transcript",
  "altText",
];

/**
 * Render one entry as MarkdownLite.
 *
 * Blocks are separated by blank lines because the renderer's paragraph
 * collector greedily joins consecutive non-blank lines into one `<p>` — without
 * the blank line, the summary, the detail, and the warning would run together
 * as a single paragraph.
 */
function entryToMarkdown(entry: {
  term: string;
  short: string;
  detail?: string;
  example?: string;
  gotcha?: string;
}): string {
  const blocks = [`### ${entry.term}`, entry.short];
  if (entry.detail) blocks.push(entry.detail);
  if (entry.example) blocks.push(`Example: \`${entry.example}\``);
  if (entry.gotcha) blocks.push(`**Watch out:** ${entry.gotcha}`);
  return blocks.join("\n\n");
}

function buildBody(intro: string, keys: GlossaryKey[] | null): string {
  const terms = allTerms().filter((t) => keys === null || keys.includes(t.key));
  return [intro, "---", ...terms.map(entryToMarkdown)].join("\n\n");
}

/** Every term in the product, alphabetised. For the admin track. */
export function adminGlossaryArticle(): HelpArticle {
  return {
    slug: "terms-and-definitions",
    title: "Terms & definitions",
    category: "Admin Basics",
    summary: "Every term the admin panel uses, what it does, and the trap that comes with it.",
    body: buildBody(
      "These are the same definitions that appear in the ⓘ tooltips next to each field and on the release-matrix legend — this page is generated from them, so the two cannot disagree. Terms are alphabetised.",
      null,
    ),
  };
}

/** The subset a subscriber would look up. For the reader track. */
export function readerGlossaryArticle(): HelpArticle {
  return {
    slug: "terms-and-definitions",
    title: "Terms & definitions",
    category: "Getting Started",
    summary: "Free pages, drops, tiers — what the words on the pricing and reader pages mean.",
    body: buildBody(
      "The words used around subscriptions and page releases, defined once. If something on the pricing page or in the reader is unclear, it should be here.",
      READER_TERMS,
    ),
  };
}
