import { createFileRoute, notFound } from "@tanstack/react-router";
import { HelpLayout } from "@/components/help/HelpLayout";
import { ArticleView } from "@/components/help/ArticleView";
import { adminHelp } from "@/content/help/admin";

export const Route = createFileRoute("/_authenticated/admin/help/$slug")({
  loader: ({ params }) => {
    const article = adminHelp.articles.find((a) => a.slug === params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    const title = a ? `${a.title} — Admin Help` : "Admin Help";
    return {
      meta: [
        { title },
        { name: "description", content: a?.summary ?? "Admin help article." },
        { property: "og:title", content: title },
        { property: "og:description", content: a?.summary ?? "" },
      ],
    };
  },
  component: AdminHelpArticleRoute,
  notFoundComponent: () => (
    <HelpLayout track={adminHelp} coursePath="/admin/learn">
      <div className="rounded-xl border border-[var(--border-line)] bg-black/20 p-8">
        <h1 className="text-2xl font-extrabold text-[var(--ink)]">Article not found</h1>
      </div>
    </HelpLayout>
  ),
  errorComponent: ({ error, reset }) => (
    <HelpLayout track={adminHelp} coursePath="/admin/learn">
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

function AdminHelpArticleRoute() {
  const { article } = Route.useLoaderData();
  return (
    <HelpLayout track={adminHelp} activeSlug={article.slug} coursePath="/admin/learn">
      <ArticleView track={adminHelp} article={article} />
    </HelpLayout>
  );
}
