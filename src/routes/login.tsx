import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryInput } from "@/components/ui/country-input";
import { isValidCountry } from "@/lib/countries";

import { LEGAL_CONFIG } from "@/config/legal";
import { recordSignupConsent } from "@/lib/consent.functions";
import { rememberReturnTo, consumeReturnTo, peekReturnTo, clearReturnTo } from "@/lib/return-to";
import logo from "@/assets/astralnaut-logo.png";

// Persist the exact clickwrap text so the SIGNED_IN handler in __root can
// record it against the newly-created account even for OAuth / email-confirm
// flows where the session doesn't exist at button-press time.
const PENDING_KEY = "pending_signup_consent_v1";
function stashPendingConsent() {
  try { localStorage.setItem(PENDING_KEY, LEGAL_CONFIG.clickwrap.signup); } catch {}
}


// Supabase provisions an `auth.users` row for any Google identity it has not
// seen before — `signInWithOAuth` has no "no such account" path. A visitor who
// clicks "Continue with Google" from the *Sign in* tab with an address that has
// never registered therefore gets a brand-new, empty account instead of an
// error, and lands in a signed-in-but-unfamiliar site with no explanation.
// We cannot stop the row being created from the client (it happens server-side,
// before the browser regains control), so we detect it on return and make the
// visitor confirm. Anything created inside this window by *this* round-trip is
// treated as freshly provisioned.
const NEW_ACCOUNT_WINDOW_MS = 2 * 60 * 1000;

const searchSchema = z.object({
  next: z.string().optional().catch(undefined),
  plan: z.enum(["reader", "initiate", "patron"]).optional().catch(undefined),
  interval: z.enum(["monthly", "yearly"]).optional().catch(undefined),
  oauth: z.string().optional().catch(undefined),
  // Which tab the OAuth round-trip started from. Carried through `redirectTo`
  // because the component remounts on the way back and local state is lost.
  mode: z.enum(["signin", "signup"]).optional().catch(undefined),
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
  const [mode, setMode] = useState<"signin" | "signup">(
    search.mode ?? (search.plan ? "signup" : "signin"),
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  // Set when a Sign-in-tab Google click provisioned a brand-new account. Holds
  // the confirm step open instead of routing the visitor on.
  const [pendingSignup, setPendingSignup] = useState<{ email: string; userId: string } | null>(null);

  // Where to send the user after successful auth.
  // If they came with a plan, take them straight back to /pricing with
  // autocheckout=1 so the checkout modal opens immediately.
  // Admins always land in /admin; everyone else lands on /account or the
  // `next` path they were originally trying to reach.
  const successDestination = async (userId?: string) => {
    if (search.plan) {
      const params = new URLSearchParams({
        plan: search.plan,
        ...(search.interval ? { interval: search.interval } : {}),
        autocheckout: "1",
      });
      return `/pricing?${params.toString()}`;
    }
    // Preserve the page the user was on before the auth gate — this wins
    // over role-based defaults so intended destinations survive the round-trip
    // through /login → /verify-email → /complete-profile. We check `search.next`
    // first (fresh URL param), then fall back to sessionStorage which persists
    // across OAuth redirects and email-confirmation links.
    if (search.next) return search.next;
    const stored = consumeReturnTo();
    if (stored) return stored;
    if (userId) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!error && data) return "/admin";
    }
    return "/";
  };

  // Mirror any `?next=` param into sessionStorage on arrival so it survives
  // the email-confirmation click (which lands on a fresh URL without params).
  useEffect(() => {
    if (search.next) rememberReturnTo(search.next);
  }, [search.next]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !ageConfirmed) {
      toast.error("Please review and accept the account terms to continue.");
      return;
    }
    if (mode === "signup" && (!fullName.trim() || !city.trim() || !country.trim())) {
      toast.error("Please provide your full name, city, and country.");
      return;
    }
    if (mode === "signup" && !isValidCountry(country)) {
      toast.error("Please select a country from the list.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        stashPendingConsent();
        const dest = await successDestination();
        const verifyUrl = `/verify-email?next=${encodeURIComponent(dest)}&email=${encodeURIComponent(email)}`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + verifyUrl,
            data: {
              full_name: fullName.trim(),
              city: city.trim(),
              country: country.trim(),
            },
          },
        });
        if (error) throw error;
        // If confirmation is disabled the session exists immediately; record now.
        if (data.session) {
          try {
            await recordSignupConsent({ data: { consentText: LEGAL_CONFIG.clickwrap.signup } });
            localStorage.removeItem(PENDING_KEY);
          } catch { /* Root SIGNED_IN handler will retry */ }
          // Ensure profile row has the details even if the trigger missed a field.
          try {
            await supabase.from("profiles").upsert({
              id: data.session.user.id,
              email,
              full_name: fullName.trim(),
              city: city.trim(),
              country: country.trim(),
            });
          } catch { /* non-fatal */ }
        }
        toast.success("Check your email to confirm your account.");
        clearReturnTo();
        window.location.assign(verifyUrl);
      } else {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!signInData.user?.email_confirmed_at) {
          toast.info("Please verify your email to continue.");
          const dest = await successDestination(signInData.user?.id);
          clearReturnTo();
          window.location.assign(
            `/verify-email?next=${encodeURIComponent(dest)}&email=${encodeURIComponent(email)}`,
          );
          return;
        }
        toast.success("Welcome back.");
        const dest = await successDestination(signInData.user?.id);
        clearReturnTo();
        window.location.assign(dest);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (mode === "signup" && !ageConfirmed) {
      toast.error("Please review and accept the account terms to continue.");
      return;
    }
    if (mode === "signup") stashPendingConsent();
    setBusy(true);
    try {
      const oauthReturnParams = new URLSearchParams({ oauth: "1", mode });
      if (search.next) oauthReturnParams.set("next", search.next);
      if (search.plan) {
        oauthReturnParams.set("plan", search.plan);
        if (search.interval) oauthReturnParams.set("interval", search.interval);
      }
      // Native Supabase OAuth. Supabase redirects the browser to Google and
      // returns to `redirectTo` with a PKCE `code`, which the client exchanges
      // automatically (detectSessionInUrl) — the `oauth=1` effect below then
      // routes the user on. `redirectTo` must be allow-listed in the Supabase
      // dashboard under Authentication -> URL Configuration.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login?${oauthReturnParams.toString()}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  };

  // OAuth flows return to /login?oauth=1. Once the session is present, route
  // admins to /admin and everyone else to /account (or their original `next`).
  useEffect(() => {
    if (search.oauth !== "1") return;
    let cancelled = false;
    const finish = async (user: { id: string; email?: string; created_at: string }) => {
      // Guard against silent auto-provisioning: if this round-trip started on
      // the Sign in tab but Supabase handed us an account that did not exist a
      // moment ago, the visitor asked to sign in and got a signup instead.
      // Hold them at a confirm step rather than routing them into an empty
      // account they never agreed to create.
      const createdMsAgo = Date.now() - Date.parse(user.created_at);
      const justProvisioned =
        Number.isFinite(createdMsAgo) && createdMsAgo >= 0 && createdMsAgo < NEW_ACCOUNT_WINDOW_MS;
      if (search.mode === "signin" && justProvisioned) {
        if (!cancelled) {
          setPendingSignup({ email: user.email ?? "", userId: user.id });
          setBusy(false);
        }
        return;
      }
      const dest = await successDestination(user.id);
      clearReturnTo();
      if (!cancelled) window.location.assign(dest);
    };
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !cancelled) void finish(data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !cancelled) {
        void finish(session.user);
      }
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [search.oauth, search.mode]);

  // "Yes, create the account" on the confirm step. The row already exists —
  // what we record here is the consent that the Sign in tab never collected.
  const confirmNewAccount = async () => {
    if (!pendingSignup) return;
    if (!ageConfirmed) {
      toast.error("Please review and accept the account terms to continue.");
      return;
    }
    setBusy(true);
    try {
      try {
        await recordSignupConsent({ data: { consentText: LEGAL_CONFIG.clickwrap.signup } });
        localStorage.removeItem(PENDING_KEY);
      } catch {
        // Leave it for the root SIGNED_IN handler to retry.
        stashPendingConsent();
      }
      const dest = await successDestination(pendingSignup.userId);
      clearReturnTo();
      window.location.assign(dest);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  };

  // "That's not me" on the confirm step. Signs the session out and returns to a
  // clean Sign in tab. Note the auth.users row Supabase created stays behind —
  // removing it needs the service role, which the browser does not have.
  const cancelNewAccount = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
    } catch {
      /* non-fatal — we are navigating away regardless */
    }
    clearReturnTo();
    window.location.assign("/login");
  };

  const planLabel = search.plan
    ? `${search.plan[0].toUpperCase()}${search.plan.slice(1)}`
    : null;

  if (pendingSignup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Link to="/" className="mb-2 flex items-center gap-3">
          <img src={logo} alt="Astralnaut Studios" className="h-10 w-auto" />
        </Link>
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--neon)]">
            One more step
          </div>
          <h1 className="mt-2 text-2xl font-bold">Create your account?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You signed in with Google as{" "}
            <span className="font-medium text-foreground">{pendingSignup.email}</span>, but there's
            no Astralnaut Studios account for that address yet. Confirm below to create one, or go
            back and use the address you originally registered with.
          </p>

          <label
            className="mt-5 flex items-start gap-2 text-xs text-muted-foreground"
            htmlFor="oauth-clickwrap"
          >
            <input
              id="oauth-clickwrap"
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-0.5"
              required
              aria-required
            />
            <span>
              {LEGAL_CONFIG.clickwrap.signup} (
              <Link to="/terms" target="_blank" rel="noopener" className="underline">Terms</Link>,{" "}
              <Link to="/privacy" target="_blank" rel="noopener" className="underline">Privacy</Link>)
            </span>
          </label>

          <Button onClick={confirmNewAccount} disabled={busy} className="mt-5 w-full">
            Create my account
          </Button>
          <Button
            onClick={cancelNewAccount}
            disabled={busy}
            variant="outline"
            className="mt-2 w-full"
          >
            That's not me — use a different account
          </Button>
        </div>
      </div>
    );
  }

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
              Sign in to read free previews, track your standing, and unlock subscriber perks.
            </p>
            {(search.next || peekReturnTo()) && search.oauth !== "1" && (
              <p className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--neon)]/20 bg-[var(--neon)]/5 px-3 py-2 text-xs text-[var(--neon)]">
                <span aria-hidden>↩</span>
                After signing in, you'll be redirected back to the page you came from.
              </p>
            )}
          </>
        )}

        <Button onClick={handleGoogle} disabled={busy} variant="outline" className="mt-6 w-full">
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" type="text" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" type="text" required autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <CountryInput id="country" required value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>
            </>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {mode === "signup" && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground" htmlFor="signup-clickwrap">
              <input
                id="signup-clickwrap"
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5"
                required
                aria-required
              />
              <span>
                {LEGAL_CONFIG.clickwrap.signup} (
                <Link to="/terms" target="_blank" rel="noopener" className="underline">Terms</Link>,{" "}
                <Link to="/privacy" target="_blank" rel="noopener" className="underline">Privacy</Link>)
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
