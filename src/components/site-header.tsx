import { Link } from "@tanstack/react-router";
import logo from "@/assets/astralnaut-logo.png";

const nav = [
  { to: "/battlefield-atlantis", label: "Battlefield Atlantis" },
  { to: "/children-of-aquarius", label: "Children of Aquarius" },
  { to: "/darker-ages", label: "Darker Ages" },
  { to: "/pricing", label: "Pricing" },
  { to: "/industry", label: "Industry" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(2,0,12,0.7)", borderBottom: "1px solid var(--border-line)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Astralnaut Studios" className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <div className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>Astralnaut Studios</div>
            <div className="text-sm font-extrabold tracking-tight" style={{ color: "var(--ink)" }}>Real World Comics</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--ink2)] hover:bg-white/5 hover:text-[var(--neon)]" activeProps={{ className: "text-[var(--neon)]" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm font-semibold text-[var(--ink2)] hover:text-[var(--neon)]">Sign in</Link>
          <Link to="/pricing" className="btn-cta text-sm">Subscribe</Link>
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
          { to: "/login", label: "Sign in" },
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
          <li key={l.to}><Link to={l.to} className="text-sm text-[var(--mute)] hover:text-[var(--neon)]">{l.label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
