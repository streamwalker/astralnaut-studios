import { createFileRoute, notFound } from "@tanstack/react-router";
import { LessonView } from "@/components/learn/LessonView";
import { adminCourse } from "@/content/learn/admin";

export const Route = createFileRoute("/_authenticated/admin/learn/$moduleId")({
  loader: ({ params }) => {
    const lesson = adminCourse.modules.find((m) => m.id === params.moduleId);
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: ({ loaderData }) => {
    const l = loaderData?.lesson;
    const title = l ? `${l.title} — Admin Training` : "Admin Training";
    return {
      meta: [
        { title },
        { name: "description", content: l?.summary ?? "Admin training module." },
        { property: "og:title", content: title },
        { property: "og:description", content: l?.summary ?? "" },
      ],
    };
  },
  component: AdminLessonRoute,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-[var(--ink)]">Module not found</h1>
      <a href="/admin/learn" className="mt-4 inline-block text-[var(--neon)] underline">
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

function AdminLessonRoute() {
  const { lesson } = Route.useLoaderData();
  return <LessonView course={adminCourse} lesson={lesson} />;
}
