import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ClientInputSchema = z.object({
  paths: z.array(z.string().min(1).max(500)).min(1).max(20),
  bucket: z.string().min(1).max(64).default("comic-pages"),
  comicId: z.string().uuid().nullable().optional(),
  isFree: z.boolean().nullable().optional(),
});

type LogParams = {
  paths: string[];
  bucket?: string;
  userId?: string | null;
  comicId?: string | null;
  isFree?: boolean | null;
};

/**
 * Internal helper for server-side callers (e.g. `getSignedComicPages`).
 * Not exposed as a server fn — callers are already trusted.
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

/**
 * Authenticated client-callable server function. The caller's user_id is
 * derived from the auth context — clients cannot spoof another user's id,
 * and anonymous floods are rejected by the auth middleware.
 */
export const logStorageAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ClientInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    return recordStorageAccess({
      paths: data.paths,
      bucket: data.bucket,
      userId: context.userId,
      comicId: data.comicId ?? null,
      isFree: data.isFree ?? null,
    });
  });
