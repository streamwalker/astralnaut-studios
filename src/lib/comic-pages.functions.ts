import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { recordStorageAccess } from "./storage-access.server";

const BUCKET = "comic-pages";
const EXPIRES_IN = 60; // seconds

const InputSchema = z.object({
  paths: z.array(z.string().min(1).max(500)).min(1).max(20),
  expiresIn: z.number().int().min(10).max(300).optional(),
});

const IssueInputSchema = z.object({
  issueId: z.string().uuid(),
});

/** Shared entitlement test: admins bypass, otherwise an active sub in either env. */
async function callerIsEntitled(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin) return true;
  const [{ data: live }, { data: sandbox }] = await Promise.all([
    supabase.rpc("has_active_subscription", { user_uuid: userId, check_env: "live" }),
    supabase.rpc("has_active_subscription", { user_uuid: userId, check_env: "sandbox" }),
  ]);
  return !!live || !!sandbox;
}

/**
 * Returns the storage paths of an issue's PAID pages, but only to a caller who
 * is actually entitled to them. Unentitled callers get `entitled: false` and an
 * empty list, which is indistinguishable from an issue with no paid pages.
 *
 * This exists because `getIssueBundle` deliberately blanks `image_path` on paid
 * pages for every visitor, so the reader has no way to render them even for a
 * paying subscriber. This is the other half of that transaction.
 *
 * Note on threat model: `comic-pages` is currently a PUBLIC bucket, so the
 * paywall's real protection is path secrecy — anyone holding a path can fetch
 * the object. Handing paths only to entitled callers preserves exactly the
 * protection the app has today. Making the bucket private and switching this to
 * signed URLs (`getSignedComicPages`, below) is the actual hardening step and is
 * tracked separately; it is not a regression introduced here.
 */
export const getEntitledIssuePages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IssueInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    const entitled = await callerIsEntitled(supabase, userId);
    if (!entitled)
      return { entitled: false, pages: [] as Array<{ page_number: number; image_path: string }> };

    const { data: rows, error } = await supabaseAdmin
      .from("comics")
      .select("page_number, image_path, published_at")
      .eq("issue_id", data.issueId)
      .eq("is_free", false)
      .order("page_number");
    if (error) throw new Error(error.message);

    const now = Date.now();
    const pages = (rows ?? [])
      .filter((r) => r.published_at && new Date(r.published_at).getTime() <= now && !!r.image_path)
      .map((r) => ({ page_number: r.page_number, image_path: r.image_path }));

    if (pages.length > 0) {
      void recordStorageAccess({
        paths: pages.map((p) => p.image_path),
        bucket: BUCKET,
        userId,
        isFree: false,
      }).catch(() => {});
    }

    return { entitled: true, pages };
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
      void recordStorageAccess({
        paths: eligible,
        bucket: BUCKET,
        userId,
        isFree: null,
      }).catch(() => {});
    }

    return { expiresIn, results };
  });
