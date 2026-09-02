import { useQuery } from "@tanstack/react-query";
import { getIssuePageMatrix } from "@/lib/comic-pages.functions";
import { pageUrl } from "@/lib/storage";
import { formatDropDate } from "@/lib/drop-schedule";
import { releaseBadge, type PageRelease } from "@/lib/page-access";
import { TermTooltip } from "@/components/info-hint";
import type { GlossaryKey } from "@/lib/glossary";

/**
 * Admin-only view of every page uploaded to an issue and who can read it today.
 *
 * The public grid below this one walks 1..total_pages and paints anything past
 * the free count as an identical locked tile. That is right for a visitor and
 * useless for an operator: it cannot distinguish a page that is out to Patrons
 * only, a page whose file never got attached, and a page number that has no row
 * at all. This grid walks the actual `comics` rows instead, so gaps in the page
 * numbering show up as gaps rather than being papered over.
 *
 * Server-gated: `getIssuePageMatrix` returns `{ admin: false, pages: [] }` to
 * anyone without the role, so a forged client-side admin flag renders nothing.
 */

const KIND_STYLE: Record<PageRelease["kind"] | "patron" | "initiate" | "reader", string> = {
  free: "bg-emerald-400 text-emerald-950",
  scheduled: "bg-white/10 text-white/70",
  unscheduled: "bg-sky-400 text-sky-950",
  unpublished: "bg-white/10 text-white/50",
  no_file: "bg-red-500 text-red-50",
  patron: "bg-[var(--plasma)] text-black",
  initiate: "bg-[var(--neon)] text-black",
  reader: "bg-white text-black",
};

function badgeClass(release: PageRelease | null): string {
  if (!release) return KIND_STYLE.unpublished;
  if (release.kind === "scheduled" && release.minTier && release.minTier !== "none") {
    return KIND_STYLE[release.minTier];
  }
  return KIND_STYLE[release.kind];
}

/**
 * Every badge in the legend is its own tooltip trigger. The legend is the one
 * place an admin looks to work out what a colour means, so it is where the
 * definition belongs — rather than in a wiki nobody opens.
 */
function Legend() {
  const items: Array<[string, string, GlossaryKey]> = [
    ["FREE", KIND_STYLE.free, "freePages"],
    ["PATRON", KIND_STYLE.patron, "tierPatron"],
    ["INITIATE+", KIND_STYLE.initiate, "tierInitiate"],
    ["READER+", KIND_STYLE.reader, "tierReader"],
    ["ALL SUBS", KIND_STYLE.unscheduled, "allSubs"],
    ["UNRELEASED", KIND_STYLE.scheduled, "unreleased"],
    ["UNPUBLISHED", KIND_STYLE.unpublished, "published"],
    ["NO FILE", KIND_STYLE.no_file, "noFile"],
  ];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {items.map(([label, cls, term]) => (
        <TermTooltip key={label} term={term} side="bottom" className="rounded">
          <span
            className={`block rounded px-2 py-0.5 text-[10px] font-black tracking-wider ${cls}`}
          >
            {label}
          </span>
        </TermTooltip>
      ))}
      <TermTooltip term="drop" side="bottom" className="rounded">
        <span className="block rounded border border-white/20 px-2 py-0.5 text-[10px] font-black tracking-wider text-white/60">
          WHAT IS A DROP?
        </span>
      </TermTooltip>
    </div>
  );
}

export function IssuePageMatrix({ issueId }: { issueId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-issue-page-matrix", issueId],
    queryFn: () => getIssuePageMatrix({ data: { issueId } }),
    staleTime: 30_000,
  });

  if (isLoading || error || !data?.admin) return null;

  const pages = data.pages;
  const numbers = pages.map((p) => p.page_number);
  // A gap here is a real defect (a page that was never uploaded), so it is
  // named rather than smoothed over by iterating 1..total_pages.
  const gaps: number[] = [];
  if (numbers.length > 0) {
    for (let n = Math.min(...numbers); n <= Math.max(...numbers); n++) {
      if (!numbers.includes(n)) gaps.push(n);
    }
  }

  return (
    <section className="mt-20 rounded-lg border border-[var(--neon)]/30 bg-[var(--bg2)]/40 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="eyebrow text-[var(--neon)]">Admin · release matrix</div>
          <h2 className="mt-1 text-2xl font-black">
            {pages.length} uploaded {pages.length === 1 ? "page" : "pages"}
          </h2>
        </div>
        <div className="text-xs text-[var(--ink2)]">
          {data.drops.length > 0
            ? `${data.drops.length} scheduled ${data.drops.length === 1 ? "drop" : "drops"}`
            : "No issue_drops rows — every paid page is open to all subscribers"}
        </div>
      </div>

      <p className="mt-2 max-w-2xl text-sm text-[var(--ink2)]">
        Who can read each page <em>today</em>. Tiers are cumulative: a page marked INITIATE+ is also
        readable by Patrons.
      </p>

      {gaps.length > 0 && (
        <p className="mt-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Missing page {gaps.length === 1 ? "number" : "numbers"} {gaps.join(", ")} — no{" "}
          <code>comics</code> row exists, so nothing will render at{" "}
          {gaps.length === 1 ? "that position" : "those positions"}.
        </p>
      )}

      <Legend />

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {pages.map((p) => {
          const thumb = pageUrl(p.image_path);
          const release = p.release;
          return (
            <div
              key={p.id}
              className="relative flex aspect-[3/4] flex-col overflow-hidden rounded-md border border-white/10 bg-[#0a0e1f]"
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={p.alt_text ?? `Page ${p.page_number}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-70"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--mute)]">
                  no file
                </div>
              )}

              <div className="relative z-10 flex items-start justify-between gap-1 p-2">
                <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] font-black tracking-wider text-white/80">
                  {p.page_number}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-black tracking-wider ${badgeClass(release)}`}
                >
                  {release ? releaseBadge(release) : "UNKNOWN"}
                </span>
              </div>

              <div className="mt-auto relative z-10 bg-black/75 px-2 py-1.5 font-mono text-[9px] leading-tight text-white/70">
                {release?.dates ? (
                  <>
                    <div>
                      P {formatDropDate(release.dates.patron)} · I{" "}
                      {formatDropDate(release.dates.initiate)} · R{" "}
                      {formatDropDate(release.dates.reader)}
                    </div>
                    {release.week !== null && (
                      <div className="text-white/40">week {release.week}</div>
                    )}
                  </>
                ) : (
                  <div className="text-white/40">
                    {release?.kind === "free"
                      ? "free to everyone"
                      : release?.kind === "unpublished"
                        ? "not published"
                        : "no drop row"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
