import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

/**
 * Stubbed game-events webhook. External game servers POST signed JSON.
 *
 * Headers:
 *   x-archive-signature: hex HMAC-SHA256 of the raw body, keyed with
 *                         ARCHIVE_GAME_EVENTS_HMAC_SECRET
 *   x-archive-timestamp: unix ms; rejected if > 5 minutes skew
 *
 * Body shape (validated below). Event kinds:
 *   - 'milestone'     → grants xp + tokens
 *   - 'activity'      → small token stipend (rate-limited downstream)
 *   - 'proficiency'   → xp only, maintains rank
 */
const EVENT = z.object({
  user_id: z.string().uuid(),
  kind: z.enum(["milestone", "activity", "proficiency"]),
  xp: z.number().int().min(0).max(50_000).default(0),
  tokens: z.number().int().min(0).max(10_000).default(0),
  source: z.string().min(1).max(64),
  reason: z.string().min(1).max(200),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const BODY = z.object({
  timestamp: z.number().int(),
  events: z.array(EVENT).min(1).max(100),
});

function verifySignature(raw: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/game-events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.ARCHIVE_GAME_EVENTS_HMAC_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 503 });

        const signature = request.headers.get("x-archive-signature") ?? "";
        const tsHeader = request.headers.get("x-archive-timestamp") ?? "";
        if (!signature || !tsHeader) return new Response("Missing signature", { status: 401 });

        const ts = Number(tsHeader);
        if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
          return new Response("Stale timestamp", { status: 401 });
        }

        const raw = await request.text();
        if (!verifySignature(raw, signature, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let parsed: z.infer<typeof BODY>;
        try {
          parsed = BODY.parse(JSON.parse(raw));
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Ensure wallet rows
        const userIds = [...new Set(parsed.events.map((e) => e.user_id))];
        await supabaseAdmin
          .from("archive_wallets")
          .upsert(userIds.map((user_id) => ({ user_id })), { onConflict: "user_id" });

        const ledgerRows: Array<Record<string, unknown>> = [];
        const walletDeltas = new Map<string, { xp: number; tokens: number }>();

        for (const ev of parsed.events) {
          const cur = walletDeltas.get(ev.user_id) ?? { xp: 0, tokens: 0 };
          cur.xp += ev.xp;
          cur.tokens += ev.tokens;
          walletDeltas.set(ev.user_id, cur);

          if (ev.xp > 0) {
            ledgerRows.push({
              user_id: ev.user_id, kind: "xp", delta: ev.xp,
              reason: ev.reason, source: ev.source, metadata: ev.metadata ?? {},
            });
          }
          if (ev.tokens > 0) {
            ledgerRows.push({
              user_id: ev.user_id, kind: "token", delta: ev.tokens,
              reason: ev.reason, source: ev.source, metadata: ev.metadata ?? {},
            });
          }
        }

        if (ledgerRows.length > 0) {
          await supabaseAdmin.from("archive_wallet_ledger").insert(ledgerRows);
        }

        for (const [user_id, d] of walletDeltas) {
          if (d.xp === 0 && d.tokens === 0) continue;
          const { data: row } = await supabaseAdmin
            .from("archive_wallets")
            .select("xp, tokens, lifetime_tokens")
            .eq("user_id", user_id)
            .maybeSingle();
          await supabaseAdmin
            .from("archive_wallets")
            .update({
              xp: (row?.xp ?? 0) + d.xp,
              tokens: (row?.tokens ?? 0) + d.tokens,
              lifetime_tokens: (row?.lifetime_tokens ?? 0) + d.tokens,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user_id);
        }

        return Response.json({ ok: true, processed: parsed.events.length });
      },
    },
  },
});
