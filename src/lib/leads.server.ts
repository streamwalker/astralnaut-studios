/**
 * Server-only helpers for the leads system. Imported only from
 * `leads.functions.ts` handlers — never from a `.functions.ts` top-level
 * scope (would leak into the client bundle).
 */

const RESEND_GATEWAY = "https://connector-gateway.lovable.dev/resend/emails";

function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ||
    process.env.PUBLIC_SITE_URL ||
    "https://astralnautstudios.com";
  return url.replace(/\/$/, "");
}

interface SendConfirmArgs {
  email: string;
  token: string;
  seriesSlug: string | null;
}

/**
 * Sends a double-opt-in confirmation email via Resend (through the Lovable
 * connector gateway). Silently no-ops when keys aren't configured so the
 * lead capture flow itself never fails.
 */
export async function sendConfirmEmail({ email, token, seriesSlug }: SendConfirmArgs): Promise<void> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    console.warn("[leads] Email not sent — RESEND_API_KEY or LOVABLE_API_KEY missing");
    return;
  }

  const site = getSiteUrl();
  const confirmUrl = `${site}/api/public/leads/confirm?token=${encodeURIComponent(token)}`;
  const seriesLine = seriesSlug
    ? `<p style="color:#9aa3b2;font-size:13px;margin:0 0 16px;">You'll get an alert the moment new <strong>${escapeHtml(seriesSlug)}</strong> pages drop.</p>`
    : "";

  const html = `
<!doctype html><html><body style="background:#0a0a0f;color:#e9edf5;font-family:-apple-system,Segoe UI,sans-serif;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#11131a;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:28px;">
    <div style="font-size:11px;letter-spacing:3px;font-weight:800;color:#22d3ff;text-transform:uppercase;">Real World Comics</div>
    <h1 style="font-size:24px;line-height:1.2;margin:12px 0 16px;">Confirm your email to get drop alerts</h1>
    ${seriesLine}
    <p style="margin:0 0 24px;color:#cfd6e4;">Click below to confirm and we'll notify you the second new pages go live. No spam — just drop alerts.</p>
    <p style="margin:0 0 24px;">
      <a href="${confirmUrl}" style="display:inline-block;padding:12px 22px;background:linear-gradient(90deg,#22d3ff,#8b5cf6);color:#02000c;font-weight:800;text-decoration:none;border-radius:10px;">Confirm my email</a>
    </p>
    <p style="font-size:12px;color:#6b7280;margin:24px 0 0;">If you didn't sign up, just ignore this — we won't email again.</p>
  </div>
</body></html>`;

  try {
    const res = await fetch(RESEND_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: "Real World Comics <hello@astralnautstudios.com>",
        to: [email],
        subject: "Confirm your email — Real World Comics drop alerts",
        html,
      }),
    });
    if (!res.ok) {
      console.error("[leads] Resend send failed", res.status, await res.text());
    }
  } catch (e) {
    console.error("[leads] Resend send threw", e);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
