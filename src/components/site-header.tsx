import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import baLogo from "@/assets/battlefield-atlantis-logo.png";

type NavItem = { to: string; label: string; exact?: boolean; accent?: boolean; params?: Record<string, string>; tour?: string };
const nav: NavItem[] = [
  { to: "/", label: "Library", exact: true, tour: "nav-library" },
  { to: "/battlefield-atlantis", label: "Characters" },
  { to: "/reader/$series/$issue", label: "Reader", params: { series: "battlefield-atlantis", issue: "1" }, tour: "nav-reader" },
  { to: "/pricing", label: "Community" },
  { to: "/pricing", label: "Rewards" },
  { to: "/pricing", label: "Pricing", tour: "nav-pricing" },
  { to: "/help", label: "Help", tour: "nav-help" },
  { to: "/industry", label: "For Industry", accent: true },
];

function useAdminSession() {
  const qc = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: ["site-header-admin"] });
    });
    return () => subscription.unsubscribe();
  }, [qc]);

  return useQuery({
    queryKey: ["site-header-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

export function SiteHeader() {
  const { data } = useAdminSession();
  const isAdmin = !!data?.isAdmin;
  const nav_ = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    nav_({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(2,0,12,0.7)", borderBottom: "1px solid var(--border-line)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg"
            style={{
              background: "rgba(34,211,255,0.06)",
              border: "1px solid rgba(34,211,255,0.35)",
              boxShadow: "0 0 18px rgba(34,211,255,0.18) inset",
            }}
          >
            <img src={baLogo} alt="Battlefield Atlantis" className="h-9 w-9 object-contain" />
          </div>
          <div className="text-sm font-extrabold uppercase tracking-[3px]" style={{ color: "var(--ink)" }}>
            Astralnaut Studios
          </div>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n, i) => {
            const linkProps = n.params
              ? { to: n.to as "/reader/$series/$issue", params: n.params as { series: string; issue: string } }
              : { to: n.to };
            return (
              <Link
                key={`${n.label}-${i}`}
                {...(linkProps as { to: string })}
                className={`rounded-md px-3 py-2 text-sm font-medium hover:bg-white/5 hover:text-[var(--neon)] ${n.accent ? "text-[var(--gold)]" : "text-[var(--ink2)]"}`}
                activeProps={{ className: "!text-[var(--neon)]" }}
                activeOptions={n.exact ? { exact: true } : undefined}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <>
              <Link
                to="/admin"
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[2px]"
                style={{
                  color: "var(--gold)",
                  border: "1px solid var(--gold)",
                  background: "rgba(201, 168, 76, 0.08)",
                  boxShadow: "0 0 14px rgba(201, 168, 76, 0.25)",
                }}
                title="You are signed in as an admin"
              >
                <span
                  className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ background: "var(--gold)", boxShadow: "0 0 8px var(--gold)" }}
                />
                Admin Mode
              </Link>
              <button
                onClick={signOut}
                className="text-sm font-semibold text-[var(--ink2)] hover:text-[var(--neon)]"
              >
                Sign out
              </button>
            </>
          ) : data?.user ? (
            <Link to="/account" className="text-sm font-semibold text-[var(--ink2)] hover:text-[var(--neon)]">Account</Link>
          ) : (
            <Link to="/login" className="text-sm font-semibold text-[var(--ink2)] hover:text-[var(--neon)]">Sign in</Link>
          )}
          <Link to="/reader/$series/$issue" params={{ series: "battlefield-atlantis", issue: "1" }} className="btn-cta text-sm">Start reading →</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border-line)] py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>Astralnaut Studios LLC</div>
          <p className="mt-2 text-sm text-[var(--mute)]">The next page only drops here. Built for readers, not pirates.</p>
        </div>
        <FooterCol title="Series" links={[
          { to: "/battlefield-atlantis", label: "Battlefield Atlantis" },
          { to: "/children-of-aquarius", label: "Children of Aquarius" },
          { to: "/darker-ages", label: "Darker Ages" },
        ]} />
        <FooterCol title="Platform" links={[
          { to: "/pricing", label: "Pricing" },
          { to: "/account", label: "Your account" },
          { to: "/login", label: "Sign in" },
          { to: "/raffle/free-entry", label: "Free raffle entry" },
          { to: "/raffle/rules", label: "Raffle rules" },
        ]} />
        <FooterCol title="Studio" links={[
          { to: "/industry", label: "Adaptation rights" },
        ]} />
      </div>
      <div className="mx-auto mt-10 max-w-7xl px-6 text-xs text-[var(--fg-muted)]">© {new Date().getFullYear()} Astralnaut Studios LLC. All rights reserved.</div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-[2px] text-[var(--ink)]">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.to + l.label}><Link to={l.to} className="text-sm text-[var(--mute)] hover:text-[var(--neon)]">{l.label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
