import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryInput } from "@/components/ui/country-input";
import { COUNTRIES } from "@/lib/countries";
import { saveProfile } from "@/lib/profile.functions";

const COUNTRY_SET = new Set(COUNTRIES.map((c) => c.toLowerCase()));

const profileFormSchema = z.object({
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
    .max(80, "Country must be under 80 characters")
    .refine((c) => COUNTRY_SET.has(c.toLowerCase()), "Please select a country from the list"),
});

const searchSchema = z.object({
  next: z.string().optional().catch(undefined),
});


export const Route = createFileRoute("/complete-profile")({
  head: () => ({
    meta: [
      { title: "Complete your profile — Astralnaut Studios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: CompleteProfilePage,
});

function CompleteProfilePage() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const save = useServerFn(saveProfile);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [errors, setErrors] = useState<{ fullName?: string; city?: string; country?: string }>({});


  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        const next = search.next || "/";
        nav({ to: "/login", search: { next } });
        return;
      }
      if (!userRes.user.email_confirmed_at) {
        const next = search.next || "/";
        window.location.assign(`/verify-email?next=${encodeURIComponent(next)}`);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, city, country")
        .eq("id", userRes.user.id)
        .maybeSingle();
      if (prof) {
        setFullName(prof.full_name ?? "");
        setCity(prof.city ?? "");
        setCountry(prof.country ?? "");
        if (prof.full_name && prof.city && prof.country && search.next) {
          window.location.replace(search.next);
          return;
        }

      }
      setLoading(false);
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileFormSchema.safeParse({ fullName, city, country });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const iss of parsed.error.issues) {
        const key = iss.path[0] as keyof typeof errors;
        if (key && !fieldErrors[key]) fieldErrors[key] = iss.message;
      }
      setErrors(fieldErrors);
      toast.error(parsed.error.issues[0]?.message ?? "Please fix the errors and try again.");
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await save({ data: parsed.data });
      toast.success("Profile saved.");
      const dest = search.next || "/";
      window.location.assign(dest);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Complete your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We need a few details before you can access the free previews.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} aria-invalid={!!errors.fullName} />
            {errors.fullName ? <p className="mt-1 text-xs text-destructive">{errors.fullName}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" required autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} aria-invalid={!!errors.city} />
              {errors.city ? <p className="mt-1 text-xs text-destructive">{errors.city}</p> : null}
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <CountryInput id="country" required value={country} onChange={(e) => setCountry(e.target.value)} aria-invalid={!!errors.country} />
              {errors.country ? <p className="mt-1 text-xs text-destructive">{errors.country}</p> : null}
            </div>
          </div>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Saving…" : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
