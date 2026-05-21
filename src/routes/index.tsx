import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import logo from "@/assets/astralnaut-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Astralnaut Studios — The next page only drops here" },
      { name: "description", content: "Five new pages a week. Motion-enhanced art. Creator commentary. Netflix for comics." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at 70% 30%, oklch(0.35 0.18 290 / 0.5), transparent 60%), radial-gradient(ellipse at 20% 80%, oklch(0.3 0.16 230 / 0.4), transparent 55%)",
          }}
        />
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-2 md:py-32">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--cyan-glow)]">
              ⚡ New episodes every week · Netflix for comics
            </p>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
              The next page<br />only drops here.
            </h1>
            <p className="mt-6 max-w-lg text-base text-muted-foreground md:text-lg">
              Five new pages a week. Motion-enhanced art. Creator commentary. Subscriber-only
              votes that change the canon. Real prizes for real readers —{" "}
              <span className="font-semibold text-[var(--gold)]">
                PlayStation 5 unlocks at 1,000 subscribers.
              </span>
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/reader"
                className="rounded-md px-5 py-3 text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-cta)" }}
              >
                ▶ Read the first act free
              </Link>
              <Link
                to="/pricing"
                className="rounded-md border border-border bg-card/60 px-5 py-3 text-sm font-semibold text-foreground hover:bg-card"
              >
                See pricing
              </Link>
            </div>
            <div className="mt-12 flex gap-10 text-[var(--gold)]">
              <Stat n="624" label="Subscribers" />
              <Stat n="3" label="Series live" />
              <Stat n="52" label="Pages so far" />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img src={logo} alt="Astralnaut Studios" className="w-full max-w-md drop-shadow-[0_0_60px_rgba(120,180,255,0.35)]" />
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold">{n}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    </div>
  );
}
