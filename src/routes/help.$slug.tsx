import { createFileRoute, notFound } from "@tanstack/react-router";
import { HelpLayout } from "@/components/help/HelpLayout";
import { ArticleView } from "@/components/help/ArticleView";
import { readerHelp } from "@/content/help/reader";

export const Route = createFileRoute("/help/$slug")({
  loader: ({ params }) => {
    const article = readerHelp.articles.find((a) => a.slug === params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    const title = a ? `${a.title} — Help Center` : "Help Center";
    const desc = a?.summary ?? "Astralnaut Studios reader help.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: HelpArticleRoute,
  notFoundComponent: () => (
    <HelpLayout track={readerHelp} coursePath="/learn">
      <div className="rounded-xl border border-[var(--border-line)] bg-black/20 p-8">
        <h1 className="text-2xl font-extrabold text-[var(--ink)]">Article not found</h1>
        <p className="mt-2 text-[var(--ink2)]">Pick another article from the sidebar.</p>
      </div>
    </HelpLayout>
  ),
  errorComponent: ({ error, reset }) => (
    <HelpLayout track={readerHelp} coursePath="/learn">
      <div className="rounded-xl border border-[var(--border-line)] bg-black/20 p-8">
        <h1 className="text-2xl font-extrabold text-[var(--ink)]">Something went wrong</h1>
        <p className="mt-2 text-[var(--ink2)]">{error.message}</p>
        <button onClick={reset} className="mt-4 rounded bg-[var(--neon)] px-3 py-1.5 text-black">
          Try again
        </button>
      </div>
    </HelpLayout>
  ),
});

function HelpArticleRoute() {
  const { article } = Route.useLoaderData();
  return (
    <HelpLayout track={readerHelp} activeSlug={article.slug} coursePath="/learn">
      <ArticleView track={readerHelp} article={article} />
    </HelpLayout>
  );
}
