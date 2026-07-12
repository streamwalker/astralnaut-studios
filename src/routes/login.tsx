import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEGAL_CONFIG } from "@/config/legal";
import { recordSignupConsent } from "@/lib/consent.functions";
import logo from "@/assets/astralnaut-logo.png";

// Persist the exact clickwrap text so the SIGNED_IN handler in __root can
// record it against the newly-created account even for OAuth / email-confirm
// flows where the session doesn't exist at button-press time.
const PENDING_KEY = "pending_signup_consent_v1";
function stashPendingConsent() {
  try { localStorage.setItem(PENDING_KEY, LEGAL_CONFIG.clickwrap.signup); } catch {}
}


const searchSchema = z.object({
  next: z.string().optional().catch(undefined),
  plan: z.enum(["reader", "initiate", "patron"]).optional().catch(undefined),
  interval: z.enum(["monthly", "yearly"]).optional().catch(undefined),
});

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Astralnaut Studios" }] }),
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const search = Route.useSearch();
  // Default to sign-up when arriving with a selected plan — these visitors
  // came from a "Start Reader · $4.99/mo" CTA, not an existing-account prompt.
  const [mode, setMode] = useState<"signin" | "signup">(search.plan ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Where to send the user after successful auth.
  // If they came with a plan, take them straight back to /pricing with
  // autocheckout=1 so the checkout modal opens immediately.
  const successDestination = () => {
    if (search.plan) {
      const params = new URLSearchParams({
        plan: search.plan,
        ...(search.interval ? { interval: search.interval } : {}),
        autocheckout: "1",
      });
      return `/pricing?${params.toString()}`;
    }
    return search.next || "/admin";
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !ageConfirmed) {
      toast.error("You must confirm you are 18 or older to create an account.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + successDestination() },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        window.location.assign(successDestination());
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (mode === "signup" && !ageConfirmed) {
      toast.error("You must confirm you are 18 or older to create an account.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + successDestination(),
      });
      if (error) throw error;
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  };

  const planLabel = search.plan
    ? `${search.plan[0].toUpperCase()}${search.plan.slice(1)}`
    : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link to="/" className="mb-2 flex items-center gap-3">
        <img src={logo} alt="Astralnaut Studios" className="h-10 w-auto" />
      </Link>
      <Link to="/" className="mb-6 text-sm text-muted-foreground hover:text-foreground">
        ← Home
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        {planLabel ? (
          <>
            <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--neon)]">
              Continue to checkout · {planLabel}
            </div>
            <h1 className="mt-2 text-2xl font-bold">
              {mode === "signup" ? "Create your account" : "Sign in"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quick account creation. We'll take you straight to checkout next.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Admin access for Astralnaut Studios.
            </p>
          </>
        )}

        <Button onClick={handleGoogle} disabled={busy} variant="outline" className="mt-6 w-full">
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {mode === "signup" && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5"
                required
              />
              <span>
                I confirm I am 18 years of age or older. Accounts, subscriptions, store purchases,
                Milestone Sweepstakes entry, community/Discord participation, and cameo submissions are
                restricted to adults 18+.
              </span>
            </label>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
