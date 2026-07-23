import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryInput } from "@/components/ui/country-input";
import { isValidCountry } from "@/lib/countries";


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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        const next = search.next || "/";
        nav({ to: "/login", search: { next } });
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
    if (!fullName.trim() || !city.trim() || !country.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setBusy(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("Not signed in.");
      const { error } = await supabase.from("profiles").upsert({
        id: userRes.user.id,
        email: userRes.user.email,
        full_name: fullName.trim(),
        city: city.trim(),
        country: country.trim(),
      });
      if (error) throw error;
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
            <Input id="full_name" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" required autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" required autoComplete="country-name" value={country} onChange={(e) => setCountry(e.target.value)} />
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
