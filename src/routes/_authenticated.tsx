import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { rememberReturnTo } from "@/lib/return-to";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const nextPath =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search + window.location.hash
        : undefined;
    const goLogin = () => {
      // Persist the intended destination in sessionStorage so it survives the
      // full auth round-trip (email confirmation link, OAuth provider redirect)
      // even if the `?next=` query param gets stripped somewhere.
      rememberReturnTo(nextPath);
      nav({ to: "/login", search: (nextPath && nextPath !== "/login" ? { next: nextPath } : {}) as never });
    };
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        goLogin();
      } else {
        setReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) goLogin();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [nav]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  return <Outlet />;
}
