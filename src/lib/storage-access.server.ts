import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type LogParams = {
  paths: string[];
  bucket?: string;
  userId?: string | null;
  comicId?: string | null;
  isFree?: boolean | null;
};

/**
 * Internal helper for server-side callers (e.g. `getSignedComicPages`).
 * Lives in a `.server.ts` module so the client bundle can't reach it.
 */
export async function recordStorageAccess(params: LogParams) {
  let ip: string | null = null;
  let ua: string | null = null;
  let referer: string | null = null;
  try {
    ip = getRequestIP({ xForwardedFor: true }) ?? null;
    ua = getRequestHeader("user-agent") ?? null;
    referer = getRequestHeader("referer") ?? null;
  } catch {
    /* best-effort */
  }

  const bucket = params.bucket ?? "comic-pages";
  const rows = params.paths.map((p) => ({
    bucket,
    path: p,
    user_id: params.userId ?? null,
    ip,
    user_agent: ua,
    referer,
    is_free: params.isFree ?? null,
    comic_id: params.comicId ?? null,
  }));

  const { error } = await supabaseAdmin.from("storage_access_logs").insert(rows);
  if (error) {
    console.error("[storage-access] insert failed", error.message);
    return { ok: false };
  }

  void supabaseAdmin
    .rpc("detect_storage_access_bursts", { window_seconds: 60, threshold: 40 })
    .then(({ error: rpcErr }) => {
      if (rpcErr) console.error("[storage-access] detect failed", rpcErr.message);
    });

  return { ok: true };
}
