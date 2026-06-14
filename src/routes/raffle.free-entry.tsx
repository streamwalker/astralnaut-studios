import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { submitLead } from "@/lib/leads.functions";

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(200),
  email: z.string().trim().email("Valid email required").max(320),
});

function isoWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export const Route = createFileRoute("/raffle/free-entry")({
  head: () => ({
    meta: [
      { title: "Free raffle entry — Real World Comics" },
      {
        name: "description",
        content:
          "Submit a free, no-purchase-necessary entry into the Real World Comics weekly raffle. One entry per email, per week.",
      },
      { property: "og:title", content: "Free raffle entry — Real World Comics" },
      { property: "og:url", content: "/raffle/free-entry" },
    ],
    links: [{ rel: "canonical", href: "/raffle/free-entry" }],
  }),
  component: FreeEntryPage,
});

function FreeEntryPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "ok" | "err"; msg?: string }>({ kind: "idle" });
  const captureLead = useServerFn(submitLead);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const parsed = schema.safeParse({ name, email });
    if (!parsed.success) {
      setStatus({ kind: "err", msg: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }
    const week = isoWeekKey();
    const lowered = parsed.data.email.toLowerCase();
    const { error } = await supabase.from("raffle_entries").insert({
      name: parsed.data.name,
      email: lowered,
      week_key: week,
      source: "amoe",
    });
    if (error) {
      if (error.code === "23505") {
        setStatus({ kind: "err", msg: "This email has already entered this week. Come back next week!" });
      } else {
        setStatus({ kind: "err", msg: "Could not submit entry. Please try again." });
      }
      return;
    }
    // Also capture as a lead so the free raffle grows the same re-engagement
    // list as the reader interstitial. Best-effort — does not block success.
    try {
      await captureLead({ data: { email: lowered, source: "free_raffle" } });
    } catch (e) {
      console.warn("lead capture failed", e);
    }
    setStatus({ kind: "ok", msg: `Entry received for week ${week}. Check your inbox to confirm drop alerts. Good luck!` });
    setName("");
    setEmail("");
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="eyebrow">No purchase necessary</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Free weekly raffle entry</h1>
        <p className="mt-4 text-[var(--ink2)]">
          You do not need to subscribe to enter the Real World Comics weekly raffle. Submit one free entry per week using
          the form below. Subscribers receive additional automatic entries as a perk of their tier.
        </p>

        <form onSubmit={submit} className="card-rwc mt-8 space-y-4 p-6">
          <Field label="Your name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              className="w-full rounded-md border border-[var(--border-line)] bg-transparent px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--neon)] focus:outline-none"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={320}
              className="w-full rounded-md border border-[var(--border-line)] bg-transparent px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--neon)] focus:outline-none"
            />
          </Field>
          <button type="submit" disabled={status.kind === "loading"} className="btn-cta w-full justify-center">
            {status.kind === "loading" ? "Submitting…" : "Submit free entry"}
          </button>
          {status.kind === "ok" && (
            <p className="text-sm text-[var(--neon)]">{status.msg}</p>
          )}
          {status.kind === "err" && (
            <p className="text-sm text-[var(--plasma)]">{status.msg}</p>
          )}
        </form>

        <p className="mt-6 text-xs text-[var(--mute)]">
          By entering, you agree to the{" "}
          <Link to="/raffle/rules" className="underline hover:text-[var(--neon)]">official rules</Link>.
          One free entry per email per calendar week. Open only where permitted by law.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--mute)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
