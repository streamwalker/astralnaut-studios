import { createFileRoute } from "@tanstack/react-router";
import { serveBattlefieldPreview } from "@/lib/share-video.server";

function serve({ request }: { request: Request }) {
  const runtimeRequest = request as Request & {
    runtime?: { cloudflare?: { env?: Cloudflare.Env } };
  };
  return serveBattlefieldPreview(request, runtimeRequest.runtime?.cloudflare?.env?.ASSETS);
}

export const Route = createFileRoute("/media/battlefield-atlantis-preview-v2.mp4")({
  server: { handlers: { GET: serve, HEAD: serve } },
});
