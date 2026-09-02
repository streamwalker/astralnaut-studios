import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { createPortalSession } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { TIER_LABEL, tierRank, type Tier } from "@/lib/tier";
import { HelpTip } from "@/components/help/HelpTip";
import { CheckoutConsentPanel } from "@/components/checkout-consent-panel";
import { recordCheckoutConsent } from "@/lib/consent.functions";
import { toast } from "sonner";
import {
  pricingTiers,
  type PricingTier,
  ctaLabel,
  priceForInterval,
} from "@/config/pricingTiers";
import { siteConfig } from "@/config/siteConfig";
import { track } from "@/lib/analytics";
import { OG_DEFAULT_IMAGE, OG_DEFAULT_ALT, OG_DEFAULT_WIDTH, OG_DEFAULT_HEIGHT, SITE_URL } from "@/lib/seo";


export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Real World Comics" },
      {
        name: "description",
        content:
          "Three subscription tiers, monthly or annual. Reader $4.99, Initiate $9.99, Patron $24.99. Tier-staggered weekly drops, sweepstakes, canon voting. Free no-purchase sweepstakes entry available.",
      },
      { property: "og:title", content: "Real World Comics — Pricing" },
      { property: "og:description", content: "Three tiers. Monthly or annual. Tier-staggered weekly drops, sweepstakes, canon voting." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/pricing` },
      { property: "og:image", content: OG_DEFAULT_IMAGE },
      { property: "og:image:width", content: OG_DEFAULT_WIDTH },
      { property: "og:image:height", content: OG_DEFAULT_HEIGHT },
      { property: "og:image:alt", content: OG_DEFAULT_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_DEFAULT_IMAGE },
      { name: "twitter:image:alt", content: OG_DEFAULT_ALT },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pricing` }],
  }),
  validateSearch: (s: Record<string, unknown>): {
    plan?: "reader" | "initiate" | "patron";
    interval?: "monthly" | "yearly";
    autocheckout?: 1;
  } => ({
    plan: z.enum(["reader", "initiate", "patron"]).optional().catch(undefined).parse(s.plan),
    interval: z.enum(["monthly", "yearly"]).optional().catch(undefined).parse(s.interval),
    autocheckout: s.autocheckout === "1" || s.autocheckout === 1 || s.autocheckout === true ? 1 : undefined,
  }),
  component: Pricing,
});

/**
 * What the CTA on a tier card should do for the current viewer.
 *
 * `checkout` is only ever returned when the viewer holds no entitlement.
 * Everyone with an active subscription is routed to the Stripe billing
 * portal, which switches the existing subscription with prorations —
 * starting a second Checkout session would create a *second* subscription
 * and bill them twice.
 */
type CardAction = "checkout" | "current" | "upgrade" | "downgrade" | "switch-interval";

function resolveCardAction(
  tier: PricingTier,
  interval: "monthly" | "yearly",
  sub: { isActive: boolean; tier: Tier; priceId: string | null },
): CardAction {
  if (!sub.isActive || sub.tier === "none") return "checkout";
  const cardPriceId = interval === "monthly" ? tier.monthlyPriceId : tier.yearlyPriceId;
  if (sub.priceId === cardPriceId) return "current";
  if (sub.tier === tier.key) return "switch-interval";
  return tierRank(tier.key) > tierRank(sub.tier) ? "upgrade" : "downgrade";
}

function Pricing() {
  const search = Route.useSearch();
  const [interval, setInterval] = useState<"monthly" | "yearly">(search.interval ?? "monthly");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const navigate = useNavigate();
  const { openCheckout, isOpen, checkoutElement, closeCheckout } = useStripeCheckout();

  // Entitlement, read from the local `subscriptions` table (webhook-populated).
  const sub = useSubscription();
  const portal = useServerFn(createPortalSession);
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const url = await portal({
        data: { environment: getStripeEnvironment(), returnUrl: window.location.href },
      });
      window.open(url, "_blank");
    } catch (e) {
      console.error(e);
      toast.error("Could not open the billing portal. Manage your plan from your account page.");
    } finally {
      setPortalLoading(false);
    }
  };

  // Stage 3: consent panel gates checkout. When set, we show the disclosure
  // + required checkbox instead of the Stripe modal.
  const [pendingCheckout, setPendingCheckout] = useState<{ tier: PricingTier; intv: "monthly" | "yearly" } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Single gate in front of Checkout.
   *
   * Both entry points reach it — the CTA buttons and the `?autocheckout=1`
   * return from login — so an existing subscriber cannot buy a second
   * subscription by either route.
   */
  const beginCheckout = (tier: PricingTier, intv: "monthly" | "yearly") => {
    if (!user) return;
    if (sub.isLoading) return;
    if (sub.isActive) {
      track("pricing_checkout_blocked_existing_sub", {
        tier: tier.key,
        current_tier: sub.tier,
        interval: intv,
      });
      toast.info(
        `You're already subscribed to ${TIER_LABEL[sub.tier]}. Opening your billing portal to change plans.`,
      );
      void openPortal();
      return;
    }
    setPendingCheckout({ tier, intv });
  };

  const handleConsentAccepted = async (consentText: string) => {
    if (!pendingCheckout || !user) return;
    const { tier, intv } = pendingCheckout;
    const priceId = intv === "monthly" ? tier.monthlyPriceId : tier.yearlyPriceId;
    const displayedPrice = priceForInterval(tier, intv);
    try {
      const { consentToken } = await recordCheckoutConsent({
        data: {
          planId: priceId,
          planName: tier.name,
          billingInterval: intv,
          displayedPrice,
          currency: "USD",
          consentText,
        },
      });
      setPendingCheckout(null);
      openCheckout({
        priceId,
        customerEmail: user.email,
        userId: user.id,
        returnUrl: `${window.location.origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        consentToken,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
    }
  };

  const handleSubscribe = (tier: PricingTier, action: CardAction) => {
    const isLoggedIn = !!user;
    track("pricing_cta_click", {
      tier: tier.key,
      interval,
      logged_in: isLoggedIn,
      action,
      current_tier: sub.tier,
    });
    if (!isLoggedIn) {
      navigate({
        to: "/login",
        search: { next: "/pricing", plan: tier.key, interval } as never,
      });
      return;
    }
    // Any plan change on an existing subscription happens in the portal, where
    // Stripe swaps the price with prorations instead of opening a new one.
    if (action !== "checkout") {
      void openPortal();
      return;
    }
    beginCheckout(tier, interval);
  };

  // Auto-open the consent panel when arriving from login with a plan param.
  useEffect(() => {
    if (!user || !search.autocheckout || !search.plan) return;
    const tier = pricingTiers.find((t) => t.key === search.plan);
    if (!tier) return;
    const intv = search.interval ?? interval;
    beginCheckout(tier, intv);
    navigate({ to: "/pricing", search: {} as never, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search.autocheckout, search.plan]);


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

        {sub.isActive && (
          <div
            className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-3 rounded-lg border p-5 text-center sm:flex-row sm:justify-between sm:text-left"
            style={{ borderColor: "var(--neon)", background: "rgba(34,211,255,0.06)" }}
            role="status"
          >
            <div>
              <div className="text-sm font-bold uppercase tracking-[2px]" style={{ color: "var(--neon)" }}>
                You're subscribed · {TIER_LABEL[sub.tier]}
                {sub.priceId?.endsWith("_yearly") ? " (yearly)" : sub.priceId ? " (monthly)" : ""}
              </div>
              <p className="mt-1 text-sm text-[var(--ink2)]">
                {sub.cancelAtPeriodEnd || sub.inGracePeriod
                  ? `Your subscription is set to end${
                      sub.currentPeriodEnd
                        ? ` on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                        : ""
                    }. You keep access until then.`
                  : `Renews${
                      sub.currentPeriodEnd
                        ? ` on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                        : " automatically"
                    }. Changing tier here updates your existing subscription — you're never charged twice.`}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="btn-cta whitespace-nowrap disabled:opacity-60"
              >
                {portalLoading ? "Opening…" : "Manage subscription"}
              </button>
              <Link to="/account" className="btn-ghost whitespace-nowrap">
                Account
              </Link>
            </div>
          </div>
        )}

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pricingTiers.map((t) => {
            const price = priceForInterval(t, interval);
            const suffix = interval === "monthly" ? "/mo" : "/yr";
            const monthlyEquiv = interval === "yearly" ? t.priceYearly / 12 : null;
            const isInitiateAnnual = t.highlightAnnual && interval === "yearly";
            const action = resolveCardAction(t, interval, sub);
            const isCurrent = action === "current";
            return (
              <div
                key={t.key}
                className="card-rwc relative flex flex-col p-7"
                style={
                  isCurrent
                    ? { borderColor: t.accent, boxShadow: `0 0 0 1px ${t.accent}` }
                    : t.popular
                      ? { borderColor: "var(--neon)" }
                      : undefined
                }
                aria-current={isCurrent ? "true" : undefined}
              >
                {isCurrent && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[2px]"
                    style={{ background: t.accent, color: "#02000c" }}
                  >
                    Your plan
                  </div>
                )}
                {!isCurrent && t.popular && (
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
                {monthlyEquiv !== null && (
                  <div className="mt-1 text-xs text-[var(--mute)]">
                    ~${monthlyEquiv.toFixed(2)}/mo billed annually
                  </div>
                )}
                {isInitiateAnnual && (
                  <div
                    className="mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2px]"
                    style={{ background: "rgba(34,211,255,0.10)", color: "var(--neon)", border: "1px solid var(--neon)" }}
                  >
                    2 months free
                  </div>
                )}
                <div className="mt-3 text-sm text-[var(--ink2)]">{t.timingLabel}</div>
                {t.valueCaption && (
                  <p className="mt-2 text-xs text-[var(--mute)]">{t.valueCaption}</p>
                )}
                {t.popular && siteConfig.SHOW_ANNUAL_NUDGE && (
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[2px]" style={{ color: "var(--gold)" }}>
                    Most readers save with annual
                  </p>
                )}
                <ul className="mt-6 space-y-2 text-sm text-[var(--ink2)]">
                  {t.features.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span style={{ color: t.accent }}>◉</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(t, action)}
                  disabled={isCurrent || sub.isLoading || (action !== "checkout" && portalLoading)}
                  className={`mt-8 w-full justify-center ${isCurrent ? "btn-ghost" : "btn-cta"} disabled:cursor-default disabled:opacity-70`}
                  aria-disabled={isCurrent || undefined}
                >
                  {sub.isLoading
                    ? "Checking your plan…"
                    : action === "current"
                      ? "Your current plan"
                      : action === "switch-interval"
                        ? `Switch to ${interval} billing`
                        : action === "upgrade"
                          ? `Upgrade to ${t.name}`
                          : action === "downgrade"
                            ? `Change to ${t.name}`
                            : ctaLabel(t, interval)}
                </button>
                {isCurrent && (
                  <p className="mt-2 text-center text-[11px] text-[var(--mute)]">
                    Manage or cancel from your billing portal.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-xs text-[var(--mute)]">
          Tier-staggered drops: Patron Tuesday · Initiate Wednesday · Reader Thursday. Cancel anytime from your account.
        </p>
        <p className="mt-3 text-center text-xs text-[var(--mute)]">
          Milestone Sweepstakes windows open every 10,000-subscriber milestone and run for 14 days.
          NO PURCHASE NECESSARY. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING. Open to legal
          residents of the 50 United States and District of Columbia who are 18 or older. Void where
          prohibited. See{" "}
          <Link to="/sweepstakes/rules" className="underline hover:text-[var(--neon)]">Official Rules</Link>.{" "}
          <Link to="/sweepstakes/free-entry" className="underline hover:text-[var(--neon)]">Free entry (AMOE)</Link>.
        </p>

        {pendingCheckout && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-consent-title"
            onClick={(e) => { if (e.target === e.currentTarget) setPendingCheckout(null); }}
          >
            <div className="my-8 w-full max-w-2xl rounded-lg border border-[var(--border-line)] bg-[var(--bg)] p-4 shadow-2xl">
              <h2 id="checkout-consent-title" className="sr-only">Confirm your subscription</h2>
              <CheckoutConsentPanel
                planName={pendingCheckout.tier.name}
                displayedPrice={priceForInterval(pendingCheckout.tier, pendingCheckout.intv)}
                currency="USD"
                billingInterval={pendingCheckout.intv}
                onCancel={() => setPendingCheckout(null)}
                onAccept={handleConsentAccepted}
              />
            </div>
          </div>
        )}

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
