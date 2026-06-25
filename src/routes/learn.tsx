import { createFileRoute } from "@tanstack/react-router";
import { CourseOverview } from "@/components/learn/CourseOverview";
import { readerCourse } from "@/content/learn/reader";
import { OG_DEFAULT_IMAGE, OG_DEFAULT_ALT, OG_DEFAULT_WIDTH, OG_DEFAULT_HEIGHT, SITE_URL } from "@/lib/seo";

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
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/learn` },
      { property: "og:image", content: OG_DEFAULT_IMAGE },
      { property: "og:image:width", content: OG_DEFAULT_WIDTH },
      { property: "og:image:height", content: OG_DEFAULT_HEIGHT },
      { property: "og:image:alt", content: OG_DEFAULT_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_DEFAULT_IMAGE },
      { name: "twitter:image:alt", content: OG_DEFAULT_ALT },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/learn` }],
  }),
  component: () => <CourseOverview course={readerCourse} />,
});
