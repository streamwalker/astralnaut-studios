import { createFileRoute } from "@tanstack/react-router";

const ROUTES = ["/", "/battlefield-atlantis", "/children-of-aquarius", "/darker-ages", "/pricing", "/industry"];

export const Route = createFileRoute("/api/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ROUTES.map((r) => `  <url><loc>${r}</loc></url>`).join("\n")}\n</urlset>\n`;
        return new Response(body, { headers: { "Content-Type": "application/xml" } });
      },
    },
  },
});
