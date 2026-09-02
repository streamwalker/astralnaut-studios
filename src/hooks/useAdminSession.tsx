import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * The signed-in user and whether they hold the `admin` role.
 *
 * Extracted from `site-header.tsx` when a second surface needed the same
 * answer. The query key is deliberately unchanged, so the header and any other
 * consumer share one cache entry and one round trip rather than each running
 * their own `user_roles` lookup on every render.
 *
 * This is a *display* check only. Anything an admin is allowed to see must also
 * be gated server-side with `has_role` — a client that lies here still gets
 * nothing back. See `getIssuePageMatrix`.
 */
export function useAdminSession() {
  const qc = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: ["site-header-admin"] });
    });
    return () => subscription.unsubscribe();
  }, [qc]);

  return useQuery({
    queryKey: ["site-header-admin"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { user: null, isAdmin: false };
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return { user, isAdmin: !!data };
    },
    staleTime: 60_000,
  });
}
