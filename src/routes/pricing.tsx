import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

const tiers = [
  { name: "Reader", price: 4.99, day: "Thursday", offset: "0h ahead", perks: ["All series · all 20+ pages of every issue", "Forum access", "Canon voting power", "Motion-comic reader", "1 raffle entry per active week"], accent: "var(--ink2)" },
  { name: "Initiate", price: 9.99, day: "Wednesday", offset: "24h ahead", perks: ["Everything in Reader", "Pages drop 24 hours before Reader", "3 raffle entries per week", "Numbered digital variant covers", "Behind-the-scenes process content"], accent: "var(--neon)", highlight: true },
  { name: "Patron", price: 24.99, day: "Tuesday", offset: "48h ahead", perks: ["Everything in Initiate", "Pages drop 48 hours before Reader", "10 raffle entries per week", "Cameo eligibility — be drawn into an issue", "Quarterly signed physical print run", "Direct creator Discord access"], accent: "var(--plasma)" },
];

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Real World Comics" },
      { name: "description", content: "Three subscription tiers. Reader $4.99, Initiate $9.99, Patron $24.99 monthly. Tier-staggered weekly drops, raffles, canon voting." },
      { property: "og:title", content: "Real World Comics — Pricing" },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: tiers.map((t, i) => ({
          "@type": "Product",
          position: i + 1,
          name: `Real World Comics — ${t.name}`,
          offers: { "@type": "Offer", price: t.price, priceCurrency: "USD" },
        })),
      }),
    }],
  }),
  component: Pricing,
});

function Pricing() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="eyebrow">Three tiers · Cancel anytime</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">Subscribe to read every page.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--ink2)]">Free first-act pages always remain free. Pages 10+ of every issue release on a tier-staggered weekly cadence.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className="card-rwc relative p-7" style={t.highlight ? { borderColor: "var(--neon)" } : undefined}>
              {t.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[2px]" style={{ background: "var(--neon)", color: "#02000c" }}>Most popular</div>}
              <h2 className="eyebrow" style={{ color: t.accent }}>{t.name}</h2>
              <div className="mt-3 font-mono text-5xl font-black">${t.price}<span className="text-base font-bold text-[var(--mute)]">/mo</span></div>
              <div className="mt-2 text-sm text-[var(--mute)]">Reads {t.day} · {t.offset}</div>
              <ul className="mt-6 space-y-2 text-sm text-[var(--ink2)]">
                {t.perks.map((p) => <li key={p} className="flex gap-2"><span style={{ color: t.accent }}>◉</span>{p}</li>)}
              </ul>
              <Link to="/login" className="btn-cta mt-8 w-full justify-center">Start as {t.name}</Link>
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-xs text-[var(--mute)]">Subscriptions billed monthly. Tier-staggered drop schedule: Patron Tuesday · Initiate Wednesday · Reader Thursday.</p>
      </main>
      <SiteFooter />
    </>
  );
}
