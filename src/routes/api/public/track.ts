import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function pickIp(request: Request): string | null {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  const xr = request.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return null;
}

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            path?: unknown;
            referrer?: unknown;
            user_id?: unknown;
          };
          const path = typeof body.path === "string" ? body.path.slice(0, 512) : null;
          const referrer =
            typeof body.referrer === "string" ? body.referrer.slice(0, 1024) : null;
          const user_id =
            typeof body.user_id === "string" && body.user_id.length <= 64
              ? body.user_id
              : null;
          if (!path) return new Response(null, { status: 204, headers: CORS });

          const ip = pickIp(request);
          const ua = request.headers.get("user-agent")?.slice(0, 512) ?? null;
          const country = request.headers.get("cf-ipcountry")?.slice(0, 8) ?? null;
          const day = new Date().toISOString().slice(0, 10);
          const ip_hash = ip
            ? createHash("sha256").update(`${ip}|${day}`).digest("hex")
            : null;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("visitor_hits").insert({
            ip,
            ip_hash,
            user_agent: ua,
            path,
            referrer,
            country,
            user_id,
          });
          return new Response(null, { status: 204, headers: CORS });
        } catch {
          return new Response(null, { status: 204, headers: CORS });
        }
      },
    },
  },
});
