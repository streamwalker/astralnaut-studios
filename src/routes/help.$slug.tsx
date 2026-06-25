import { createFileRoute, notFound } from "@tanstack/react-router";
import { HelpLayout } from "@/components/help/HelpLayout";
import { ArticleView } from "@/components/help/ArticleView";
import { readerHelp } from "@/content/help/reader";
import { OG_DEFAULT_IMAGE, OG_DEFAULT_ALT, OG_DEFAULT_WIDTH, OG_DEFAULT_HEIGHT, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/help/$slug")({
  loader: ({ params }) => {
    const article = readerHelp.articles.find((a) => a.slug === params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ params, loaderData }) => {
    const a = loaderData?.article;
    const title = a ? `${a.title} — Help Center` : "Help Center";
    const desc = a?.summary ?? "Astralnaut Studios reader help.";
    const url = `${SITE_URL}/help/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: OG_DEFAULT_IMAGE },
        { property: "og:image:width", content: OG_DEFAULT_WIDTH },
        { property: "og:image:height", content: OG_DEFAULT_HEIGHT },
        { property: "og:image:alt", content: OG_DEFAULT_ALT },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: OG_DEFAULT_IMAGE },
        { name: "twitter:image:alt", content: OG_DEFAULT_ALT },
      ],
      links: [{ rel: "canonical", href: url }],
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
