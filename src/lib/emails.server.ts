// Server-only email helpers. Uses Resend via the Lovable connector gateway
// when RESEND_API_KEY is configured; otherwise no-ops and logs a queue notice
// so downstream infrastructure work (Stage 4/5) can pick up the pending sends.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = "Real World Comics <noreply@astralnautstudios.com>";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

async function send(payload: EmailPayload): Promise<{ sent: boolean; queued: boolean; error?: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    console.warn("[email] RESEND_API_KEY missing — queued in log only", {
      to: payload.to,
      subject: payload.subject,
    });
    return { sent: false, queued: true };
  }
  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: FROM,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[email] Resend gateway error", res.status, text);
      return { sent: false, queued: false, error: `${res.status}: ${text}` };
    }
    return { sent: true, queued: false };
  } catch (err) {
    console.error("[email] send failure", err);
    return { sent: false, queued: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

function shell(title: string, inner: string): string {
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0B0E1C;color:#e6e8f2;padding:32px">
    <div style="max-width:560px;margin:0 auto;background:#0F1424;border:1px solid #1e2b46;border-radius:12px;padding:28px">
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#FFB840;font-weight:800">Real World Comics</div>
      <h1 style="font-size:22px;margin:8px 0 16px 0;color:#fff">${title}</h1>
      ${inner}
      <hr style="border:none;border-top:1px solid #1e2b46;margin:24px 0">
      <div style="font-size:11px;color:#8a92ad;line-height:1.6">
        Streamwalkers Corporation · billing@astralnautstudios.com · support@astralnautstudios.com<br>
        Pending attorney review.
      </div>
    </div>
  </body></html>`;
}

export async function sendSubscriptionConfirmationEmail(args: {
  to: string;
  planName: string;
  displayedPrice: number;
  currency: string;
  billingInterval: "monthly" | "yearly";
  nextChargeDate: Date | null;
  cancelUrl: string;
}) {
  const price = `$${args.displayedPrice.toFixed(2)} ${args.currency.toUpperCase()}`;
  const period = args.billingInterval === "yearly" ? "annually" : "monthly";
  const next = args.nextChargeDate ? args.nextChargeDate.toLocaleDateString() : "on the next billing date";
  const html = shell(
    "You're subscribed",
    `
    <p style="color:#c9cee0;line-height:1.6">Thanks for subscribing to <strong>${args.planName}</strong>. Here are your terms of record:</p>
    <table style="width:100%;font-size:14px;color:#c9cee0;margin-top:12px">
      <tr><td style="padding:6px 0;color:#8a92ad">Plan</td><td style="text-align:right"><strong>${args.planName}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#8a92ad">Price</td><td style="text-align:right">${price} billed ${period}</td></tr>
      <tr><td style="padding:6px 0;color:#8a92ad">Auto-renewal</td><td style="text-align:right">Yes, until you cancel</td></tr>
      <tr><td style="padding:6px 0;color:#8a92ad">Next charge</td><td style="text-align:right">${next}</td></tr>
    </table>
    <p style="color:#c9cee0;line-height:1.6;margin-top:16px">You can cancel any time in one click from your account. Access continues through the end of the current paid term.</p>
    <p style="margin-top:20px"><a href="${args.cancelUrl}" style="background:#22D3FF;color:#02000c;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:800;display:inline-block">Manage or cancel subscription</a></p>
    `,
  );
  return send({ to: args.to, subject: `Your ${args.planName} subscription is active`, html });
}

export async function sendCancellationConfirmationEmail(args: {
  to: string;
  planName: string;
  effectiveEndDate: Date | null;
  confirmationNumber: string;
}) {
  const end = args.effectiveEndDate ? args.effectiveEndDate.toLocaleDateString() : "the end of your current period";
  const html = shell(
    "Cancellation confirmed",
    `
    <p style="color:#c9cee0;line-height:1.6">We've scheduled cancellation of your <strong>${args.planName}</strong> subscription.</p>
    <table style="width:100%;font-size:14px;color:#c9cee0;margin-top:12px">
      <tr><td style="padding:6px 0;color:#8a92ad">Plan</td><td style="text-align:right"><strong>${args.planName}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#8a92ad">Access continues until</td><td style="text-align:right">${end}</td></tr>
      <tr><td style="padding:6px 0;color:#8a92ad">Confirmation number</td><td style="text-align:right"><code>${args.confirmationNumber}</code></td></tr>
    </table>
    <p style="color:#c9cee0;line-height:1.6;margin-top:16px">No further charges will occur. If this cancellation was a mistake, you can re-subscribe from your account before the effective end date to avoid interruption.</p>
    `,
  );
  return send({ to: args.to, subject: `Your subscription has been cancelled`, html });
}

export async function sendAnnualRenewalReminderEmail(args: {
  to: string;
  planName: string;
  renewalDate: Date;
  displayedPrice: number;
  currency: string;
  cancelUrl: string;
}) {
  const price = `$${args.displayedPrice.toFixed(2)} ${args.currency.toUpperCase()}`;
  const html = shell(
    "Your annual subscription renews soon",
    `
    <p style="color:#c9cee0;line-height:1.6">Your <strong>${args.planName}</strong> subscription will automatically renew on <strong>${args.renewalDate.toLocaleDateString()}</strong> for <strong>${price}</strong>.</p>
    <p style="color:#c9cee0;line-height:1.6">If you'd like to change plans, cancel, or update your payment method, you can do so any time before the renewal date.</p>
    <p style="margin-top:20px"><a href="${args.cancelUrl}" style="background:#22D3FF;color:#02000c;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:800;display:inline-block">Review my subscription</a></p>
    `,
  );
  return send({ to: args.to, subject: `Your ${args.planName} plan renews on ${args.renewalDate.toLocaleDateString()}`, html });
}

export async function sendPriceChangeNoticeEmail(args: {
  to: string;
  planName: string;
  currentPrice: number;
  newPrice: number;
  currency: string;
  effectiveDate: Date;
  cancelUrl: string;
}) {
  const cur = `$${args.currentPrice.toFixed(2)} ${args.currency.toUpperCase()}`;
  const nu = `$${args.newPrice.toFixed(2)} ${args.currency.toUpperCase()}`;
  const html = shell(
    "Upcoming price change",
    `
    <p style="color:#c9cee0;line-height:1.6">We're writing to let you know the price of your <strong>${args.planName}</strong> subscription will change on <strong>${args.effectiveDate.toLocaleDateString()}</strong>.</p>
    <table style="width:100%;font-size:14px;color:#c9cee0;margin-top:12px">
      <tr><td style="padding:6px 0;color:#8a92ad">Current price</td><td style="text-align:right">${cur}</td></tr>
      <tr><td style="padding:6px 0;color:#8a92ad">New price</td><td style="text-align:right"><strong>${nu}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#8a92ad">Effective</td><td style="text-align:right">${args.effectiveDate.toLocaleDateString()}</td></tr>
    </table>
    <p style="color:#c9cee0;line-height:1.6;margin-top:16px">You do not need to take any action if you wish to continue. If you'd prefer to change or cancel, you can do so before the effective date.</p>
    <p style="margin-top:20px"><a href="${args.cancelUrl}" style="background:#22D3FF;color:#02000c;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:800;display:inline-block">Manage my subscription</a></p>
    `,
  );
  return send({ to: args.to, subject: `Upcoming price change for your ${args.planName} plan`, html });
}
