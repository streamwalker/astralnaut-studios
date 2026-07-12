import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import logo from "@/assets/astralnaut-logo.png";

const TIERS = [
  {
    key: "reader_monthly",
    tier: "Reader",
    interval: "Monthly",
    price: 4.99,
    lookupKey: "reader_monthly",
    accent: "var(--ink2)",
  },
  {
    key: "reader_yearly",
    tier: "Reader",
    interval: "Yearly",
    price: 49.9,
    lookupKey: "reader_yearly",
    accent: "var(--ink2)",
  },
  {
    key: "initiate_monthly",
    tier: "Initiate",
    interval: "Monthly",
    price: 9.99,
    lookupKey: "initiate_monthly",
    accent: "var(--neon)",
  },
  {
    key: "initiate_yearly",
    tier: "Initiate",
    interval: "Yearly",
    price: 99.9,
    lookupKey: "initiate_yearly",
    accent: "var(--neon)",
  },
  {
    key: "patron_monthly",
    tier: "Patron",
    interval: "Monthly",
    price: 24.99,
    lookupKey: "patron_monthly",
    accent: "var(--plasma)",
  },
  {
    key: "patron_yearly",
    tier: "Patron",
    interval: "Yearly",
    price: 249.9,
    lookupKey: "patron_yearly",
    accent: "var(--plasma)",
  },
] as const;

const CHECKLIST_ITEMS = [
  "Checkout modal loads",
  "Test payment succeeds (4242 4242 4242 4242)",
  "Webhook received & subscription row created",
  "Subscription shows 'active' in DB",
  "Billing Portal opens",
  "Cancel via portal works",
];

export const Route = createFileRoute("/_authenticated/admin/subscription-test")({
  head: () => ({
    meta: [{ title: "Subscription Test — Admin — Astralnaut Studios" }],
  }),
  component: SubscriptionTestPage,
});

function SubscriptionTestPage() {
  const nav = useNavigate();
  const { openCheckout, isOpen, checkoutElement, closeCheckout } = useStripeCheckout();
  const [activePriceId, setActivePriceId] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean[]>>({});

  const { data: userData } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", userData?.id],
    enabled: !!userData?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

  const toggleCheck = (tierKey: string, idx: number) => {
    setChecks((prev) => {
      const list = prev[tierKey] ? [...prev[tierKey]] : new Array(CHECKLIST_ITEMS.length).fill(false);
      list[idx] = !list[idx];
      return { ...prev, [tierKey]: list };
    });
  };

  const resetChecks = (tierKey: string) => {
    setChecks((prev) => ({ ...prev, [tierKey]: new Array(CHECKLIST_ITEMS.length).fill(false) }));
  };

  const handleTest = async (lookupKey: string) => {
    if (!userData) {
      toast.error("You must be signed in to test checkout.");
      return;
    }
    setActivePriceId(lookupKey);
    // Admin test path: record a real checkout-consent event so createCheckoutSession
    // still passes the Stage 3 gate.
    const { recordCheckoutConsent } = await import("@/lib/consent.functions");
    const isYearly = lookupKey.endsWith("_yearly");
    const { consentToken } = await recordCheckoutConsent({
      data: {
        planId: lookupKey,
        planName: `Admin test — ${lookupKey}`,
        billingInterval: isYearly ? "yearly" : "monthly",
        displayedPrice: 0.01,
        currency: "USD",
        consentText: `Admin test checkout for ${lookupKey}.`,
      },
    });
    openCheckout({
      priceId: lookupKey,
      customerEmail: userData.email ?? undefined,
      userId: userData.id,
      returnUrl: `${window.location.origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      consentToken,
    });
  };


  if (roleLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Checking access…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-bold">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your account doesn't have admin access.</p>
          <Button onClick={handleSignOut} variant="outline" className="mt-6">Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Astralnaut Studios" className="h-8 w-auto" />
            <span className="text-sm font-semibold tracking-[0.18em]">ADMIN</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/admin" className="rounded-md border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <span className="text-muted-foreground">{userData?.email}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm">Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Subscription Test Checklist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verify every tier and billing interval in <span className="font-semibold text-[var(--neon)]">sandbox mode</span>.
            Use Stripe test card <code className="rounded bg-muted px-1.5 py-0.5 text-xs">4242 4242 4242 4242</code>.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TIERS.map((t) => {
            const tierChecks = checks[t.key] ?? new Array(CHECKLIST_ITEMS.length).fill(false);
            const completed = tierChecks.filter(Boolean).length;
            return (
              <div key={t.key} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <Badge style={{ backgroundColor: t.accent, color: "#02000c" }}>{t.interval}</Badge>
                  <span className="text-xs text-muted-foreground">{completed}/{CHECKLIST_ITEMS.length}</span>
                </div>
                <h2 className="mt-3 text-xl font-bold" style={{ color: t.accent }}>{t.tier}</h2>
                <p className="text-2xl font-black">${t.price.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  Lookup key: <code className="rounded bg-muted px-1">{t.lookupKey}</code>
                </p>

                <Button
                  className="mt-4 w-full"
                  onClick={() => handleTest(t.lookupKey)}
                >
                  Test Checkout
                </Button>

                <div className="mt-5 space-y-2">
                  {CHECKLIST_ITEMS.map((item, idx) => (
                    <label key={idx} className="flex items-start gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={tierChecks[idx]}
                        onCheckedChange={() => toggleCheck(t.key, idx)}
                      />
                      <span className={tierChecks[idx] ? "text-muted-foreground line-through" : ""}>{item}</span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => resetChecks(t.key)}
                  className="mt-3 text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Reset checklist
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-bold">Quick Reference</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• All checkouts run in <strong>sandbox mode</strong> — no real money is charged.</li>
            <li>• Use Stripe test card: <code className="rounded bg-muted px-1">4242 4242 4242 4242</code> (any future expiry, any CVC).</li>
            <li>• Decline tests: <code className="rounded bg-muted px-1">4000 0000 0000 0002</code> (generic decline).</li>
            <li>• After payment, check the <strong>subscriptions</strong> table in the DB for the new row.</li>
            <li>• Use the <strong>Billing Portal</strong> link on the account page to test cancel/upgrade flows.</li>
            <li>• After canceling, verify the subscription status changes to <code className="rounded bg-muted px-1">canceled</code> in the DB.</li>
          </ul>
        </div>
      </main>

      {isOpen && activePriceId && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeCheckout(); }}
        >
          <div className="w-full max-w-3xl rounded-lg bg-white p-2 shadow-2xl">
            <div className="flex justify-between items-center p-2">
              <span className="text-sm font-semibold text-gray-700">Test Checkout — {activePriceId}</span>
              <button onClick={closeCheckout} className="text-sm font-semibold text-gray-700 hover:text-black">
                Close ✕
              </button>
            </div>
            {checkoutElement}
          </div>
        </div>
      )}
    </div>
  );
}
