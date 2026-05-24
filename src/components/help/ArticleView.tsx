import { Link } from "@tanstack/react-router";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { MarkdownLite } from "./MarkdownLite";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { HelpArticle, HelpTrack } from "@/content/help/types";

export function ArticleView({ track, article }: { track: HelpTrack; article: HelpArticle }) {
  const [feedback, setFeedback] = useLocalStorage<"up" | "down" | null>(
    `helpfeedback:${track.id}:${article.slug}`,
    null,
  );

  const related = (article.related ?? [])
    .map((s) => track.articles.find((a) => a.slug === s))
    .filter(Boolean) as HelpArticle[];

  return (
    <article className="rounded-xl border border-[var(--border-line)] bg-black/20 p-8">
      <div className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--gold)]">
        {article.category}
      </div>
      <h1 className="mt-2 text-3xl font-extrabold text-[var(--ink)]">{article.title}</h1>
      <p className="mt-2 text-[var(--ink2)]">{article.summary}</p>

      <div className="mt-6 border-t border-[var(--border-line)] pt-6">
        <MarkdownLite source={article.body} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--border-line)] pt-6">
        <span className="text-xs uppercase tracking-wide text-[var(--ink2)]">
          Was this helpful?
        </span>
        <button
          onClick={() => setFeedback("up")}
          className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs ${
            feedback === "up"
              ? "border-[var(--neon)] text-[var(--neon)]"
              : "border-[var(--border-line)] text-[var(--ink2)] hover:border-[var(--neon)]"
          }`}
        >
          <ThumbsUp width={12} height={12} /> Yes
        </button>
        <button
          onClick={() => setFeedback("down")}
          className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs ${
            feedback === "down"
              ? "border-[var(--gold)] text-[var(--gold)]"
              : "border-[var(--border-line)] text-[var(--ink2)] hover:border-[var(--gold)]"
          }`}
        >
          <ThumbsDown width={12} height={12} /> No
        </button>
        {feedback && (
          <span className="text-xs text-[var(--ink2)]">Thanks — saved locally.</span>
        )}
      </div>

      {related.length > 0 && (
        <div className="mt-8 border-t border-[var(--border-line)] pt-6">
          <div className="mb-3 text-xs font-bold uppercase tracking-[2px] text-[var(--ink2)]">
            Related articles
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  to={`${track.basePath}/$slug` as "/help/$slug"}
                  params={{ slug: r.slug }}
                  className="block rounded-lg border border-[var(--border-line)] p-3 text-sm hover:border-[var(--neon)]"
                >
                  <div className="font-semibold text-[var(--ink)]">{r.title}</div>
                  <div className="mt-1 text-xs text-[var(--ink2)]">{r.summary}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export function ArticleHubLanding({ track }: { track: HelpTrack }) {
  const groups = new Map<string, HelpArticle[]>();
  track.articles.forEach((a) => {
    if (!groups.has(a.category)) groups.set(a.category, []);
    groups.get(a.category)!.push(a);
  });

  return (
    <div className="rounded-xl border border-[var(--border-line)] bg-black/20 p-8">
      <h1 className="text-3xl font-extrabold text-[var(--ink)]">{track.label}</h1>
      <p className="mt-2 text-[var(--ink2)]">
        Browse by category, search, or take the full training course.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {Array.from(groups.entries()).map(([cat, items]) => (
          <div key={cat} className="rounded-lg border border-[var(--border-line)] p-5">
            <div className="text-xs font-bold uppercase tracking-[2px] text-[var(--gold)]">
              {cat}
            </div>
            <ul className="mt-3 space-y-2">
              {items.map((a) => (
                <li key={a.slug}>
                  <Link
                    to={`${track.basePath}/$slug` as "/help/$slug"}
                    params={{ slug: a.slug }}
                    className="text-sm font-semibold text-[var(--ink)] hover:text-[var(--neon)]"
                  >
                    {a.title}
                  </Link>
                  <div className="text-xs text-[var(--ink2)]">{a.summary}</div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
