import { useEffect, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { createPortalSession, updateShippingAddress } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

type SubRow = {
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  shipping_name: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
};

const TIER_LABELS: Record<string, string> = {
  reader_monthly: "Reader (Monthly)",
  reader_yearly: "Reader (Yearly)",
  initiate_monthly: "Initiate (Monthly)",
  initiate_yearly: "Initiate (Yearly)",
  patron_monthly: "Patron (Monthly)",
  patron_yearly: "Patron (Yearly)",
};

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account — Real World Comics" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    checkout: typeof s.checkout === "string" ? s.checkout : undefined,
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", search: { next: "/account" } as never });
  },
  component: AccountPage,
});

function AccountPage() {
  const { checkout } = Route.useSearch();
  const navigate = useNavigate();
  const portal = useServerFn(createPortalSession);
  const saveShipping = useServerFn(updateShippingAddress);
  const [email, setEmail] = useState<string>("");
  const [sub, setSub] = useState<SubRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      if (mounted) setEmail(u.user.email ?? "");
      const env = getStripeEnvironment();
      const { data } = await supabase
        .from("subscriptions")
        .select("status, price_id, current_period_end, cancel_at_period_end, shipping_name, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country")
        .eq("user_id", u.user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mounted) {
        setSub((data as SubRow | null) ?? null);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const url = await portal({ data: { environment: getStripeEnvironment(), returnUrl: window.location.href } });
      window.open(url, "_blank");
    } catch (e) {
      console.error(e);
      alert("Could not open the billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const isActive = sub && ["active", "trialing", "past_due"].includes(sub.status);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="eyebrow">Your account</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{email || "Account"}</h1>

        {checkout === "success" && (
          <div className="mt-6 rounded-md border border-[var(--neon)] bg-[rgba(34,211,255,0.08)] p-4 text-sm text-[var(--ink)]">
            Subscription active. Welcome to Real World Comics.
          </div>
        )}

        <section className="card-rwc mt-8 p-6">
          <h2 className="eyebrow">Subscription</h2>
          {loading ? (
            <p className="mt-3 text-sm text-[var(--mute)]">Loading…</p>
          ) : !sub ? (
            <>
              <p className="mt-3 text-sm text-[var(--ink2)]">You don't have an active subscription yet.</p>
              <Link to="/pricing" className="btn-cta mt-5 inline-flex">See plans</Link>
            </>
          ) : (
            <>
              <div className="mt-3 grid gap-2 text-sm">
                <Row label="Plan" value={TIER_LABELS[sub.price_id] || sub.price_id} />
                <Row label="Status" value={isActive ? "Active" : sub.status} />
                {sub.current_period_end && (
                  <Row
                    label={sub.cancel_at_period_end ? "Access until" : "Renews on"}
                    value={new Date(sub.current_period_end).toLocaleDateString()}
                  />
                )}
              </div>

              {sub.shipping_line1 && (
                <div className="mt-5 rounded-md border border-[var(--border-line)] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--mute)]">Print shipping address</div>
                  <div className="mt-2 text-sm text-[var(--ink2)]">
                    {sub.shipping_name && <div>{sub.shipping_name}</div>}
                    <div>{sub.shipping_line1}</div>
                    <div>{[sub.shipping_city, sub.shipping_postal_code].filter(Boolean).join(", ")}</div>
                    <div>{sub.shipping_country}</div>
                  </div>
                </div>
              )}

              <button onClick={openPortal} disabled={portalLoading} className="btn-cta mt-6">
                {portalLoading ? "Opening…" : "Manage subscription"}
              </button>
              <div className="mt-4 rounded-md border border-[var(--border-line)] bg-black/20 p-4 text-xs text-[var(--ink2)]">
                <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">
                  Changing tiers
                </div>
                <ul className="mt-2 space-y-1.5">
                  <li>
                    <span className="font-semibold text-[var(--ink)]">Upgrade (e.g. Reader → Patron):</span>{" "}
                    new tier benefits unlock immediately. You're charged a prorated amount for the remainder of the current billing period.
                  </li>
                  <li>
                    <span className="font-semibold text-[var(--ink)]">Downgrade (e.g. Patron → Reader):</span>{" "}
                    the switch is also immediate, and an unused-time credit is applied to your next invoice — no refund to your card.
                  </li>
                  <li>
                    <span className="font-semibold text-[var(--ink)]">Monthly ↔ Yearly:</span>{" "}
                    same rules — you keep access throughout, and Stripe calculates the proration automatically.
                  </li>
                  <li>
                    <span className="font-semibold text-[var(--ink)]">Cancel:</span>{" "}
                    you keep access until the end of the current billing period; nothing is charged after that.
                  </li>
                </ul>
                <p className="mt-3">
                  Opens Stripe's secure portal in a new tab. You can also update payment method, shipping address, or tax ID there.
                </p>
              </div>
            </>
          )}
        </section>

        <div className="mt-10 flex items-center justify-between">
          <Link to="/" className="text-sm text-[var(--mute)] hover:text-[var(--neon)]">← Back to library</Link>
          <button onClick={signOut} className="text-sm font-semibold text-[var(--ink2)] hover:text-[var(--neon)]">Sign out</button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--mute)]">{label}</span>
      <span className="font-semibold text-[var(--ink)]">{value}</span>
    </div>
  );
}
