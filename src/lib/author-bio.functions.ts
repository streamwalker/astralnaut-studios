import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---------- Public ----------

export const listActiveAuthorBioVariants = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("author_bio_variants")
    .select("id, slug, label, eyebrow, pull_quote, body, disclaimer, cta_label, cta_href, weight, sort_order")
    .eq("is_active", true)
    .gt("weight", 0)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

const logSchema = z.object({
  variantId: z.string().uuid(),
  eventType: z.enum(["impression", "conversion"]),
  pagePath: z.string().max(300).optional().nullable(),
  sessionId: z.string().max(120).optional().nullable(),
});

export const logAuthorBioEvent = createServerFn({ method: "POST" })
  .inputValidator((d) => logSchema.parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("author_bio_events").insert({
      variant_id: data.variantId,
      event_type: data.eventType,
      page_path: data.pagePath ?? null,
      session_id: data.sessionId ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
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

export const adminListAuthorBioVariants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: variants, error } = await supabaseAdmin
      .from("author_bio_variants")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: events, error: evErr } = await supabaseAdmin
      .from("author_bio_events")
      .select("variant_id, event_type");
    if (evErr) throw new Error(evErr.message);

    const stats = new Map<string, { impressions: number; conversions: number }>();
    for (const v of variants ?? []) stats.set(v.id, { impressions: 0, conversions: 0 });
    for (const e of events ?? []) {
      const s = stats.get(e.variant_id) ?? { impressions: 0, conversions: 0 };
      if (e.event_type === "impression") s.impressions++;
      else if (e.event_type === "conversion") s.conversions++;
      stats.set(e.variant_id, s);
    }

    return (variants ?? []).map((v) => ({
      ...v,
      impressions: stats.get(v.id)?.impressions ?? 0,
      conversions: stats.get(v.id)?.conversions ?? 0,
    }));
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens"),
  label: z.string().min(1).max(120),
  eyebrow: z.string().min(1).max(120),
  pull_quote: z.string().max(500).optional().nullable(),
  body: z.string().min(1).max(4000),
  disclaimer: z.string().max(1000).optional().nullable(),
  cta_label: z.string().max(60).optional().nullable(),
  cta_href: z.string().max(300).optional().nullable(),
  weight: z.number().int().min(0).max(100),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(1000),
});

export const adminUpsertAuthorBioVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const payload = {
      slug: data.slug,
      label: data.label,
      eyebrow: data.eyebrow,
      pull_quote: data.pull_quote?.trim() || null,
      body: data.body,
      disclaimer: data.disclaimer?.trim() || null,
      cta_label: data.cta_label?.trim() || null,
      cta_href: data.cta_href?.trim() || null,
      weight: data.weight,
      is_active: data.is_active,
      sort_order: data.sort_order,
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("author_bio_variants")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("author_bio_variants").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteAuthorBioVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("author_bio_variants")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
