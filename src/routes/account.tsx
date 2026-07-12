import { useEffect, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { createPortalSession, updateShippingAddress } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import rwcLogo from "@/assets/real-world-comics-logo.png";
import baLogo from "@/assets/battlefield-atlantis-logo.png";
import coaLogo from "@/assets/children-of-aquarius-logo.png";
import daLogo from "@/assets/darker-ages-logo.png";
import ndfAsset from "@/assets/factions/nerrian-defense-force-logo.png.asset.json";
import tpcAsset from "@/assets/factions/tri-planetary-coalition-logo.png.asset.json";
import { useI18n } from "@/hooks/useI18n";
import { StandingAndCancelFlow } from "@/components/account/StandingAndCancelFlow";

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

type TierKey = "reader" | "initiate" | "patron";

const TIER_META: Record<TierKey, {
  label: string;
  day: "Tuesday" | "Wednesday" | "Thursday";
  entries: number;
  color: string;
  glow: string;
}> = {
  reader:   { label: "Reader",   day: "Thursday",  entries: 1,  color: "var(--neon)", glow: "rgba(60,220,255,0.25)" },
  initiate: { label: "Initiate", day: "Wednesday", entries: 3,  color: "#C4A0FF",     glow: "rgba(196,160,255,0.25)" },
  patron:   { label: "Patron",   day: "Tuesday",   entries: 10, color: "var(--gold)", glow: "rgba(255,184,64,0.25)" },
};

function tierKeyFromPriceId(priceId: string | null | undefined): TierKey | null {
  if (!priceId) return null;
  const k = priceId.split("_")[0];
  return k === "reader" || k === "initiate" || k === "patron" ? k : null;
}

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
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [sub, setSub] = useState<SubRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  useI18n();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      if (mounted) {
        setEmail(u.user.email ?? "");
        setMemberSince(u.user.created_at ?? null);
      }
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
  const tierKey = tierKeyFromPriceId(sub?.price_id);
  const tier = tierKey ? TIER_META[tierKey] : null;
  const greeting = email ? email.split("@")[0] : "reader";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* HERO */}
        <section className="text-center">
          <img
            src={rwcLogo}
            alt="Real World Comics"
            className="mx-auto h-20 w-auto md:h-28"
            style={{ filter: "drop-shadow(0 0 24px rgba(60,220,255,0.25))" }}
          />
          <div className="eyebrow mt-6 text-[var(--gold)]">
            <span data-i18n="hero.welcome">Welcome back</span>, {greeting}
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl" data-i18n-html="hero.title">
            The next page only drops <span className="accent">here</span>.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--ink2)]" data-i18n="hero.sub">
            Netflix for comics. Weekly drops. Real prizes. Canon you help shape. Built for readers, not pirates.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/reader/$series/$issue"
              params={{ series: "battlefield-atlantis", issue: "1" }}
              className="btn-cta"
              data-i18n="hero.cta.continue"
            >
              Keep reading →
            </Link>
            <Link to="/pricing" className="rounded-md border border-white/15 px-5 py-3 text-sm font-semibold hover:border-[var(--neon)] hover:text-[var(--neon)]">
              View plans
            </Link>
          </div>
        </section>

        {/* CHECKOUT SUCCESS */}
        {checkout === "success" && !loading && sub && (
          <div className="mt-10 rounded-md border border-[var(--neon)] bg-[rgba(34,211,255,0.08)] p-5 text-sm">
            <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--neon)]">Payment confirmed</div>
            <h2 className="mt-2 text-xl font-black tracking-tight">
              You're on {TIER_LABELS[sub.price_id] || sub.price_id}.
            </h2>
            <p className="mt-2 text-[var(--ink2)]">
              Welcome to Real World Comics. Your access is active
              {sub.current_period_end
                ? ` and renews on ${new Date(sub.current_period_end).toLocaleDateString()}.`
                : "."}
            </p>
            {sub.price_id?.startsWith("patron_") && !sub.shipping_line1 && (
              <a href="#patron-shipping" className="btn-cta mt-5 inline-flex">Add shipping address</a>
            )}
          </div>
        )}
        {checkout === "success" && loading && (
          <div className="mt-10 rounded-md border border-[var(--neon)] bg-[rgba(34,211,255,0.08)] p-4 text-sm">
            Finalizing your subscription…
          </div>
        )}

        {/* ACCOUNT STATUS CARD */}
        <section
          className="card-rwc mt-12 p-6 md:p-8"
          style={tier ? { borderColor: tier.color, boxShadow: `0 0 32px ${tier.glow}` } : undefined}
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="eyebrow text-[var(--gold)]">Account status</div>
              {loading ? (
                <p className="mt-3 text-sm text-[var(--mute)]">Loading…</p>
              ) : tier ? (
                <>
                  <div
                    className="mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[2px]"
                    style={{ color: tier.color, borderColor: tier.color, background: `${tier.glow}` }}
                  >
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: tier.color }} />
                    {tier.label} tier
                  </div>
                  <h2 className="mt-3 text-2xl font-black md:text-3xl">
                    {TIER_LABELS[sub!.price_id] || sub!.price_id}
                  </h2>
                </>
              ) : (
                <>
                  <h2 className="mt-3 text-2xl font-black">No active subscription</h2>
                  <p className="mt-1 text-sm text-[var(--ink2)]">Pick a tier to unlock pages 10–24 of every issue.</p>
                  <Link to="/pricing" className="btn-cta mt-5 inline-flex">See plans</Link>
                </>
              )}
            </div>
            {tier && (
              <div className="grid w-full gap-4 sm:w-auto sm:grid-cols-3">
                <Stat label="Member since" value={memberSince ? new Date(memberSince).toLocaleDateString() : "—"} />
                <Stat
                  label={sub?.cancel_at_period_end ? "Access until" : "Next billing"}
                  value={sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
                />
                <Stat label="Sweepstakes entries / week" value={`${tier.entries}`} accent={tier.color} />
              </div>
            )}
          </div>

          {tier && (
            <>
              {sub?.price_id?.startsWith("patron_") && (
                <ShippingForm
                  initial={sub}
                  onSave={async (values) => {
                    await saveShipping({ data: { environment: getStripeEnvironment(), ...values } });
                    setSub({ ...sub, ...values, shipping_country: values.shipping_country.toUpperCase() });
                  }}
                />
              )}

              <StandingAndCancelFlow
                hasActiveSub={!!isActive}
                portalLoading={portalLoading}
                onManage={openPortal}
              />
              <div className="mt-4 rounded-md border border-[var(--border-line)] bg-black/20 p-4 text-xs text-[var(--ink2)]">
                <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">Changing tiers</div>
                <ul className="mt-2 space-y-1.5">
                  <li><span className="font-semibold text-[var(--ink)]">Upgrade:</span> benefits unlock immediately, prorated charge for the remainder of the period.</li>
                  <li><span className="font-semibold text-[var(--ink)]">Downgrade:</span> immediate switch with an unused-time credit applied to your next invoice.</li>
                  <li><span className="font-semibold text-[var(--ink)]">Monthly ↔ Yearly:</span> same proration rules — no loss of access.</li>
                  <li><span className="font-semibold text-[var(--ink)]">Cancel:</span> you keep access until the end of the current billing period.</li>
                </ul>
                <p className="mt-3">Opens Stripe's secure portal in a new tab. Update payment method, shipping, or tax ID there too.</p>
              </div>
              {!isActive && (
                <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                  Subscription status: <span className="font-semibold">{sub!.status}</span>. Manage in the billing portal if you need to update payment.
                </div>
              )}
            </>
          )}
        </section>

        {/* TIER-STAGGERED DROPS */}
        <section className="mt-16">
          <div className="eyebrow text-[var(--gold)]">This week's drops</div>
          <h2 className="mt-2 text-2xl font-black md:text-3xl">Patron Tuesday · Initiate Wednesday · Reader Thursday</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(Object.keys(TIER_META) as TierKey[])
              .sort((a, b) => ["patron", "initiate", "reader"].indexOf(a) - ["patron", "initiate", "reader"].indexOf(b))
              .map((k) => {
                const t = TIER_META[k];
                const mine = tierKey === k;
                return (
                  <div
                    key={k}
                    className="card-rwc relative p-5"
                    style={mine ? { borderColor: t.color, boxShadow: `0 0 24px ${t.glow}` } : undefined}
                  >
                    {mine && (
                      <span
                        className="absolute -top-2 right-4 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px]"
                        style={{ background: t.color, color: "#05070F" }}
                      >
                        You
                      </span>
                    )}
                    <div className="text-[10px] font-bold uppercase tracking-[2px]" style={{ color: t.color }}>{t.day}</div>
                    <div className="mt-1 text-xl font-black">{t.label}</div>
                    <p className="mt-2 text-xs text-[var(--ink2)]">
                      {k === "patron" && "First in line. 48h before Reader. Cameo eligibility + signed print quarterly."}
                      {k === "initiate" && "24h before Reader. Numbered digital variants + process content."}
                      {k === "reader" && "All series, all 20 pages. Community + voting access."}
                    </p>
                  </div>
                );
              })}
          </div>
        </section>

        {/* THE SLATE */}
        <section className="mt-16">
          <div className="eyebrow text-[var(--gold)]">The slate</div>
          <h2 className="mt-2 text-2xl font-black md:text-3xl">Three properties. One disclosure-era canon.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SeriesTile
              logo={baLogo}
              name="Battlefield: Atlantis"
              status="Live"
              statusColor="var(--neon)"
              blurb="Hard sci-fi space opera. Issue 1 currently dropping."
              to="/battlefield-atlantis"
            />
            <SeriesTile
              logo={coaLogo}
              name="Children of Aquarius"
              status="Live"
              statusColor="var(--neon)"
              blurb="Esoteric thriller. Disclosure-era religious mysticism."
              to="/children-of-aquarius"
            />
            <SeriesTile
              logo={daLogo}
              name="Darker Ages"
              status="Oct 2026"
              statusColor="var(--gold)"
              blurb="Dark medieval fantasy. Reserve your tier now."
              to="/darker-ages"
            />
          </div>
        </section>

        {/* FACTIONS IN MOTION */}
        <section className="mt-16">
          <div className="eyebrow text-[var(--gold)]" data-i18n="factions.eyebrow">Factions in motion</div>
          <h2 className="mt-2 text-2xl font-black md:text-3xl" data-i18n="factions.title">
            The forces shaping the disclosure era.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FactionTile
              logo={ndfAsset.url}
              name="Nerrian Defense Force"
              short="NDF"
              tagline="Vigilant · Protect · Prevail"
              blurb="Standing army of the Nerrian homeworld. Doctrinal backbone of the Battlefield: Atlantis conflict."
              accent="var(--neon)"
            />
            <FactionTile
              logo={tpcAsset.url}
              name="Tri-Planetary Coalition"
              short="TPC"
              tagline="Unity · Diplomacy · Commerce"
              blurb="Three worlds, one charter. Trade lanes, treaty law, and the long peace the NDF was built to defend."
              accent="var(--gold)"
            />
          </div>
        </section>

        {/* PLATFORM PERKS */}
        <section className="mt-16">
          <div className="eyebrow text-[var(--gold)]">Platform perks</div>
          <h2 className="mt-2 text-2xl font-black md:text-3xl">Four pillars that make this not-a-comic-app.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Perk title="Motion + sound" body="Pages with parallax, ambient score, and SFX. Optional — read silently any time." />
            <Perk title="Tier-staggered drops" body="Your tier decides when you get the next page. Patron first." />
            <Perk title="Canon voting" body="Readers vote on branching beats. Outcomes show up in print." />
            <Perk title="Sweepstakes + cameos" body={`${tier ? tier.entries : 1} sweepstakes entries per active week. Patron tier = cameo eligibility.`} />
          </div>
        </section>

        {/* SWEEPSTAKES CTA */}
        <section className="mt-16 overflow-hidden rounded-2xl border border-[var(--gold)]/40 p-8 md:p-12"
          style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,184,64,0.18), transparent 60%), radial-gradient(circle at 80% 80%, rgba(60,220,255,0.14), transparent 60%), #0B0E1C" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>Marquee prize</div>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">PlayStation 5 unlocks at 1,000 subscribers.</h2>
              <p className="mt-3 text-[var(--ink2)]">
                Every active subscription week earns sweepstakes entries — {tier?.entries ?? 1} per week at your tier.
                No subscription? You can still enter for free, once per cycle.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/sweepstakes/rules" className="btn-cta">See sweepstakes rules</Link>
              <Link to="/sweepstakes/free-entry" className="text-center text-xs font-semibold text-[var(--ink2)] hover:text-[var(--neon)]">
                Or enter for free →
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER ACTIONS */}
        <div className="mt-12 flex items-center justify-between">
          <Link to="/" className="text-sm text-[var(--mute)] hover:text-[var(--neon)]">← Back to library</Link>
          <button onClick={signOut} className="text-sm font-semibold text-[var(--ink2)] hover:text-[var(--neon)]">Sign out</button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-md border border-[var(--border-line)] bg-black/30 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--mute)]">{label}</div>
      <div className="mt-1 text-lg font-black" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}

function Perk({ title, body }: { title: string; body: string }) {
  return (
    <div className="card-rwc p-5">
      <div className="text-sm font-bold text-[var(--neon)]">{title}</div>
      <p className="mt-2 text-xs text-[var(--ink2)]">{body}</p>
    </div>
  );
}

function FactionTile({
  logo, name, short, tagline, blurb, accent,
}: {
  logo: string;
  name: string;
  short: string;
  tagline: string;
  blurb: string;
  accent: string;
}) {
  return (
    <div
      className="card-rwc flex items-center gap-5 p-5"
      style={{ borderColor: `${accent}40` }}
    >
      <div
        className="flex h-24 w-24 flex-none items-center justify-center rounded-md bg-black/50 p-3"
        style={{ boxShadow: `0 0 24px ${accent}30` }}
      >
        <img src={logo} alt={`${name} emblem`} className="max-h-full max-w-full object-contain" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[2px]" style={{ color: accent }}>{short}</div>
        <div className="mt-0.5 text-base font-black leading-tight">{name}</div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--ink2)]">{tagline}</div>
        <p className="mt-2 text-xs text-[var(--ink2)]">{blurb}</p>
      </div>
    </div>
  );
}

function SeriesTile({
  logo, name, status, statusColor, blurb, to,
}: {
  logo: string;
  name: string;
  status: string;
  statusColor: string;
  blurb: string;
  to: "/battlefield-atlantis" | "/children-of-aquarius" | "/darker-ages";
}) {
  return (
    <Link to={to} className="card-rwc group relative flex flex-col overflow-hidden p-0">
      <div className="relative flex h-32 items-center justify-center bg-black/40 p-4">
        <img src={logo} alt={name} className="max-h-24 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
        <span
          className="absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px]"
          style={{ color: statusColor, borderColor: statusColor, background: "rgba(0,0,0,0.4)" }}
        >
          {status}
        </span>
      </div>
      <div className="p-5">
        <div className="text-sm font-black">{name}</div>
        <p className="mt-1 text-xs text-[var(--ink2)]">{blurb}</p>
      </div>
    </Link>
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
      <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">Print shipping address</div>
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
