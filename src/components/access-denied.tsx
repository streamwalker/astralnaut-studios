import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  /** Short name of the restricted area (e.g. "Admin dashboard", "Security console"). */
  area?: string;
  /** Email of the currently signed-in user, if known. */
  email?: string | null;
  /** Optional extra explanation shown under the standard message. */
  detail?: string;
};

/**
 * Friendly "access denied" screen for admin-only routes.
 * Explains why access is blocked and points readers to the surfaces
 * they can actually use (account, library, pricing).
 */
export function AccessDenied({ area = "This page", email, detail }: Props) {
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--gold)]/30 bg-card p-8 text-center shadow-[0_0_40px_rgba(255,184,64,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-[rgba(255,184,64,0.08)]">
          <ShieldAlert className="h-7 w-7 text-[var(--gold)]" aria-hidden="true" />
        </div>
        <div className="mt-5 text-[10px] font-bold uppercase tracking-[3px] text-[var(--gold)]">
          Access denied
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-tight">
          {area} is admin-only
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You're signed in{email ? <> as <span className="font-semibold text-foreground">{email}</span></> : null},
          but this area is limited to staff administrators who manage the catalog,
          subscribers, and site security.
          {detail ? <> {detail}</> : null}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your reader account is active — you can keep exploring the library and free previews below.
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <Link
            to="/account"
            className="rounded-md border border-[var(--neon)]/50 px-3 py-2 text-xs font-bold uppercase tracking-[2px] text-[var(--neon)] hover:bg-[var(--neon)]/10"
          >
            Your account
          </Link>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-xs font-bold uppercase tracking-[2px] text-muted-foreground hover:text-foreground"
          >
            Browse library
          </Link>
          <Link
            to="/pricing"
            className="rounded-md border border-border px-3 py-2 text-xs font-bold uppercase tracking-[2px] text-muted-foreground hover:text-foreground"
          >
            View plans
          </Link>
        </div>

        <div className="mt-6 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          Think this is a mistake? Contact{" "}
          <a href="mailto:support@astralnautstudios.com" className="text-[var(--neon)] hover:underline">
            support@astralnautstudios.com
          </a>
          .
        </div>

        <Button onClick={signOut} variant="ghost" size="sm" className="mt-3 text-xs text-muted-foreground">
          Sign out and switch account
        </Button>
      </div>
    </div>
  );
}
