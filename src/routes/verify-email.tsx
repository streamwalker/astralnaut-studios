import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/astralnaut-logo.png";

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

  // If already verified, bounce to destination.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user?.email) setEmail((prev) => prev || data.user!.email!);
      if (data.user?.email_confirmed_at) {
        window.location.replace(next || "/admin");
      }
    })();
    // Auth state updates the moment the user clicks the confirmation link
    // in a second tab and returns — recheck immediately.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) {
        window.location.replace(next || "/admin");
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
        window.location.replace(next || "/admin");
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
            window.location.origin + (next ? `/verify-email?next=${encodeURIComponent(next)}` : "/verify-email"),
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
