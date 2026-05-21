import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const listSeries = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("series")
    .select("id,slug,name,genre,status,logline,cover_path,logo_path,comp_titles,launch_label,sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getMilestone = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("milestones")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

export const getSiteCopy = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("site_copy").select("key,value");
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
});

export const getSeriesBundle = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const { data: series, error: sErr } = await supabaseAdmin
      .from("series").select("*").eq("slug", data.slug).maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!series) return null;
    const [{ data: issues }, { data: factions }, { data: characters }] = await Promise.all([
      supabaseAdmin.from("issues").select("*").eq("series_id", series.id).order("issue_number"),
      supabaseAdmin.from("factions").select("*").eq("series_id", series.id).order("sort_order"),
      supabaseAdmin.from("characters").select("*").eq("series_id", series.id).eq("is_published", true).order("sort_order"),
    ]);
    return { series, issues: issues ?? [], factions: factions ?? [], characters: characters ?? [] };
  });

export const getIssueBundle = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(160) }).parse(input))
  .handler(async ({ data }) => {
    const { data: issue, error } = await supabaseAdmin
      .from("issues").select("*, series:series(slug,name,logo_path)").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    if (!issue) return null;
    const [{ data: pages }, { data: drops }] = await Promise.all([
      supabaseAdmin.from("comics").select("id,page_number,image_path,alt_text,is_free,drop_at,published_at,title").eq("issue_id", issue.id).order("page_number"),
      supabaseAdmin.from("issue_drops").select("*").eq("issue_id", issue.id).order("week"),
    ]);
    return { issue, pages: pages ?? [], drops: drops ?? [] };
  });
