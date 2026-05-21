import { Link } from "@tanstack/react-router";
import logo from "@/assets/astralnaut-logo.png";

const navItems = [
  { to: "/library", label: "Library" },
  { to: "/characters", label: "Characters" },
  { to: "/reader", label: "Reader" },
  { to: "/community", label: "Community" },
  { to: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Astralnaut Studios" className="h-9 w-auto" />
          <span className="hidden text-sm font-semibold tracking-[0.18em] text-foreground sm:inline">
            ASTRALNAUT STUDIOS
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to as never}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-[var(--gold)] font-medium" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-foreground hover:text-[var(--cyan-glow)]">
            Sign in
          </Link>
          <Link
            to="/login"
            className="rounded-md px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02]"
            style={{ background: "var(--gradient-cta)" }}
          >
            Start reading →
          </Link>
        </div>
      </div>
    </header>
  );
}
