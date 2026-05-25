import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logStorageAccess } from "./storage-access.functions";

const BUCKET = "comic-pages";
const EXPIRES_IN = 60; // seconds

const InputSchema = z.object({
  paths: z.array(z.string().min(1).max(500)).min(1).max(20),
  expiresIn: z.number().int().min(10).max(300).optional(),
});

type SignedPage = {
  path: string;
  url: string | null;
  reason: "ok" | "not_found" | "not_published" | "subscription_required";
};

/**
 * Validates that the caller is entitled to each requested comic page and
 * returns short-lived signed URLs only for the eligible ones. Ineligible
 * paths come back with `url: null` and a `reason` explaining why.
 *
 * Entitlement rules mirror the `comics` RLS policy:
 *   - page must be published (`published_at <= now()`)
 *   - free pages → anyone signed in
 *   - paid pages → caller must have an active subscription (sandbox or live)
 *
 * Admins bypass the subscription check. Every call is logged via
 * `storage_access_logs` for burst detection.
 */
export const getSignedComicPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const expiresIn = data.expiresIn ?? EXPIRES_IN;

    // 1. Resolve the requested paths → comic rows (admin client; we enforce
    //    the access rule ourselves below so we get clean per-path reasons).
    const { data: rows, error: rowsErr } = await supabaseAdmin
      .from("comics")
      .select("id, image_path, is_free, published_at")
      .in("image_path", data.paths);
    if (rowsErr) throw new Error(rowsErr.message);

    const byPath = new Map(rows?.map((r) => [r.image_path, r]) ?? []);

    // 2. Is the caller an admin? Admins skip the sub check.
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    // 3. Does the caller have an active sub in either env?
    let hasSub = !!isAdmin;
    if (!hasSub) {
      const [{ data: live }, { data: sandbox }] = await Promise.all([
        supabase.rpc("has_active_subscription", { user_uuid: userId, check_env: "live" }),
        supabase.rpc("has_active_subscription", { user_uuid: userId, check_env: "sandbox" }),
      ]);
      hasSub = !!live || !!sandbox;
    }

    // 4. Decide eligibility per path.
    const now = Date.now();
    const decisions: Array<{ path: string; reason: SignedPage["reason"] }> = data.paths.map(
      (path) => {
        const row = byPath.get(path);
        if (!row) return { path, reason: "not_found" };
        const published = row.published_at && new Date(row.published_at).getTime() <= now;
        if (!published) return { path, reason: "not_published" };
        if (!row.is_free && !hasSub) return { path, reason: "subscription_required" };
        return { path, reason: "ok" };
      },
    );

    // 5. Sign only eligible paths in one batch.
    const eligible = decisions.filter((d) => d.reason === "ok").map((d) => d.path);
    const signedMap = new Map<string, string>();
    if (eligible.length > 0) {
      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrls(eligible, expiresIn);
      if (signErr) throw new Error(signErr.message);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
      }
    }

    const results: SignedPage[] = decisions.map((d) => ({
      path: d.path,
      reason: d.reason,
      url: d.reason === "ok" ? signedMap.get(d.path) ?? null : null,
    }));

    // 6. Best-effort audit log for any path we actually handed out a URL for.
    if (eligible.length > 0) {
      void logStorageAccess({
        data: {
          paths: eligible,
          bucket: BUCKET,
          userId,
          isFree: null,
        },
      }).catch(() => {});
    }

    return { expiresIn, results };
  });
