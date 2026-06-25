import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { trackVisit } from "@/lib/track-visit";

export function VisitorTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      trackVisit(pathname, data.user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
