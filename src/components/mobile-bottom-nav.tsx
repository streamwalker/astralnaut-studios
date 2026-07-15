import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, ShoppingBag, Sparkles, Menu, BookMarked, User, X, DollarSign, HelpCircle, GraduationCap, Newspaper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

/**
 * MobileBottomNav
 * - Bottom tab bar shown only below lg (< 1024px).
 * - Includes safe-area padding for iOS home-indicator.
 * - "Menu" tab opens a right-side drawer with the full navigation.
 * Content areas should reserve space via the `pb-safe-nav` utility so the bar
 * never covers primary content.
 */

const tabs = [
  { to: "/", label: "Library", icon: BookOpen, exact: true },
  {
    to: "/reader/$series/$issue" as const,
    label: "Reader",
    icon: BookMarked,
    params: { series: "battlefield-atlantis", issue: "1" },
  },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/perks", label: "Perks", icon: Sparkles },
] as const;

function useAccountLink() {
  return useQuery({
    queryKey: ["mobile-nav-account"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ? { href: "/account", label: "Account" } : { href: "/login", label: "Sign in" };
    },
    staleTime: 60_000,
  });
}

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: acct } = useAccountLink();

  // Close drawer on any route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Hide the bar when we're inside the reader viewer to maximize page real estate.
  const hideOnReader = /^\/reader\//.test(pathname);

  const drawerLinks: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; params?: Record<string, string> }[] = [
    { to: "/", label: "Library", icon: BookOpen },
    { to: "/reader/$series/$issue", label: "Reader", icon: BookMarked, params: { series: "battlefield-atlantis", issue: "1" } },
    { to: "/shop", label: "Shop", icon: ShoppingBag },
    { to: "/perks", label: "Perks", icon: Sparkles },
    { to: "/pricing", label: "Pricing", icon: DollarSign },
    { to: "/help", label: "Help Center", icon: HelpCircle },
    { to: "/learn", label: "Training", icon: GraduationCap },
    { to: "/industry", label: "For Industry", icon: Newspaper },
    { to: acct?.href ?? "/login", label: acct?.label ?? "Sign in", icon: User },
  ];

  return (
    <>
      <nav
        aria-label="Primary"
        className={`fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md lg:hidden ${
          hideOnReader ? "hidden" : ""
        }`}
        style={{
          background: "rgba(2,0,12,0.92)",
          borderColor: "var(--border-line)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {tabs.map((t) => {
            const active = "exact" in t && t.exact ? pathname === t.to : pathname.startsWith(t.to.split("/$")[0]);
            const Icon = t.icon;
            const linkProps = "params" in t
              ? { to: t.to, params: t.params as { series: string; issue: string } }
              : { to: t.to };
            return (
              <li key={t.label}>
                <Link
                  {...(linkProps as { to: string })}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold uppercase tracking-[1.5px] transition-colors ${
                    active ? "text-[var(--neon)]" : "text-[var(--ink2)] hover:text-[var(--ink)]"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  <span>{t.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--ink2)] hover:text-[var(--ink)]"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" aria-hidden />
                  <span>Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[85vw] max-w-sm border-l p-0"
                style={{ background: "var(--bg2)", borderColor: "var(--border-line)" }}
              >
                <SheetHeader className="flex flex-row items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border-line)" }}>
                  <SheetTitle className="text-sm font-black uppercase tracking-[3px] text-[var(--ink)]">
                    Navigation
                  </SheetTitle>
                  <SheetClose asChild>
                    <button
                      type="button"
                      aria-label="Close menu"
                      className="grid h-9 w-9 place-items-center rounded-md text-[var(--ink2)] hover:bg-white/5 hover:text-[var(--ink)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </SheetClose>
                </SheetHeader>
                <ul className="flex flex-col py-2">
                  {drawerLinks.map((l) => {
                    const Icon = l.icon;
                    return (
                      <li key={l.label}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            const params = l.params;
                            if (params) {
                              navigate({ to: l.to as "/reader/$series/$issue", params: params as { series: string; issue: string } });
                            } else {
                              navigate({ to: l.to });
                            }
                          }}
                          className="flex w-full min-h-[52px] items-center gap-3 px-5 py-3 text-left text-sm font-semibold text-[var(--ink)] hover:bg-white/5"
                        >
                          <Icon className="h-4 w-4 text-[var(--ink2)]" aria-hidden />
                          {l.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  );
}
