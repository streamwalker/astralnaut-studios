import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { supabase } from "@/integrations/supabase/client";
import { HelpTip } from "@/components/help/HelpTip";

type Tier = {
  key: "reader" | "initiate" | "patron";
  name: string;
  monthly: number;
  yearly: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  day: string;
  offset: string;
  perks: string[];
  accent: string;
  highlight?: boolean;
};

const tiers: Tier[] = [
  {
    key: "reader",
    name: "Reader",
    monthly: 4.99,
    yearly: 49.9,
    monthlyPriceId: "reader_monthly",
    yearlyPriceId: "reader_yearly",
    day: "Thursday",
    offset: "0h ahead",
    perks: [
      "All series · all 20+ pages of every issue",
      "Forum access",
      "Canon voting power",
      "Motion-comic reader",
      "1 raffle entry per active week",
    ],
    accent: "var(--ink2)",
  },
  {
    key: "initiate",
    name: "Initiate",
    monthly: 9.99,
    yearly: 99.9,
    monthlyPriceId: "initiate_monthly",
    yearlyPriceId: "initiate_yearly",
    day: "Wednesday",
    offset: "24h ahead",
    perks: [
      "Everything in Reader",
      "Pages drop 24 hours before Reader",
      "3 raffle entries per week",
      "Numbered digital variant covers",
      "Behind-the-scenes process content",
    ],
    accent: "var(--neon)",
    highlight: true,
  },
  {
    key: "patron",
    name: "Patron",
    monthly: 24.99,
    yearly: 249.9,
    monthlyPriceId: "patron_monthly",
    yearlyPriceId: "patron_yearly",
    day: "Tuesday",
    offset: "48h ahead",
    perks: [
      "Everything in Initiate",
      "Pages drop 48 hours before Reader",
      "10 raffle entries per week",
      "Cameo eligibility — be drawn into an issue",
      "Quarterly signed physical print run (shipped)",
      "Direct creator Discord access",
    ],
    accent: "var(--plasma)",
  },
];

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Real World Comics" },
      {
        name: "description",
        content:
          "Three subscription tiers, monthly or annual. Reader $4.99, Initiate $9.99, Patron $24.99. Tier-staggered weekly drops, raffles, canon voting. Free no-purchase raffle entry available.",
      },
      { property: "og:title", content: "Real World Comics — Pricing" },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: Pricing,
});

function Pricing() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const navigate = useNavigate();
  const { openCheckout, isOpen, checkoutElement, closeCheckout } = useStripeCheckout();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubscribe = (tier: Tier) => {
    if (!user) {
      navigate({ to: "/login", search: { next: "/pricing" } as never });
      return;
    }
    openCheckout({
      priceId: interval === "monthly" ? tier.monthlyPriceId : tier.yearlyPriceId,
      customerEmail: user.email,
      userId: user.id,
      returnUrl: `${window.location.origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="eyebrow">Three tiers · Cancel anytime</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">Subscribe to read every page.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--ink2)]">
            Free first-act pages always remain free. Pages 10+ of every issue release on a tier-staggered weekly cadence.
          </p>

          <div className="mt-8 inline-flex items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border-line)] p-1" role="tablist" aria-label="Billing interval">
            <button
              role="tab"
              aria-selected={interval === "monthly"}
              onClick={() => setInterval("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-[2px] transition-colors ${
                interval === "monthly" ? "bg-[var(--neon)] text-[#02000c]" : "text-[var(--ink2)] hover:text-[var(--neon)]"
              }`}
            >
              Monthly
            </button>
            <button
              role="tab"
              aria-selected={interval === "yearly"}
              onClick={() => setInterval("yearly")}
              className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-[2px] transition-colors ${
                interval === "yearly" ? "bg-[var(--neon)] text-[#02000c]" : "text-[var(--ink2)] hover:text-[var(--neon)]"
              }`}
            >
              Yearly · 2 months free
            </button>
            </div>

            <HelpTip title="Monthly vs annual" description="Annual saves you about 2 months. Switch any time from your account." href="/help/choose-tier" />
          </div>
        </div>


        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => {
            const price = interval === "monthly" ? t.monthly : t.yearly;
            const suffix = interval === "monthly" ? "/mo" : "/yr";
            return (
              <div
                key={t.name}
                className="card-rwc relative p-7"
                style={t.highlight ? { borderColor: "var(--neon)" } : undefined}
              >
                {t.highlight && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[2px]"
                    style={{ background: "var(--neon)", color: "#02000c" }}
                  >
                    Most popular
                  </div>
                )}
                <h2 className="eyebrow" style={{ color: t.accent }}>{t.name}</h2>
                <div className="mt-3 font-mono text-5xl font-black">
                  ${price.toFixed(2)}
                  <span className="text-base font-bold text-[var(--mute)]">{suffix}</span>
                </div>
                {interval === "yearly" && (
                  <div className="mt-1 text-xs text-[var(--mute)]">${(t.yearly / 12).toFixed(2)}/mo billed annually</div>
                )}
                <div className="mt-2 text-sm text-[var(--mute)]">Reads {t.day} · {t.offset}</div>
                <ul className="mt-6 space-y-2 text-sm text-[var(--ink2)]">
                  {t.perks.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span style={{ color: t.accent }}>◉</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleSubscribe(t)} className="btn-cta mt-8 w-full justify-center">
                  {user ? `Subscribe as ${t.name}` : `Sign in to start`}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-xs text-[var(--mute)]">
          Tier-staggered drops: Patron Tuesday · Initiate Wednesday · Reader Thursday. Cancel anytime from your account.
        </p>
        <p className="mt-3 text-center text-xs text-[var(--mute)]">
          No purchase necessary to enter the weekly raffle.{" "}
          <Link to="/raffle/free-entry" className="underline hover:text-[var(--neon)]">Free entry form</Link>
          {" · "}
          <Link to="/raffle/rules" className="underline hover:text-[var(--neon)]">Official rules</Link>
        </p>

        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeCheckout();
            }}
          >
            <div className="w-full max-w-3xl rounded-lg bg-white p-2 shadow-2xl">
              <div className="flex justify-end p-2">
                <button onClick={closeCheckout} className="text-sm font-semibold text-gray-700 hover:text-black">
                  Close ✕
                </button>
              </div>
              {checkoutElement}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
