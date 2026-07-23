import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { COUNTRIES } from "./countries";

const COUNTRY_SET = new Set(COUNTRIES.map((c) => c.toLowerCase()));

const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be under 100 characters")
    .regex(/^[\p{L}\p{M}\s'.\-]+$/u, "Full name contains invalid characters"),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(100, "City must be under 100 characters")
    .regex(/^[\p{L}\p{M}\s'.\-,]+$/u, "City contains invalid characters"),
  country: z
    .string()
    .trim()
    .min(1, "Country is required")
    .max(80, "Country must be under 80 characters")
    .refine((c) => COUNTRY_SET.has(c.toLowerCase()), "Please select a country from the list"),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProfileInput) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    // Canonicalize country to the casing in our list.
    const canonical =
      COUNTRIES.find((c) => c.toLowerCase() === data.country.toLowerCase()) ?? data.country;
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      email: (claims as { email?: string } | null)?.email ?? null,
      full_name: data.fullName,
      city: data.city,
      country: canonical,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
