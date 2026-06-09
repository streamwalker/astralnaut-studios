import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

const ListInput = z.object({
  seriesSlug: z.string().min(1).max(120).optional(),
  issueId: z.string().uuid().optional(),
  status: z.enum(["pending", "approved", "rejected", "hidden", "all"]).default("pending"),
});

export const adminListLetters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    let issueIds: string[] | null = null;
    if (data.seriesSlug && !data.issueId) {
      const { data: ser } = await supabaseAdmin
        .from("series").select("id").eq("slug", data.seriesSlug).maybeSingle();
      if (ser) {
        const { data: iss } = await supabaseAdmin
          .from("issues").select("id").eq("series_id", ser.id);
        issueIds = (iss ?? []).map((i) => i.id);
      } else {
        issueIds = [];
      }
    }

    let q = supabaseAdmin
      .from("letters")
      .select("id, issue_id, user_id, subject, body, display_name, location, status, editor_reply, feature_order, approved_at, created_at, updated_at, issue:issues(issue_number, title, series:series(slug, name))")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.issueId) q = q.eq("issue_id", data.issueId);
    if (issueIds) q = q.in("issue_id", issueIds.length ? issueIds : ["00000000-0000-0000-0000-000000000000"]);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const SetStatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected", "hidden"]),
  editorReply: z.string().trim().max(4000).nullable().optional(),
  featureOrder: z.number().int().min(0).max(999).nullable().optional(),
});

export const adminSetLetterStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SetStatusInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const patch: Record<string, string | number | null> = { status: data.status };
    if (data.editorReply !== undefined) patch.editor_reply = data.editorReply || null;
    if (data.featureOrder !== undefined) patch.feature_order = data.featureOrder;
    if (data.status === "approved") {
      patch.approved_at = new Date().toISOString();
      patch.approved_by = context.userId;
    }
    const { error } = await supabaseAdmin.from("letters").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetCommentHidden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), hidden: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("letter_comments")
      .update({ hidden: data.hidden })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
