import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SLUG = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/);
const ISSUE = z.coerce.number().int().min(1).max(999);

export type LetterStatus = "pending" | "approved" | "rejected" | "hidden";

export type LetterComment = {
  id: string;
  letter_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
  mine: boolean;
};

export type ApprovedLetter = {
  id: string;
  subject: string;
  body: string;
  display_name: string;
  location: string | null;
  editor_reply: string | null;
  feature_order: number | null;
  approved_at: string | null;
  comments: LetterComment[];
};

export type MyLetter = {
  id: string;
  subject: string;
  body: string;
  display_name: string;
  location: string | null;
  status: LetterStatus;
  editor_reply: string | null;
  created_at: string;
};

export type LettersPageBundle = {
  series: { slug: string; name: string };
  issue: { id: string; issue_number: number; title: string; total_pages: number };
  unlocked: boolean;
  isAdmin: boolean;
  hasActiveSub: boolean;
  letters: ApprovedLetter[];
  myLetter: MyLetter | null;
};

/**
 * Loads the letters page bundle for a given series + issue.
 * Public visibility of approved letters is gated on the issue being fully
 * published (every page row has a past `published_at`). Admins see it always.
 */
export const getLettersPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ series: SLUG, issue: ISSUE }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // 1. Resolve series + issue.
    const { data: series, error: sErr } = await supabaseAdmin
      .from("series")
      .select("id, slug, name")
      .eq("slug", data.series)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!series) return null;

    const { data: issue, error: iErr } = await supabaseAdmin
      .from("issues")
      .select("id, issue_number, title, total_pages")
      .eq("series_id", series.id)
      .eq("issue_number", data.issue)
      .maybeSingle();
    if (iErr) throw new Error(iErr.message);
    if (!issue) return null;

    // 2. Is caller admin / subbed / is issue concluded?
    const [{ data: isAdmin }, { data: hasLive }, { data: hasSandbox }, { data: concluded }] =
      await Promise.all([
        supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
        supabase.rpc("has_active_subscription", { user_uuid: userId, check_env: "live" }),
        supabase.rpc("has_active_subscription", { user_uuid: userId, check_env: "sandbox" }),
        supabase.rpc("issue_is_concluded", { p_issue: issue.id }),
      ]);

    const unlocked = !!concluded || !!isAdmin;
    const hasActiveSub = !!hasLive || !!hasSandbox;

    // 3. Approved letters (visible only when unlocked) + comments.
    let approved: ApprovedLetter[] = [];
    if (unlocked) {
      const { data: rows } = await supabaseAdmin
        .from("letters")
        .select("id, subject, body, display_name, location, editor_reply, feature_order, approved_at")
        .eq("issue_id", issue.id)
        .eq("status", "approved")
        .order("feature_order", { ascending: true, nullsFirst: false })
        .order("approved_at", { ascending: true });
      const letterIds = (rows ?? []).map((r) => r.id);
      let commentsByLetter = new Map<string, LetterComment[]>();
      if (letterIds.length > 0) {
        const { data: comments } = await supabaseAdmin
          .from("letter_comments")
          .select("id, letter_id, user_id, display_name, body, created_at, hidden")
          .in("letter_id", letterIds)
          .eq("hidden", false)
          .order("created_at", { ascending: true });
        for (const c of comments ?? []) {
          const list = commentsByLetter.get(c.letter_id) ?? [];
          list.push({
            id: c.id,
            letter_id: c.letter_id,
            user_id: c.user_id,
            display_name: c.display_name,
            body: c.body,
            created_at: c.created_at,
            mine: c.user_id === userId,
          });
          commentsByLetter.set(c.letter_id, list);
        }
      }
      approved = (rows ?? []).map((r) => ({
        id: r.id,
        subject: r.subject,
        body: r.body,
        display_name: r.display_name,
        location: r.location,
        editor_reply: r.editor_reply,
        feature_order: r.feature_order,
        approved_at: r.approved_at,
        comments: commentsByLetter.get(r.id) ?? [],
      }));
    }

    // 4. Caller's own latest submission (any status) for the form.
    const { data: mine } = await supabaseAdmin
      .from("letters")
      .select("id, subject, body, display_name, location, status, editor_reply, created_at")
      .eq("issue_id", issue.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const bundle: LettersPageBundle = {
      series: { slug: series.slug, name: series.name },
      issue: {
        id: issue.id,
        issue_number: issue.issue_number,
        title: issue.title,
        total_pages: Number(issue.total_pages),
      },
      unlocked,
      isAdmin: !!isAdmin,
      hasActiveSub,
      letters: approved,
      myLetter: (mine as MyLetter | null) ?? null,
    };
    return bundle;
  });

const SubmitInput = z.object({
  issueId: z.string().uuid(),
  subject: z.string().trim().min(2).max(200),
  body: z.string().trim().min(20).max(4000),
  displayName: z.string().trim().min(1).max(80),
  location: z.string().trim().max(120).optional().or(z.literal("")),
});

/**
 * Subscriber-only. Inserts a new pending letter, or updates the user's
 * existing pending letter for that issue. Approved/rejected letters are
 * locked — calling this when one exists creates a new pending submission.
 */
export const submitLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("letters")
      .select("id, status")
      .eq("issue_id", data.issueId)
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    const payload = {
      issue_id: data.issueId,
      user_id: userId,
      subject: data.subject,
      body: data.body,
      display_name: data.displayName,
      location: data.location ? data.location : null,
      status: "pending" as const,
    };

    if (existing) {
      const { error } = await supabase
        .from("letters")
        .update({
          subject: payload.subject,
          body: payload.body,
          display_name: payload.display_name,
          location: payload.location,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id, updated: true };
    }

    const { data: row, error } = await supabase
      .from("letters")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, updated: false };
  });

const CommentInput = z.object({
  letterId: z.string().uuid(),
  body: z.string().trim().min(1).max(1500),
  displayName: z.string().trim().min(1).max(80),
});

export const addLetterComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CommentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("letter_comments")
      .insert({
        letter_id: data.letterId,
        user_id: userId,
        body: data.body,
        display_name: data.displayName,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteOwnComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ commentId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("letter_comments")
      .delete()
      .eq("id", data.commentId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
