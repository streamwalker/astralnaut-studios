import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  display_name: string | null;
  is_admin: boolean;
  subscription: {
    tier: string | null;
    status: string | null;
    current_period_end: string | null;
    environment: string | null;
  } | null;
  metrics: {
    sessions_30d: number;
    pageviews_30d: number;
    total_time_ms_30d: number;
    last_seen: string | null;
  };
};

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string; page?: number }) =>
    z
      .object({ search: z.string().max(200).optional(), page: z.number().int().min(1).max(50).optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const page = data.page ?? 1;
    const perPage = 100;
    const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (usersErr) throw new Error(usersErr.message);

    let users = usersData.users;
    if (data.search) {
      const q = data.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          (u.user_metadata?.display_name as string | undefined)?.toLowerCase().includes(q),
      );
    }
    const ids = users.map((u) => u.id);

    const [{ data: roles }, { data: subs }, { data: events }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, status, current_period_end, environment, price_id, product_id")
        .in("user_id", ids),
      supabaseAdmin
        .from("analytics_events")
        .select("user_id, event_type, session_id, duration_ms, created_at")
        .in("user_id", ids)
        .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
        .limit(50000),
    ]);

    const adminSet = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
    const subMap = new Map<string, any>();
    for (const s of subs ?? []) subMap.set(s.user_id, s);

    const metricsMap = new Map<
      string,
      { sessions: Set<string>; pageviews: number; total_ms: number; last_seen: string | null }
    >();
    for (const e of events ?? []) {
      if (!e.user_id) continue;
      const m =
        metricsMap.get(e.user_id) ??
        { sessions: new Set<string>(), pageviews: 0, total_ms: 0, last_seen: null as string | null };
      m.sessions.add(e.session_id);
      if (e.event_type === "pageview") m.pageviews++;
      if (e.event_type === "page_leave" && e.duration_ms) m.total_ms += e.duration_ms;
      if (!m.last_seen || e.created_at > m.last_seen) m.last_seen = e.created_at;
      metricsMap.set(e.user_id, m);
    }

    const rows: AdminUserRow[] = users.map((u) => {
      const m = metricsMap.get(u.id);
      const sub = subMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
        display_name: (u.user_metadata?.display_name as string | undefined) ?? null,
        is_admin: adminSet.has(u.id),
        subscription: sub
          ? {
              tier: sub.product_id ?? null,
              status: sub.status ?? null,
              current_period_end: sub.current_period_end ?? null,
              environment: sub.environment ?? null,
            }
          : null,
        metrics: {
          sessions_30d: m?.sessions.size ?? 0,
          pageviews_30d: m?.pageviews ?? 0,
          total_time_ms_30d: m?.total_ms ?? 0,
          last_seen: m?.last_seen ?? null,
        },
      };
    });

    return { users: rows, total: usersData.total ?? rows.length, page, perPage };
  });

export const getAdminUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (userErr) throw new Error(userErr.message);
    const u = userRes.user;
    if (!u) throw new Error("User not found");

    const [{ data: roles }, { data: subs }, { data: events }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId),
      supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("analytics_events")
        .select("session_id, event_type, path, target, duration_ms, created_at, referrer, user_agent")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(2000),
    ]);

    const sessions = new Map<string, { start: string; end: string; events: number; duration_ms: number }>();
    const pageStats = new Map<string, { views: number; total_ms: number; count: number }>();
    const clickCounts = new Map<string, number>();
    let totalMs = 0;
    let pageviews = 0;

    for (const e of events ?? []) {
      const s = sessions.get(e.session_id) ?? {
        start: e.created_at,
        end: e.created_at,
        events: 0,
        duration_ms: 0,
      };
      s.events++;
      if (e.created_at < s.start) s.start = e.created_at;
      if (e.created_at > s.end) s.end = e.created_at;
      if (e.event_type === "page_leave" && e.duration_ms) s.duration_ms += e.duration_ms;
      sessions.set(e.session_id, s);

      if (e.event_type === "pageview") {
        pageviews++;
        const p = pageStats.get(e.path) ?? { views: 0, total_ms: 0, count: 0 };
        p.views++;
        pageStats.set(e.path, p);
      }
      if (e.event_type === "page_leave" && e.duration_ms) {
        totalMs += e.duration_ms;
        const p = pageStats.get(e.path) ?? { views: 0, total_ms: 0, count: 0 };
        p.total_ms += e.duration_ms;
        p.count++;
        pageStats.set(e.path, p);
      }
      if (e.event_type === "click" && e.target) {
        clickCounts.set(e.target, (clickCounts.get(e.target) ?? 0) + 1);
      }
    }

    const topPages = Array.from(pageStats.entries())
      .map(([path, v]) => ({ path, views: v.views, avg_ms: v.count ? v.total_ms / v.count : 0, total_ms: v.total_ms }))
      .sort((a, b) => b.total_ms - a.total_ms)
      .slice(0, 25);

    const topClicks = Array.from(clickCounts.entries())
      .map(([target, count]) => ({ target, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    const sessionList = Array.from(sessions.entries())
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => (a.end < b.end ? 1 : -1))
      .slice(0, 50);

    return {
      user: {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
        display_name: (u.user_metadata?.display_name as string | undefined) ?? null,
        phone: u.phone ?? null,
        providers: (u.app_metadata?.providers as string[] | undefined) ?? [],
      },
      is_admin: (roles ?? []).some((r) => r.role === "admin"),
      subscriptions: subs ?? [],
      overview: {
        sessions: sessions.size,
        pageviews,
        total_time_ms: totalMs,
        avg_session_ms: sessions.size ? totalMs / sessions.size : 0,
        last_seen: events?.[0]?.created_at ?? null,
      },
      top_pages: topPages,
      top_clicks: topClicks,
      sessions: sessionList,
      recent_events: (events ?? []).slice(0, 100),
    };
  });

export const inviteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) =>
    z.object({ email: z.string().email().max(320) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: res, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email);
    if (error) throw new Error(error.message);
    return { id: res.user?.id ?? null };
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; password: string; display_name?: string }) =>
    z
      .object({
        email: z.string().email().max(320),
        password: z.string().min(8).max(200),
        display_name: z.string().min(1).max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: res, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: data.display_name ? { display_name: data.display_name } : {},
    });
    if (error) throw new Error(error.message);
    return { id: res.user?.id ?? null };
  });

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; email?: string; display_name?: string }) =>
    z
      .object({
        userId: z.string().uuid(),
        email: z.string().email().max(320).optional(),
        display_name: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const updates: any = {};
    if (data.email) updates.email = data.email;
    if (data.display_name !== undefined) updates.user_metadata = { display_name: data.display_name };
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, updates);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAdminUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; grant: boolean }) =>
    z.object({ userId: z.string().uuid(), grant: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: "admin" });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      if (data.userId === context.userId) throw new Error("You cannot revoke your own admin role.");
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const sendAdminPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) =>
    z.object({ email: z.string().email().max(320) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account.");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
