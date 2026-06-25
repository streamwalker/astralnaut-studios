import { createFileRoute, notFound } from "@tanstack/react-router";
import { LessonView } from "@/components/learn/LessonView";
import { readerCourse } from "@/content/learn/reader";
import { OG_DEFAULT_IMAGE, OG_DEFAULT_ALT, OG_DEFAULT_WIDTH, OG_DEFAULT_HEIGHT, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/learn/$moduleId")({
  loader: ({ params }) => {
    const lesson = readerCourse.modules.find((m) => m.id === params.moduleId);
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: ({ params, loaderData }) => {
    const l = loaderData?.lesson;
    const title = l ? `${l.title} — Training` : "Training";
    const desc = l?.summary ?? "Reader training module.";
    const url = `${SITE_URL}/learn/${params.moduleId}`;
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
  component: LessonRoute,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-[var(--ink)]">Module not found</h1>
      <a href="/learn" className="mt-4 inline-block text-[var(--neon)] underline">
        Back to course
      </a>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-[var(--ink)]">Something went wrong</h1>
      <p className="mt-2 text-[var(--ink2)]">{error.message}</p>
      <button onClick={reset} className="mt-4 rounded bg-[var(--neon)] px-3 py-1.5 text-black">
        Try again
      </button>
    </div>
  ),
});

function LessonRoute() {
  const { lesson } = Route.useLoaderData();
  return <LessonView course={readerCourse} lesson={lesson} />;
}
