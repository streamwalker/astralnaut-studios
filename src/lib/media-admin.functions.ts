import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type AssetType = "issue_cover" | "carousel_slide" | "character_portrait";

async function recordVersion(
  assetType: AssetType,
  assetId: string,
  imagePath: string | null,
  userId: string,
  note?: string,
) {
  await supabaseAdmin.from("media_versions").insert({
    asset_type: assetType,
    asset_id: assetId,
    image_path: imagePath,
    created_by: userId,
    note: note ?? null,
  });
}


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
      const { data: prev } = await supabaseAdmin.from("carousel_slides").select("image_path").eq("id", data.id).maybeSingle();
      const { error } = await supabaseAdmin.from("carousel_slides").update({
        image_path: data.image_path, alt: data.alt, sort_order: data.sort_order, is_published: data.is_published,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
      if (prev && prev.image_path !== data.image_path) {
        await recordVersion("carousel_slide", data.id, prev.image_path ?? null, context.userId, "replaced");
      }
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
    const { data: prev } = await supabaseAdmin.from("carousel_slides").select("image_path").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("carousel_slides").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (prev) {
      await recordVersion("carousel_slide", data.id, prev.image_path ?? null, context.userId, "deleted");
    }
    return { ok: true };
  });

export const reorderCarouselSlides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[] }) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await supabaseAdmin
        .from("carousel_slides")
        .update({ sort_order: (i + 1) * 10 })
        .eq("id", data.ids[i]);
      if (error) throw new Error(error.message);
    }
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
    const { data: prev } = await supabaseAdmin.from("issues").select("cover_path").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("issues").update({ cover_path: data.cover_path }).eq("id", data.id);
    if (error) throw new Error(error.message);
    if (prev && prev.cover_path !== data.cover_path) {
      await recordVersion("issue_cover", data.id, prev.cover_path ?? null, context.userId, "replaced");
    }
    return { ok: true };
  });

export const clearIssueCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: prev } = await supabaseAdmin.from("issues").select("cover_path").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("issues").update({ cover_path: null }).eq("id", data.id);
    if (error) throw new Error(error.message);
    if (prev && prev.cover_path) {
      await recordVersion("issue_cover", data.id, prev.cover_path, context.userId, "cleared");
    }
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
    const { data: prev } = await supabaseAdmin.from("characters").select("portrait_path").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("characters").update({ portrait_path: data.portrait_path }).eq("id", data.id);
    if (error) throw new Error(error.message);
    if (prev && prev.portrait_path !== data.portrait_path) {
      await recordVersion("character_portrait", data.id, prev.portrait_path ?? null, context.userId, "replaced");
    }
    return { ok: true };
  });

export const clearCharacterPortrait = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: prev } = await supabaseAdmin.from("characters").select("portrait_path").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("characters").update({ portrait_path: null }).eq("id", data.id);
    if (error) throw new Error(error.message);
    if (prev && prev.portrait_path) {
      await recordVersion("character_portrait", data.id, prev.portrait_path, context.userId, "cleared");
    }
    return { ok: true };
  });

// ---------- Admin: media version history ----------

const AssetTypeSchema = z.enum(["issue_cover", "carousel_slide", "character_portrait"]);

export const listMediaVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { asset_type: AssetType; asset_id: string }) =>
    z.object({ asset_type: AssetTypeSchema, asset_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("media_versions")
      .select("id, image_path, note, created_at, created_by")
      .eq("asset_type", data.asset_type)
      .eq("asset_id", data.asset_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const restoreMediaVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { version_id: string }) =>
    z.object({ version_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: v, error: vErr } = await supabaseAdmin
      .from("media_versions")
      .select("asset_type, asset_id, image_path")
      .eq("id", data.version_id)
      .maybeSingle();
    if (vErr) throw new Error(vErr.message);
    if (!v) throw new Error("Version not found");
    if (!v.image_path) throw new Error("This version has no image to restore");

    if (v.asset_type === "issue_cover") {
      const { data: prev } = await supabaseAdmin.from("issues").select("cover_path").eq("id", v.asset_id).maybeSingle();
      const { error } = await supabaseAdmin.from("issues").update({ cover_path: v.image_path }).eq("id", v.asset_id);
      if (error) throw new Error(error.message);
      if (prev && prev.cover_path !== v.image_path) {
        await recordVersion("issue_cover", v.asset_id, prev.cover_path ?? null, context.userId, "restored-from-history");
      }
    } else if (v.asset_type === "character_portrait") {
      const { data: prev } = await supabaseAdmin.from("characters").select("portrait_path").eq("id", v.asset_id).maybeSingle();
      const { error } = await supabaseAdmin.from("characters").update({ portrait_path: v.image_path }).eq("id", v.asset_id);
      if (error) throw new Error(error.message);
      if (prev && prev.portrait_path !== v.image_path) {
        await recordVersion("character_portrait", v.asset_id, prev.portrait_path ?? null, context.userId, "restored-from-history");
      }
    } else if (v.asset_type === "carousel_slide") {
      const { data: prev } = await supabaseAdmin.from("carousel_slides").select("image_path").eq("id", v.asset_id).maybeSingle();
      if (prev) {
        const { error } = await supabaseAdmin.from("carousel_slides").update({ image_path: v.image_path }).eq("id", v.asset_id);
        if (error) throw new Error(error.message);
        if (prev.image_path !== v.image_path) {
          await recordVersion("carousel_slide", v.asset_id, prev.image_path ?? null, context.userId, "restored-from-history");
        }
      } else {
        const { error } = await supabaseAdmin.from("carousel_slides").insert({
          id: v.asset_id,
          image_path: v.image_path,
          alt: "",
          sort_order: 9999,
          is_published: false,
        });
        if (error) throw new Error(error.message);
        await recordVersion("carousel_slide", v.asset_id, null, context.userId, "recreated-from-history");
      }
    }
    return { ok: true };
  });
