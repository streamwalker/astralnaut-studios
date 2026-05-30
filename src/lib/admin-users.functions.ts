import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type { AdminUserRow } from "./admin-users.server";

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string; page?: number }) =>
    z
      .object({ search: z.string().max(200).optional(), page: z.number().int().min(1).max(50).optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, listUsersImpl } = await import("./admin-users.server");
    await assertAdmin(context.supabase, context.userId);
    return listUsersImpl(data);
  });

export const getAdminUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, getUserDetailImpl } = await import("./admin-users.server");
    await assertAdmin(context.supabase, context.userId);
    return getUserDetailImpl(data);
  });

export const inviteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) =>
    z.object({ email: z.string().email().max(320) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, inviteUserImpl } = await import("./admin-users.server");
    await assertAdmin(context.supabase, context.userId);
    return inviteUserImpl(data);
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
    const { assertAdmin, createUserImpl } = await import("./admin-users.server");
    await assertAdmin(context.supabase, context.userId);
    return createUserImpl(data);
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
    const { assertAdmin, updateUserImpl } = await import("./admin-users.server");
    await assertAdmin(context.supabase, context.userId);
    return updateUserImpl(data);
  });

export const setAdminUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; grant: boolean }) =>
    z.object({ userId: z.string().uuid(), grant: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, setUserRoleImpl } = await import("./admin-users.server");
    await assertAdmin(context.supabase, context.userId);
    return setUserRoleImpl(data, context.userId);
  });

export const sendAdminPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) =>
    z.object({ email: z.string().email().max(320) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, sendPasswordResetImpl } = await import("./admin-users.server");
    await assertAdmin(context.supabase, context.userId);
    return sendPasswordResetImpl(data);
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, deleteUserImpl } = await import("./admin-users.server");
    await assertAdmin(context.supabase, context.userId);
    return deleteUserImpl(data, context.userId);
  });
