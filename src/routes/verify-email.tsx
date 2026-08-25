import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { consumeReturnTo, peekReturnTo, clearReturnTo } from "@/lib/return-to";
import { trackMetaEventOnce } from "@/lib/meta-pixel";
import logo from "@/assets/astralnaut-logo.png";

// A confirmed email is the point Meta should count as the registration: the
// double opt-in means an unverified signup may never become a reader, so
// firing at account creation would optimize the ads toward dead addresses.
//
// Guarded twice, because this route is reachable at any time by someone who
// verified long ago: trackMetaEventOnce dedupes within a session, and the
// freshness window below rejects a revisit that is not the actual moment of
// confirmation.
const REGISTRATION_FRESH_MS = 10 * 60 * 1000;

function reportRegistration(user: { id: string; email_confirmed_at?: string | null }): void {
  const confirmedAt = user.email_confirmed_at ? Date.parse(user.email_confirmed_at) : NaN;
  if (!Number.isFinite(confirmedAt)) return;
  if (Date.now() - confirmedAt > REGISTRATION_FRESH_MS) return;
  // eventID lets a future Conversions API send of the same signup dedupe
  // against this browser event. trackMetaEventOnce self-checks consent.
  trackMetaEventOnce(user.id, "CompleteRegistration", {}, { eventID: user.id });
}

const searchSchema = z.object({
  next: z.string().optional().catch(undefined),
  email: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify your email — Astralnaut Studios" },
      { name: "description", content: "Confirm your email address to unlock free comic previews on Astralnaut Studios." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { next, email: emailParam } = Route.useSearch();
  const nav = useNavigate();
  const [email, setEmail] = useState(emailParam ?? "");
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  // Confirmation links land on a fresh URL without the `?next=` param — fall
  // back to the sessionStorage-persisted return path so users still resume
  // to the exact page they originally requested.
  const resolveDest = () => next || peekReturnTo() || "/account";
  const goDest = () => {
    const dest = consumeReturnTo() || next || "/account";
    clearReturnTo();
    window.location.replace(dest);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user?.email) setEmail((prev: string) => prev || data.user!.email!);
      if (data.user?.email_confirmed_at) {
        // Order is load-bearing: goDest() calls location.replace(), so the
        // pixel request must be dispatched before the page starts unloading.
        reportRegistration(data.user);
        goDest();
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) {
        reportRegistration(session.user);
        goDest();
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [next]);

  const recheck = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (data.user?.email_confirmed_at) {
        toast.success("Email verified.");
        reportRegistration(data.user);
        goDest();
      } else {
        toast.info("Still waiting on confirmation. Check your inbox (and spam folder).");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    if (!email) {
      toast.error("Enter the email address you signed up with.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo:
            window.location.origin + `/verify-email?next=${encodeURIComponent(resolveDest())}`,
        },
      });
      if (error) throw error;
      toast.success("Verification email sent. Check your inbox.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setResending(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link to="/" className="mb-2 flex items-center gap-3">
        <img src={logo} alt="Astralnaut Studios" className="h-10 w-auto" />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to
          {email ? <> <span className="font-medium text-foreground">{email}</span>.</> : " your inbox."}{" "}
          Click the link to unlock free comic previews. This page will unlock automatically once you confirm.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={recheck} disabled={checking}>
            {checking ? "Checking…" : "I've confirmed — continue"}
          </Button>
          <Button variant="outline" onClick={resend} disabled={resending}>
            {resending ? "Sending…" : "Resend verification email"}
          </Button>
          <button
            type="button"
            onClick={signOut}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Use a different email
          </button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Didn't get it? Check your spam folder, or resend above. Confirmation links expire after a short time.
        </p>
      </div>
    </div>
  );
}
