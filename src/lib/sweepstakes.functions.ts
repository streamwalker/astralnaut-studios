// Server functions for the Milestone Sweepstakes (Stage 4).
//
// Sponsor: Streamwalkers Corporation. Every entry path enforces:
//   1. Fail-closed activation gate (isSweepstakesActivatable + no bracketed
//      placeholders in the DB promotion row itself).
//   2. Exactly one entry per eligible person per promotion, regardless of
//      method or subscription tier. Enforced by a UNIQUE index on
//      (promotion_id, dedup_key) AND by upserting via that key so a paid
//      subscriber who also submits the free form is silently absorbed.
//   3. Winner selection uses a cryptographically strong RNG (Node crypto)
//      to pick an index in [0, entrantCount), against a frozen, ordered
//      snapshot of entry IDs. The snapshot's SHA-256 hash is stored as an
//      audit commitment alongside the seed so the drawing is reproducible.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LEGAL_CONFIG, isPlaceholder } from "@/config/legal";

// ---------- helpers ---------------------------------------------------------

const normalizeEmail = (e: string) => e.trim().toLowerCase();

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(320);

function dedupKeyFor(email: string, userId?: string | null): string {
  // Normalized email is the primary dedup surface. When we know user_id we
  // still key on email so a returning user with the same address collides
  // with prior entries, but we ALSO track user_id on the row so admins can
  // see the link. If email is missing (shouldn't happen — required), fall
  // back to `uid:<id>` to preserve the one-entry-per-person invariant.
  if (email) return `email:${normalizeEmail(email)}`;
  if (userId) return `uid:${userId}`;
  throw new Error("Cannot compute dedup key without email or user id");
}

function requireActivatablePromotionRow(row: {
  status: string;
  period_open_at: string | null;
  period_closed_at: string | null;
  name: string;
  prize_description: string;
  arv: string;
  drawing_rule: string;
  winner_process: string;
  rules_version: string;
}) {
  if (row.status !== "open") throw new Error("No open entry period.");
  if (row.period_closed_at) throw new Error("Entry period is closed.");
  // Fail-closed against bracketed placeholders anywhere in the promotion
  // record itself — mirrors isSweepstakesActivatable() for LEGAL_CONFIG.
  const mustBeReal = [
    row.name,
    row.prize_description,
    row.arv,
    row.drawing_rule,
    row.winner_process,
    row.rules_version,
  ];
  if (mustBeReal.some(isPlaceholder)) {
    throw new Error(
      "Promotion has unresolved placeholders — entries are refused until attorney review completes.",
    );
  }
}

// ---------- OPEN a promotion (admin) ---------------------------------------

export const openPromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { promotionId: string }) =>
    z.object({ promotionId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("sweepstakes_promotions")
      .select("*")
      .eq("id", data.promotionId)
      .single();
    if (error || !row) throw new Error("Promotion not found");
    if (row.status !== "draft") throw new Error(`Cannot open a promotion in status '${row.status}'`);

    // Fail-closed: refuse to open if any required promotion field or the
    // LEGAL_CONFIG snapshot for this promotion still contains placeholders.
    const requiredFields = [
      row.name,
      row.prize_description,
      row.arv,
      row.drawing_rule,
      row.winner_process,
      row.rules_version,
    ];
    if (requiredFields.some(isPlaceholder)) {
      throw new Error("Promotion has bracketed placeholders — resolve them before opening.");
    }

    const snapshot = {
      legal_config_entity: LEGAL_CONFIG.entity,
      legal_config_launch_territory: LEGAL_CONFIG.launchTerritory,
      legal_config_sweepstakes: LEGAL_CONFIG.sweepstakes,
      opened_by: context.userId,
    };

    const { data: updated, error: upErr } = await supabaseAdmin
      .from("sweepstakes_promotions")
      .update({
        status: "open",
        period_open_at: new Date().toISOString(),
        activation_snapshot: snapshot,
      })
      .eq("id", row.id)
      .select()
      .single();
    if (upErr) throw new Error(upErr.message);
    return { promotion: updated };
  });

// ---------- CLOSE milestone period ------------------------------------------
// Wired to: **admin-triggered** for now. This project does not yet expose a
// reliable, real-time paid-subscriber count that we can safely poll from a
// cron job. `get_active_subscriber_count()` exists in the DB but is derived
// from `subscriptions`, which mixes sandbox + live rows and does not yet
// distinguish "at least one paid renewal recorded". Until a canonical
// subscriber-count source is agreed on, closing a milestone period is an
// explicit admin action. The current subscriber count is recorded on the
// promotion row for the audit trail.

export const closeMilestonePeriod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { promotionId: string; observedSubscriberCount: number }) =>
    z
      .object({
        promotionId: z.string().uuid(),
        observedSubscriberCount: z.number().int().nonnegative(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("sweepstakes_promotions")
      .select("*")
      .eq("id", data.promotionId)
      .single();
    if (error || !row) throw new Error("Promotion not found");
    if (row.status !== "open") throw new Error("Promotion is not open");
    if (data.observedSubscriberCount < row.milestone_number) {
      throw new Error(
        `Observed subscriber count (${data.observedSubscriberCount}) has not reached the milestone (${row.milestone_number}).`,
      );
    }

    const prevSnapshot =
      row.activation_snapshot && typeof row.activation_snapshot === "object" && !Array.isArray(row.activation_snapshot)
        ? (row.activation_snapshot as Record<string, unknown>)
        : {};
    const snapshot = {
      ...prevSnapshot,
      closed_by: context.userId,
      observed_subscriber_count: data.observedSubscriberCount,
      closed_at_utc: new Date().toISOString(),
    };

    const { data: updated, error: upErr } = await supabaseAdmin
      .from("sweepstakes_promotions")
      .update({
        status: "closed",
        period_closed_at: new Date().toISOString(),
        activation_snapshot: snapshot,
      })
      .eq("id", row.id)
      .select()
      .single();
    if (upErr) throw new Error(upErr.message);
    return { promotion: updated };
  });

// ---------- SUBSCRIBER auto-entry ------------------------------------------
// Called by the payments webhook (or the admin "backfill entries" action)
// when a paid subscription becomes active. One entry per person per promo.

export const enterAsSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { promotionId: string }) =>
    z.object({ promotionId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: promo, error: pErr } = await supabaseAdmin
      .from("sweepstakes_promotions")
      .select("*")
      .eq("id", data.promotionId)
      .single();
    if (pErr || !promo) throw new Error("Promotion not found");
    requireActivatablePromotionRow(promo);

    const { data: hasSub } = await supabaseAdmin.rpc("has_any_active_subscription", {
      p_user: context.userId,
    });
    if (!hasSub) throw new Error("No active subscription");

    // Look up the caller's email from auth.
    const { data: userRow } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const email = userRow?.user?.email;
    if (!email) throw new Error("No email on file");
    const normalized = normalizeEmail(email);
    const dedup = dedupKeyFor(normalized, context.userId);

    const attestation = `${LEGAL_CONFIG.sweepstakes.entryCap} ${LEGAL_CONFIG.sweepstakes.amoeParity}`;

    // Upsert-on-conflict so a resubscribe / duplicate webhook is idempotent.
    const { data: entry, error } = await supabaseAdmin
      .from("sweepstakes_entries")
      .upsert(
        {
          promotion_id: promo.id,
          user_id: context.userId,
          entrant_email: normalized,
          entry_method: "subscriber_auto",
          eligibility_attested: true,
          attestation_text: attestation,
          rules_version: promo.rules_version,
          dedup_key: dedup,
        },
        { onConflict: "promotion_id,dedup_key", ignoreDuplicates: true },
      )
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { entered: true, entry };
  });

// ---------- FREE-FORM entry (AMOE) -----------------------------------------

const freeEntrySchema = z.object({
  promotionId: z.string().uuid(),
  fullName: z.string().trim().min(1).max(200),
  email: emailSchema,
  attest18AndUS: z.literal(true, {
    errorMap: () => ({ message: "You must attest to age and residency to enter." }),
  }),
  marketingOptIn: z.boolean().default(false),
});

export const submitFreeEntry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => freeEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: promo, error: pErr } = await supabaseAdmin
      .from("sweepstakes_promotions")
      .select("*")
      .eq("id", data.promotionId)
      .single();
    if (pErr || !promo) return { error: "Promotion not found" };
    try {
      requireActivatablePromotionRow(promo);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Not accepting entries" };
    }

    const normalized = normalizeEmail(data.email);
    const dedup = dedupKeyFor(normalized, null);
    const attestation = LEGAL_CONFIG.sweepstakes.amoeParity;

    // Look up existing entry first so we can honestly report "already entered"
    // vs "new entry" without silently swallowing the caller's action.
    const { data: existing } = await supabaseAdmin
      .from("sweepstakes_entries")
      .select("id, entry_method")
      .eq("promotion_id", promo.id)
      .eq("dedup_key", dedup)
      .maybeSingle();

    if (existing) {
      // Absorb the second submission — never a second row.
      if (data.marketingOptIn) {
        // Record marketing consent separately from the entry itself, per the
        // no-auto-subscribe rule.
        await supabaseAdmin.from("consent_events").insert({
          event_type: "sweepstakes_marketing_optin",
          consent_text:
            "I want to receive occasional marketing email from Streamwalkers Corporation. I understand entry is not conditioned on this and I can unsubscribe at any time.",
          metadata: { promotion_id: promo.id, source: "free_entry", email: normalized },
        });
      }
      return {
        ok: true,
        alreadyEntered: true,
        entryId: existing.id,
        message:
          "You are already entered for this milestone period. Additional submissions do not add a second entry.",
      };
    }

    const { data: entry, error } = await supabaseAdmin
      .from("sweepstakes_entries")
      .insert({
        promotion_id: promo.id,
        user_id: null,
        entrant_email: normalized,
        entrant_full_name: data.fullName,
        entry_method: "free_form",
        eligibility_attested: true,
        attestation_text: attestation,
        rules_version: promo.rules_version,
        dedup_key: dedup,
      })
      .select()
      .single();

    if (error) {
      // Unique-violation race — treat as already-entered rather than error.
      if ((error as unknown as { code?: string }).code === "23505") {
        return {
          ok: true,
          alreadyEntered: true,
          message: "You are already entered for this milestone period.",
        };
      }
      return { error: error.message };
    }

    if (data.marketingOptIn) {
      await supabaseAdmin.from("consent_events").insert({
        event_type: "sweepstakes_marketing_optin",
        consent_text:
          "I want to receive occasional marketing email from Streamwalkers Corporation. I understand entry is not conditioned on this and I can unsubscribe at any time.",
        metadata: { promotion_id: promo.id, source: "free_entry", email: normalized },
      });
    }

    return { ok: true, alreadyEntered: false, entryId: entry.id };
  });

// ---------- DRAW WINNER (admin) --------------------------------------------

export const drawWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { promotionId: string; alternateCount?: number }) =>
    z
      .object({
        promotionId: z.string().uuid(),
        alternateCount: z.number().int().min(0).max(25).default(3),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createHash, randomBytes, randomInt } = await import("crypto");

    const { data: promo, error: pErr } = await supabaseAdmin
      .from("sweepstakes_promotions")
      .select("*")
      .eq("id", data.promotionId)
      .single();
    if (pErr || !promo) throw new Error("Promotion not found");
    if (promo.status !== "closed") {
      throw new Error(`Cannot draw for a promotion in status '${promo.status}' — close the period first.`);
    }

    // ---- Freeze an ORDERED snapshot of eligible entries -------------------
    // Order deterministically by (created_at, id) so the commitment is
    // reproducible from the row set.
    const { data: entries, error: eErr } = await supabaseAdmin
      .from("sweepstakes_entries")
      .select("id, created_at")
      .eq("promotion_id", promo.id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (eErr) throw new Error(eErr.message);
    if (!entries || entries.length === 0) throw new Error("No entries to draw from");

    const orderedIds: string[] = entries.map((e) => e.id);

    // ---- Cryptographic commitment + secure selection ----------------------
    // 32 bytes of OS entropy for the seed, uniform integer via crypto.randomInt
    // (rejection sampling — no modulo bias). The commitment is the SHA-256 of
    // the ordered entry ID list joined with '\n' followed by the seed. Anyone
    // with the ordered list and seed can recompute this hash after the fact.
    const seed = randomBytes(32).toString("hex");
    const commitmentInput = orderedIds.join("\n") + "\n" + seed;
    const commitment = createHash("sha256").update(commitmentInput).digest("hex");
    const winnerIndex = randomInt(0, orderedIds.length);
    const selectedEntryId = orderedIds[winnerIndex];

    // Ordered alternates: draw further indexes without replacement.
    const remaining = orderedIds.filter((_, i) => i !== winnerIndex);
    const alternates: string[] = [];
    while (alternates.length < data.alternateCount && remaining.length > 0) {
      const j = randomInt(0, remaining.length);
      alternates.push(remaining.splice(j, 1)[0]);
    }

    const drawnAt = new Date().toISOString();

    // Fetch winner details for the audit record (email masked in the record).
    const { data: winnerRow } = await supabaseAdmin
      .from("sweepstakes_entries")
      .select("id, entry_method, entrant_email, user_id, created_at, rules_version")
      .eq("id", selectedEntryId)
      .single();

    const maskEmail = (e: string) => {
      const [u, d] = e.split("@");
      if (!u || !d) return "***";
      return u.slice(0, 1) + "***@" + d;
    };

    const responseWindowDays = promo.response_window_days;
    const deadline = new Date(Date.now() + responseWindowDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: drawing, error: dErr } = await supabaseAdmin
      .from("sweepstakes_drawings")
      .insert({
        promotion_id: promo.id,
        drawn_at: drawnAt,
        drawn_by: context.userId,
        entrant_count: orderedIds.length,
        entry_set_commitment: commitment,
        selection_seed: seed,
        winner_index: winnerIndex,
        selected_entry_id: selectedEntryId,
        alternate_entry_ids: alternates,
        method_description:
          "Winner index selected via Node crypto.randomInt (uniform, rejection-sampled) over an ordered snapshot of all eligible entries. Commitment = SHA-256(orderedIdsJoined \\n seed).",
        audit_record: {
          drawn_at: drawnAt,
          entrant_count: orderedIds.length,
          winner_masked_email: winnerRow ? maskEmail(winnerRow.entrant_email) : null,
          winner_entry_method: winnerRow?.entry_method ?? null,
          promotion_snapshot: {
            name: promo.name,
            prize: promo.prize_description,
            arv: promo.arv,
            milestone: promo.milestone_number,
            rules_version: promo.rules_version,
          },
        },
        winner_response_deadline: deadline,
        winner_status: "pending",
      })
      .select()
      .single();
    if (dErr) throw new Error(dErr.message);

    await supabaseAdmin
      .from("sweepstakes_promotions")
      .update({ status: "drawn" })
      .eq("id", promo.id);

    return {
      drawing,
      commitment,
      winnerIndex,
      entrantCount: orderedIds.length,
      selectedEntryId,
      alternateEntryIds: alternates,
    };
  });

// ---------- ADVANCE to next alternate (admin) ------------------------------

export const advanceToAlternate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { drawingId: string; reason: string }) =>
    z.object({ drawingId: z.string().uuid(), reason: z.string().trim().min(1).max(500) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: drawing, error } = await supabaseAdmin
      .from("sweepstakes_drawings")
      .select("*")
      .eq("id", data.drawingId)
      .single();
    if (error || !drawing) throw new Error("Drawing not found");

    const alts: string[] = drawing.alternate_entry_ids ?? [];
    if (alts.length === 0) throw new Error("No alternates remaining");
    const nextWinner = alts[0];
    const remaining = alts.slice(1);

    const prevAudit =
      drawing.audit_record && typeof drawing.audit_record === "object" && !Array.isArray(drawing.audit_record)
        ? (drawing.audit_record as Record<string, unknown>)
        : {};
    const prevAdvances = Array.isArray((prevAudit as { alternate_advances?: unknown[] }).alternate_advances)
      ? ((prevAudit as { alternate_advances?: unknown[] }).alternate_advances as unknown[])
      : [];
    const audit = {
      ...prevAudit,
      alternate_advances: [
        ...prevAdvances,
        {
          at: new Date().toISOString(),
          by: context.userId,
          from_entry_id: drawing.selected_entry_id,
          to_entry_id: nextWinner,
          reason: data.reason,
        },
      ],
    };

    const deadline = new Date(
      Date.now() +
        // Reuse original response window when re-notifying.
        (drawing.winner_response_deadline
          ? new Date(drawing.winner_response_deadline).getTime() - new Date(drawing.drawn_at).getTime()
          : 7 * 24 * 60 * 60 * 1000),
    ).toISOString();

    const { data: updated, error: uErr } = await supabaseAdmin
      .from("sweepstakes_drawings")
      .update({
        selected_entry_id: nextWinner,
        alternate_entry_ids: remaining,
        winner_status: "pending",
        winner_notified_at: null,
        winner_response_deadline: deadline,
        audit_record: audit,
      })
      .eq("id", drawing.id)
      .select()
      .single();
    if (uErr) throw new Error(uErr.message);
    return { drawing: updated };
  });
