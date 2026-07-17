import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---------- Public: list carousel slides ----------

export const listCarouselSlides = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("carousel_slides")
    .select("id, image_path, alt, sort_order, is_published")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ---------- Admin gate helper ----------

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

// ---------- Admin: carousel slides ----------

export const adminListCarouselSlides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("carousel_slides")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCarouselSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id?: string;
    image_path: string;
    alt: string;
    sort_order: number;
    is_published: boolean;
  }) =>
    z.object({
      id: z.string().uuid().optional(),
      image_path: z.string().min(1).max(600),
      alt: z.string().max(300).default(""),
      sort_order: z.number().int().min(0).max(10000),
      is_published: z.boolean(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.id) {
      const { error } = await supabaseAdmin.from("carousel_slides").update({
        image_path: data.image_path, alt: data.alt, sort_order: data.sort_order, is_published: data.is_published,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin.from("carousel_slides").insert({
      image_path: data.image_path, alt: data.alt, sort_order: data.sort_order, is_published: data.is_published,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteCarouselSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("carousel_slides").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: issue covers ----------

export const adminListIssues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("issues")
      .select("id, issue_number, title, slug, cover_path, series:series(slug, name)")
      .order("series_id")
      .order("issue_number");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateIssueCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; cover_path: string }) =>
    z.object({ id: z.string().uuid(), cover_path: z.string().min(1).max(600) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("issues").update({ cover_path: data.cover_path }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearIssueCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("issues").update({ cover_path: null }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: characters ----------

export const adminListCharacters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("characters")
      .select("id, slug, name, role, faction, short_description, bio, portrait_path, sort_order, is_published, series_id, series:series(slug, name)")
      .order("series_id")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateCharacterPortrait = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; portrait_path: string }) =>
    z.object({ id: z.string().uuid(), portrait_path: z.string().min(1).max(600) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("characters").update({ portrait_path: data.portrait_path }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearCharacterPortrait = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("characters").update({ portrait_path: null }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
