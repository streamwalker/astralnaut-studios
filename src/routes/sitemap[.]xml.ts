import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readerHelp } from "@/content/help/reader";
import { readerCourse } from "@/content/learn/reader";

const BASE_URL = "https://astralnautstudios.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/battlefield-atlantis", changefreq: "weekly", priority: "0.8" },
          { path: "/children-of-aquarius", changefreq: "weekly", priority: "0.8" },
          { path: "/darker-ages", changefreq: "weekly", priority: "0.8" },
          { path: "/astralnaut-studios", changefreq: "monthly", priority: "0.7" },
          { path: "/archive", changefreq: "weekly", priority: "0.6" },
          { path: "/pricing", changefreq: "monthly", priority: "0.6" },
          { path: "/industry", changefreq: "monthly", priority: "0.6" },
          { path: "/help", changefreq: "monthly", priority: "0.5" },
          { path: "/learn", changefreq: "monthly", priority: "0.5" },
          { path: "/community-guidelines", changefreq: "yearly", priority: "0.3" },
          { path: "/canon-cameo-terms", changefreq: "yearly", priority: "0.3" },
          ...readerHelp.articles.map((a) => ({
            path: `/help/${a.slug}`,
            changefreq: "monthly" as const,
            priority: "0.4",
          })),
          ...readerCourse.modules.map((m) => ({
            path: `/learn/${m.id}`,
            changefreq: "monthly" as const,
            priority: "0.4",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
