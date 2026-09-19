import { ConfirmButton } from "@/components/admin/confirm-button";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/hooks/useAdminSession";
import { TierBadge } from "@/components/TierGate";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CartDrawer } from "@/components/cart-drawer";
import { PromoBar } from "@/components/promo-bar";
import { UserRound, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import astralnautLogo from "@/assets/astralnaut-studios-logo.png";
import rwcLogo from "@/assets/real-world-comics-logo-transparent.png";

type NavItem = { to: string; label: string; exact?: boolean; accent?: boolean; params?: Record<string, string>; tour?: string };
const nav: NavItem[] = [
  { to: "/", label: "Library", exact: true, tour: "nav-library" },
  { to: "/reader/$series/$issue", label: "Reader", params: { series: "battlefield-atlantis", issue: "1" }, tour: "nav-reader" },
  { to: "/shop", label: "Shop" },
  { to: "/perks", label: "Perks" },
  { to: "/pricing", label: "Pricing", tour: "nav-pricing" },
  { to: "/help", label: "Help", tour: "nav-help" },
  { to: "/industry", label: "For Industry", accent: true },
];

export function SiteHeader() {
  const { data } = useAdminSession();
  const isAdmin = !!data?.isAdmin;
  const nav_ = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    nav_({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(2,0,12,0.7)", borderBottom: "1px solid var(--border-line)", paddingTop: "env(safe-area-inset-top)", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
      <PromoBar />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-6 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Astralnaut Studios — Real World Comics">
            <img
              src={astralnautLogo}
              alt="Astralnaut Studios"
              width={160}
              height={80}
              className="h-8 w-auto shrink-0 sm:h-10"
              decoding="async"
              fetchPriority="high"
              style={{ filter: "drop-shadow(0 0 12px rgba(34,211,255,0.35))" }}
            />
            <span aria-hidden className="hidden h-7 w-px bg-white/15 sm:block" />
            <img
              src={rwcLogo}
              alt="Real World Comics"
              width={160}
              height={90}
              className="hidden h-7 w-auto shrink-0 sm:block md:h-8"
              decoding="async"
              loading="lazy"
              style={{ filter: "drop-shadow(0 0 10px rgba(34,211,255,0.3))" }}
            />
          </Link>
        </div>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {nav.map((n, i) => {
            const linkProps = n.params
              ? { to: n.to as "/reader/$series/$issue", params: n.params as { series: string; issue: string } }
              : { to: n.to };
            return (
              <Link
                key={`${n.label}-${i}`}
                {...(linkProps as { to: string })}
                data-tour={n.tour}
                className={`whitespace-nowrap rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5 hover:text-[var(--neon)] ${n.accent ? "text-[var(--gold)]" : "text-[var(--ink2)]"}`}
                activeProps={{ className: "!text-[var(--neon)]" }}
                activeOptions={n.exact ? { exact: true } : undefined}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <CartDrawer />
          <TierBadge />
          {data?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label={isAdmin ? "Open admin account menu" : "Open account menu"}
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-line)] px-3 text-sm font-semibold hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[var(--neon)]">
                  <UserRound className="h-4 w-4" aria-hidden />
                  <span className="hidden xl:inline">{isAdmin ? "Admin" : "Account"}</span>
                  <ChevronDown className="h-3 w-3" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>{isAdmin ? "Admin account" : "Your account"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/account" data-tour="nav-account" className="min-h-11">Account & subscription</Link></DropdownMenuItem>
                {isAdmin && <DropdownMenuItem asChild><Link to="/admin" className="min-h-11">Admin dashboard</Link></DropdownMenuItem>}
                <DropdownMenuItem asChild><Link to="/perks" className="min-h-11">Your perks</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <ConfirmButton
                  trigger={<DropdownMenuItem className="min-h-11" onSelect={(event) => event.preventDefault()}>Sign out</DropdownMenuItem>}
                  title="Sign out?"
                  description="You'll leave your session and return to the library."
                  confirmLabel="Sign out"
                  onConfirm={signOut}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" data-tour="nav-account" className="inline-flex min-h-11 items-center whitespace-nowrap px-2 text-sm font-semibold text-[var(--ink2)] hover:text-[var(--neon)]">Sign in</Link>
          )}
          <Link to="/reader/$series/$issue" params={{ series: "battlefield-atlantis", issue: "1" }} className="btn-cta hidden whitespace-nowrap text-sm xl:inline-flex">
            Start reading →
          </Link>
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
          <div className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>Astralnaut Studios</div>
          <p className="mt-2 text-sm text-[var(--mute)]">The next page only drops here. Built for readers, not pirates.</p>
        </div>
        <FooterCol title="Series" links={[
          { to: "/battlefield-atlantis", label: "Battlefield Atlantis" },
          { to: "/children-of-aquarius", label: "Children of Aquarius" },
          { to: "/darker-ages", label: "Darker Ages" },
        ]} />
        <FooterCol title="Platform" links={[
          { to: "/shop", label: "Shop" },
          { to: "/pricing", label: "Pricing" },
          { to: "/perks", label: "Your perks" },
          { to: "/account", label: "Your account" },
          { to: "/login", label: "Sign in" },
          { to: "/help", label: "Help Center" },
          { to: "/learn", label: "Training course" },
          { to: "/industry", label: "Adaptation rights" },
        ]} />
        <FooterCol title="Legal" links={[
          { to: "/terms", label: "Terms of Service" },
          { to: "/subscription-policy", label: "Subscription & Billing" },
          { to: "/privacy", label: "Privacy Policy" },
          { to: "/cookies", label: "Cookie Policy" },
          { to: "/community-guidelines", label: "Community Guidelines" },
          { to: "/copyright-dmca", label: "Copyright / DMCA" },
          { to: "/sweepstakes/rules", label: "Sweepstakes Rules" },
          { to: "/canon-cameo-terms", label: "Canon & Cameo Terms" },
          { to: "/unsolicited-submissions", label: "Unsolicited Submissions" },
          { to: "/content-accessibility", label: "Content & Accessibility" },
          { to: "/shipping-returns", label: "Shipping & Returns" },
          { to: "/subprocessors", label: "Subprocessors" },
          { to: "/corporate", label: "Corporate" },
          { to: "/dsar", label: "Your Privacy Rights" },
          { to: "/trust", label: "Trust Center" },
        ]} />
      </div>
      <div className="mx-auto mt-10 max-w-7xl px-6">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--mute)]">
          <a href="/.well-known/security.txt" className="hover:text-[var(--neon)]">security.txt</a>
        </div>
        <div className="mt-4 text-xs leading-relaxed text-[var(--fg-muted)]">
          © {new Date().getFullYear()} Streamwalkers Corporation. All rights reserved. Astralnaut Studios and Real World Comics are imprints of Streamwalkers Corporation.
        </div>
      </div>
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
