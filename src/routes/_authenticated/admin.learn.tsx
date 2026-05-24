import { createFileRoute } from "@tanstack/react-router";
import { CourseOverview } from "@/components/learn/CourseOverview";
import { adminCourse } from "@/content/learn/admin";

export const Route = createFileRoute("/_authenticated/admin/learn")({
  head: () => ({
    meta: [
      { title: "Admin Training — Astralnaut Studios" },
      {
        name: "description",
        content: "Five modules to master running the Astralnaut Studios platform.",
      },
      { property: "og:title", content: "Admin Training Course" },
      { property: "og:description", content: "Become Astralnaut-certified to operate the platform." },
    ],
  }),
  component: () => <CourseOverview course={adminCourse} />,
});
