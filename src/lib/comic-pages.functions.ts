import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { recordStorageAccess } from "./storage-access.server";
import type { DropRow } from "./drop-schedule";
import { releaseMap, tierCanRead, type PageInput } from "./page-access";
import { tierFromPriceId, tierRank, type Tier } from "./tier";

const BUCKET = "comic-pages";
const EXPIRES_IN = 60; // seconds

const InputSchema = z.object({
  paths: z.array(z.string().min(1).max(500)).min(1).max(20),
  expiresIn: z.number().int().min(10).max(300).optional(),
});

const IssueInputSchema = z.object({
  issueId: z.string().uuid(),
});

type CallerAccess = {
  isAdmin: boolean;
  /** Effective tier for gating. Admins are treated as `patron`. */
  tier: Tier;
  /** Whether any active subscription exists at all, in either environment. */
  entitled: boolean;
};

/**
 * Resolve what the caller is allowed to see.
 *
 * `has_active_subscription` stays the sole authority on *whether* a subscription
 * is live — its status/period predicate is deliberately not restated in JS,
 * because a second copy would drift from the RLS policy that uses it. Once an
 * environment answers yes, the tier comes from the newest `subscriptions` row in
 * that environment, matching `useSubscription`'s newest-row-per-env rule so the
 * client's badge and the server's gate cannot disagree.
 *
 * `subscriptions.price_id` stores Stripe lookup keys ("initiate_monthly"), not
 * price ids, which is why `tierFromPriceId` works on it directly. Verified
 * against live rows.
 */
async function resolveCallerAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CallerAccess> {
  const [{ data: isAdmin }, { data: live }, { data: sandbox }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_active_subscription", { user_uuid: userId, check_env: "live" }),
    supabase.rpc("has_active_subscription", { user_uuid: userId, check_env: "sandbox" }),
  ]);

  if (isAdmin) return { isAdmin: true, tier: "patron", entitled: true };

  const envs = [live ? "live" : null, sandbox ? "sandbox" : null].filter(
    (e): e is string => e !== null,
  );
  if (envs.length === 0) return { isAdmin: false, tier: "none", entitled: false };

  const { data: rows } = await supabaseAdmin
    .from("subscriptions")
    .select("price_id, environment, created_at")
    .eq("user_id", userId)
    .in("environment", envs)
    .order("created_at", { ascending: false });

  // Newest row per entitled environment, then the highest tier across them: a
  // caller who is Reader in sandbox and Patron in live reads as Patron.
  const newestPerEnv = new Map<string, string | null>();
  for (const r of rows ?? []) {
    if (!newestPerEnv.has(r.environment)) newestPerEnv.set(r.environment, r.price_id);
  }
  let tier: Tier = "none";
  for (const priceId of newestPerEnv.values()) {
    const t = tierFromPriceId(priceId);
    if (tierRank(t) > tierRank(tier)) tier = t;
  }

  // An active subscription whose price_id we cannot map must not read as "none";
  // that would lock out a paying account over a naming change. Fall back to the
  // lowest paid tier, which is exactly the pre-stagger behaviour.
  if (tier === "none") tier = "reader";

  return { isAdmin: false, tier, entitled: true };
}

/** The issue's drop rows, which define the per-tier stagger. May be empty. */
async function dropsForIssue(issueId: string): Promise<DropRow[]> {
  const { data, error } = await supabaseAdmin
    .from("issue_drops")
    .select("week, pages, patron_date, initiate_date, reader_date")
    .eq("issue_id", issueId)
    .order("week");
  if (error) throw new Error(error.message);
  return (data ?? []) as DropRow[];
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
 * Release is per-page and per-tier: a page covered by an `issue_drops` row opens
 * to Patron on `patron_date`, Initiate on `initiate_date`, Reader on
 * `reader_date`. A paid page with no drop row opens to every active subscriber —
 * see the rules at the top of `page-access.ts` before changing that.
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

    const access = await resolveCallerAccess(supabase, userId);
    if (!access.entitled)
      return {
        entitled: false,
        tier: access.tier,
        pages: [] as Array<{ page_number: number; image_path: string }>,
      };

    const [{ data: rows, error }, drops] = await Promise.all([
      supabaseAdmin
        .from("comics")
        .select("page_number, image_path, published_at, is_free")
        .eq("issue_id", data.issueId)
        .eq("is_free", false)
        .order("page_number"),
      dropsForIssue(data.issueId),
    ]);
    if (error) throw new Error(error.message);

    const byNumber = new Map((rows ?? []).map((r) => [r.page_number, r]));
    const pages = releaseMap((rows ?? []) as PageInput[], drops)
      .filter((r) => tierCanRead(r, access.tier))
      .map((r) => byNumber.get(r.pageNumber))
      .filter((r): r is NonNullable<typeof r> => !!r && !!r.image_path)
      .map((r) => ({ page_number: r.page_number, image_path: r.image_path as string }));

    if (pages.length > 0) {
      void recordStorageAccess({
        paths: pages.map((p) => p.image_path),
        bucket: BUCKET,
        userId,
        isFree: false,
      }).catch(() => {});
    }

    return { entitled: true, tier: access.tier, pages };
  });

/**
 * Admin-only. Every `comics` row for an issue with its real `image_path`, plus
 * the release state the schedule puts it in today.
 *
 * This exists because `getIssueBundle` blanks `image_path` on paid pages for
 * *every* visitor, admins included — which is why the series page shows an admin
 * a grid of empty locked tiles with no way to tell a Patron-only page from an
 * unpublished one from a row with no file attached. This is the console view:
 * what is uploaded, and who can see it right now.
 *
 * No `recordStorageAccess` call here on purpose. The burst detector exists to
 * catch scraping of the paywalled bucket; an admin loading their own dashboard
 * would trip it every time and drown the real signal.
 */
export const getIssuePageMatrix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IssueInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) return { admin: false as const, pages: [], drops: [] as DropRow[] };

    const [{ data: rows, error }, drops] = await Promise.all([
      supabaseAdmin
        .from("comics")
        .select("id, page_number, image_path, alt_text, title, is_free, published_at, drop_at")
        .eq("issue_id", data.issueId)
        .order("page_number"),
      dropsForIssue(data.issueId),
    ]);
    if (error) throw new Error(error.message);

    const releases = releaseMap((rows ?? []) as PageInput[], drops);
    const byNumber = new Map(releases.map((r) => [r.pageNumber, r]));

    const pages = (rows ?? []).map((r) => ({
      id: r.id,
      page_number: r.page_number,
      image_path: r.image_path,
      alt_text: r.alt_text,
      title: r.title,
      is_free: !!r.is_free,
      published_at: r.published_at,
      drop_at: r.drop_at,
      release: byNumber.get(r.page_number) ?? null,
    }));

    return { admin: true as const, pages, drops };
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
