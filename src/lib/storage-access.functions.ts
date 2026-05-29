import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


const ClientInputSchema = z.object({
  paths: z.array(z.string().min(1).max(500)).min(1).max(20),
  bucket: z.string().min(1).max(64).default("comic-pages"),
  comicId: z.string().uuid().nullable().optional(),
  isFree: z.boolean().nullable().optional(),
});

/**
 * Authenticated client-callable server function. The caller's user_id is
 * derived from the auth context — clients cannot spoof another user's id.
 */
export const logStorageAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ClientInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    return recordStorageAccess({
      paths: data.paths,
      bucket: data.bucket,
      userId: context.userId,
      comicId: data.comicId ?? null,
      isFree: data.isFree ?? null,
    });
  });
