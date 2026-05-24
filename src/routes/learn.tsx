import { createFileRoute } from "@tanstack/react-router";
import { CourseOverview } from "@/components/learn/CourseOverview";
import { readerCourse } from "@/content/learn/reader";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Training Course — Astralnaut Studios" },
      {
        name: "description",
        content:
          "Five short modules covering everything readers need to get the most out of the platform.",
      },
      { property: "og:title", content: "Reader Training Course" },
      {
        property: "og:description",
        content: "Modules, quizzes, and a printable certificate at the end.",
      },
    ],
  }),
  component: () => <CourseOverview course={readerCourse} />,
});
