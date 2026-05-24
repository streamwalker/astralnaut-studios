import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  paths: z.array(z.string().min(1).max(500)).min(1).max(20),
  bucket: z.string().min(1).max(64).default("comic-pages"),
  userId: z.string().uuid().nullable().optional(),
  comicId: z.string().uuid().nullable().optional(),
  isFree: z.boolean().nullable().optional(),
});

export const logStorageAccess = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    let ip: string | null = null;
    let ua: string | null = null;
    let referer: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
      ua = getRequestHeader("user-agent") ?? null;
      referer = getRequestHeader("referer") ?? null;
    } catch {
      /* ignore - context utilities best-effort */
    }

    const rows = data.paths.map((p) => ({
      bucket: data.bucket,
      path: p,
      user_id: data.userId ?? null,
      ip,
      user_agent: ua,
      referer,
      is_free: data.isFree ?? null,
      comic_id: data.comicId ?? null,
    }));

    const { error } = await supabaseAdmin.from("storage_access_logs").insert(rows);
    if (error) {
      console.error("[storage-access] insert failed", error.message);
      return { ok: false };
    }

    // Best-effort burst detection. Don't block the response on this.
    void supabaseAdmin
      .rpc("detect_storage_access_bursts", { window_seconds: 60, threshold: 40 })
      .then(({ error: rpcErr }) => {
        if (rpcErr) console.error("[storage-access] detect failed", rpcErr.message);
      });

    return { ok: true };
  });
