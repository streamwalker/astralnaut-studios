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

        {checkout === "success" && !loading && sub && (
          <div className="mt-6 rounded-md border border-[var(--neon)] bg-[rgba(34,211,255,0.08)] p-5 text-sm text-[var(--ink)]">
            <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--neon)]">
              Payment confirmed
            </div>
            <h2 className="mt-2 text-xl font-black tracking-tight">
              You're on {TIER_LABELS[sub.price_id] || sub.price_id}.
            </h2>
            <p className="mt-2 text-[var(--ink2)]">
              Welcome to Real World Comics. Your access is active
              {sub.current_period_end
                ? ` and renews on ${new Date(sub.current_period_end).toLocaleDateString()}.`
                : "."}
            </p>
            <div className="mt-4 text-xs text-[var(--ink2)]">
              <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">
                Next steps
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {sub.price_id?.startsWith("patron_") ? (
                  <>
                    <li>
                      {sub.shipping_line1
                        ? "Confirm your print shipping address below — we ship Patron rewards there."
                        : "Add your print shipping address below so we can ship your Patron rewards."}
                    </li>
                    <li>
                      <Link to="/" className="underline hover:text-[var(--neon)]">Jump into the library</Link>{" "}
                      and start reading.
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link to="/" className="underline hover:text-[var(--neon)]">Open the library</Link>{" "}
                      and start reading.
                    </li>
                    <li>You can manage or change your plan any time below.</li>
                  </>
                )}
              </ul>
            </div>
            {sub.price_id?.startsWith("patron_") && !sub.shipping_line1 && (
              <a
                href="#patron-shipping"
                className="btn-cta mt-5 inline-flex"
              >
                Add shipping address
              </a>
            )}
          </div>
        )}
        {checkout === "success" && loading && (
          <div className="mt-6 rounded-md border border-[var(--neon)] bg-[rgba(34,211,255,0.08)] p-4 text-sm text-[var(--ink)]">
            Finalizing your subscription…
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

              {sub.price_id?.startsWith("patron_") && (
                <ShippingForm
                  initial={sub}
                  onSave={async (values) => {
                    await saveShipping({ data: { environment: getStripeEnvironment(), ...values } });
                    setSub({ ...sub, ...values, shipping_country: values.shipping_country.toUpperCase() });
                  }}
                />
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

type ShippingValues = {
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
};

function ShippingForm({
  initial,
  onSave,
}: {
  initial: SubRow;
  onSave: (values: ShippingValues) => Promise<void>;
}) {
  const [values, setValues] = useState<ShippingValues>({
    shipping_name: initial.shipping_name ?? "",
    shipping_line1: initial.shipping_line1 ?? "",
    shipping_line2: initial.shipping_line2 ?? "",
    shipping_city: initial.shipping_city ?? "",
    shipping_state: initial.shipping_state ?? "",
    shipping_postal_code: initial.shipping_postal_code ?? "",
    shipping_country: initial.shipping_country ?? "US",
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const set = (k: keyof ShippingValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await onSave(values);
      setStatus({ kind: "ok", msg: "Shipping address saved." });
    } catch (err) {
      setStatus({ kind: "err", msg: err instanceof Error ? err.message : "Could not save address." });
    } finally {
      setSaving(false);
    }
  };

  const input =
    "w-full rounded-md border border-[var(--border-line)] bg-black/30 px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--neon)] focus:outline-none";

  return (
    <form id="patron-shipping" onSubmit={submit} className="mt-5 scroll-mt-24 rounded-md border border-[var(--border-line)] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">
        Print shipping address
      </div>
      <p className="mt-1 text-xs text-[var(--mute)]">Where we ship your Patron print rewards.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2 text-xs text-[var(--ink2)]">
          Full name
          <input className={`${input} mt-1`} value={values.shipping_name} onChange={set("shipping_name")} required maxLength={200} />
        </label>
        <label className="sm:col-span-2 text-xs text-[var(--ink2)]">
          Address line 1
          <input className={`${input} mt-1`} value={values.shipping_line1} onChange={set("shipping_line1")} required maxLength={200} />
        </label>
        <label className="sm:col-span-2 text-xs text-[var(--ink2)]">
          Address line 2 (optional)
          <input className={`${input} mt-1`} value={values.shipping_line2} onChange={set("shipping_line2")} maxLength={200} />
        </label>
        <label className="text-xs text-[var(--ink2)]">
          City
          <input className={`${input} mt-1`} value={values.shipping_city} onChange={set("shipping_city")} required maxLength={100} />
        </label>
        <label className="text-xs text-[var(--ink2)]">
          State / Region
          <input className={`${input} mt-1`} value={values.shipping_state} onChange={set("shipping_state")} maxLength={100} />
        </label>
        <label className="text-xs text-[var(--ink2)]">
          Postal code
          <input className={`${input} mt-1`} value={values.shipping_postal_code} onChange={set("shipping_postal_code")} required maxLength={20} />
        </label>
        <label className="text-xs text-[var(--ink2)]">
          Country (2-letter)
          <input
            className={`${input} mt-1 uppercase`}
            value={values.shipping_country}
            onChange={set("shipping_country")}
            required
            minLength={2}
            maxLength={2}
          />
        </label>
      </div>
      {status && (
        <div className={`mt-3 text-xs ${status.kind === "ok" ? "text-[var(--neon)]" : "text-red-400"}`}>{status.msg}</div>
      )}
      <button type="submit" disabled={saving} className="btn-cta mt-4">
        {saving ? "Saving…" : "Save shipping address"}
      </button>
    </form>
  );
}
