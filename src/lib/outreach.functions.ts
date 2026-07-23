import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const listOutreachProspects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("outreach_prospects")
      .select("*")
      .order("tier", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  url: z.string().trim().url().max(500),
  site_name: z.string().trim().max(200).optional().nullable(),
  contact_name: z.string().trim().max(200).optional().nullable(),
  contact_email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  tier: z.number().int().min(1).max(3),
  category: z.string().trim().max(100).optional().nullable(),
  status: z.enum(["prospect", "contacted", "replied", "negotiating", "published", "declined", "dead"]),
  notes: z.string().max(4000).optional().nullable(),
  link_acquired: z.boolean(),
  link_acquired_url: z.string().trim().url().max(500).optional().nullable().or(z.literal("")),
});

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    // Strip tracking params
    const drop = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "ref", "ref_src"];
    drop.forEach((k) => u.searchParams.delete(k));
    // Normalize trailing slash on path (keep root "/")
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    return u.toString().toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

export const upsertOutreachProspect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Duplicate detection: normalize URL and check for existing prospect with matching URL
    const normalized = normalizeUrl(data.url);
    const { data: allRows, error: dupErr } = await supabaseAdmin
      .from("outreach_prospects")
      .select("id, url");
    if (dupErr) throw new Error(dupErr.message);
    const conflict = (allRows ?? []).find(
      (r) => normalizeUrl(r.url) === normalized && r.id !== data.id,
    );
    if (conflict) {
      throw new Error(
        `Duplicate prospect: this URL already exists in the tracker (${conflict.url}). Edit the existing entry instead.`,
      );
    }

    const payload = {
      url: data.url,
      site_name: data.site_name || null,
      contact_name: data.contact_name || null,
      contact_email: data.contact_email || null,
      tier: data.tier,
      category: data.category || null,
      status: data.status,
      notes: data.notes || null,
      link_acquired: data.link_acquired,
      link_acquired_url: data.link_acquired_url || null,
      link_acquired_at: data.link_acquired ? new Date().toISOString() : null,
      last_contacted_at:
        data.status === "contacted" || data.status === "replied" || data.status === "negotiating"
          ? new Date().toISOString()
          : null,
    };
    if (data.id) {
      // Preserve existing timestamps if already set — only bump when transitioning.
      const { data: existing } = await supabaseAdmin
        .from("outreach_prospects")
        .select("link_acquired, link_acquired_at, last_contacted_at")
        .eq("id", data.id)
        .maybeSingle();
      const finalPayload = {
        ...payload,
        link_acquired_at:
          data.link_acquired && existing?.link_acquired
            ? existing.link_acquired_at
            : payload.link_acquired_at,
        last_contacted_at: payload.last_contacted_at ?? existing?.last_contacted_at ?? null,
      };
      const { error } = await supabaseAdmin
        .from("outreach_prospects")
        .update(finalPayload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("outreach_prospects")
        .insert({ ...payload, created_by: context.userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteOutreachProspect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("outreach_prospects")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const runBacklinkCheckNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { runBacklinkCheck } = await import("@/lib/backlink-check.server");
    return await runBacklinkCheck(50);
  });
