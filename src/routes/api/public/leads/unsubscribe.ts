import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/leads/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        if (!token) return redirect("/?unsub=missing-token");
        const { error } = await supabaseAdmin.from("leads").delete().eq("unsub_token", token);
        if (error) return redirect("/?unsub=error");
        return redirect("/?unsub=done");
      },
    },
  },
});

function redirect(to: string): Response {
  return new Response(null, { status: 302, headers: { Location: to } });
}
