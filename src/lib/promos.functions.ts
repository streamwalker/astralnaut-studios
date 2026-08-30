import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Announcement bar, editable site copy, and per-issue release schedule.
//
// All three used to be hardcoded in the React tree, which is how "issue
// completes end of July" was still on the live site on August 30. Everything
// here is admin-editable so a stale claim can be corrected — or, better, given
// an end date so it retires itself.

// ---------- Public ----------

// The bar shows at most one announcement: highest priority, and among equals
// the one that started most recently. An evergreen row (starts_at NULL) is
// therefore outranked by a dated one at the same priority, which is what you
// want — the specific announcement beats the standing one.
export const getLivePromo = createServerFn({ method: "GET" }).handler(async () => {
  // The DB does the ordering and the is_active cut; the date window is applied
  // here in JS. Two chained .or() calls would each become a separate PostgREST
  // `or=` param, and how those compose is not something I want this to depend
  // on. The queue is a handful of rows, so ranking first and picking the first
  // in-window row is both cheaper to reason about and provably right.
  const { data, error } = await supabaseAdmin
    .from("promos")
    .select("id, message, href, cta, starts_at, ends_at")
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("starts_at", { ascending: false, nullsFirst: false })
    .limit(50);
  if (error) throw new Error(error.message);

  const now = Date.now();
  const live = (data ?? []).find((p) => {
    const started = !p.starts_at || new Date(p.starts_at).getTime() <= now;
    const notEnded = !p.ends_at || new Date(p.ends_at).getTime() > now;
    return started && notEnded;
  });
  if (!live) return null;
  return { id: live.id, message: live.message, href: live.href, cta: live.cta };
});

// ---------- Admin ----------

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const adminListPromos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("promos")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Dates arrive from <input type="datetime-local"> as a local-time string with
// no zone. new Date() reads that in the browser's zone, which is the intent:
// the admin types the time they mean and it is stored as the matching instant.
const isoOrNull = z
  .string()
  .trim()
  .max(40)
  .optional()
  .nullable()
  .transform((v) => {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${v}`);
    return d.toISOString();
  });

const promoSchema = z
  .object({
    id: z.string().uuid().optional().nullable(),
    message: z.string().trim().min(1, "Message is required").max(300),
    href: z.string().trim().max(300).optional().nullable(),
    cta: z.string().trim().max(60).optional().nullable(),
    starts_at: isoOrNull,
    ends_at: isoOrNull,
    priority: z.number().int().min(0).max(1000),
    is_active: z.boolean(),
  })
  // Mirrors the promos_window_ordered CHECK constraint so the admin gets a
  // readable message instead of a Postgres error.
  .refine((v) => !v.starts_at || !v.ends_at || v.ends_at > v.starts_at, {
    message: "End must be after start",
    path: ["ends_at"],
  });

export const adminUpsertPromo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => promoSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const payload = {
      message: data.message,
      href: data.href?.trim() || null,
      cta: data.cta?.trim() || null,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      priority: data.priority,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("promos").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("promos").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeletePromo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("promos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: site copy ----------
//
// site_copy already powers the homepage and industry hero strings through
// getSiteCopy; it just never had an editor. Keys are not creatable from the
// UI on purpose — an unknown key is silently ignored by the page that reads
// it, so letting one be typed in would look like a save that did nothing.

export const adminListSiteCopy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("site_copy")
      .select("key, value, updated_at")
      .order("key");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateSiteCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ key: z.string().min(1).max(120), value: z.string().max(4000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("site_copy")
      .update({ value: data.value })
      .eq("key", data.key)
      .select("key")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error(`No site_copy row for key "${data.key}"`);
    return { ok: true };
  });

// ---------- Admin: release schedule ----------

export const adminListIssueDrops = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [{ data: issues, error: issErr }, { data: drops, error: dropErr }] = await Promise.all([
      supabaseAdmin
        .from("issues")
        .select("id, slug, title, issue_number, series:series(slug, name)")
        .order("slug"),
      supabaseAdmin.from("issue_drops").select("*").order("week"),
    ]);
    if (issErr) throw new Error(issErr.message);
    if (dropErr) throw new Error(dropErr.message);
    return { issues: issues ?? [], drops: drops ?? [] };
  });

const dateOrNull = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => v || null)
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), { message: "Use YYYY-MM-DD" });

const dropSchema = z
  .object({
    id: z.string().uuid().optional().nullable(),
    issue_id: z.string().uuid(),
    week: z.number().int().min(1).max(52),
    // Typed as "10, 11, 12" in the UI and parsed there; validated here.
    pages: z.array(z.number().int().min(0).max(999)).min(1, "At least one page"),
    patron_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    initiate_date: dateOrNull,
    reader_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  })
  .refine((v) => v.reader_date >= v.patron_date, {
    message: "Reader date cannot be before patron date",
    path: ["reader_date"],
  });

export const adminUpsertIssueDrop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => dropSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const payload = {
      issue_id: data.issue_id,
      week: data.week,
      pages: data.pages,
      patron_date: data.patron_date,
      initiate_date: data.initiate_date,
      reader_date: data.reader_date,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("issue_drops").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("issue_drops").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteIssueDrop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("issue_drops").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
