import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/leads/confirm")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        if (!token) return redirect("/?lead=missing-token");
        const { error } = await supabaseAdmin
          .from("leads")
          .update({ confirmed: true })
          .eq("confirm_token", token);
        if (error) return redirect("/?lead=error");
        return redirect("/?lead=confirmed");
      },
    },
  },
});

function redirect(to: string): Response {
  return new Response(null, { status: 302, headers: { Location: to } });
}
