import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LEGAL_CONFIG, renderCheckoutConsentText, isPlaceholder } from "@/config/legal";

interface Props {
  planName: string;
  displayedPrice: number;
  currency: string;
  billingInterval: "monthly" | "yearly";
  onCancel: () => void;
  /** Called with (consentText) once the user affirmatively accepts. Parent
   *  is expected to POST to recordCheckoutConsent then open Stripe. */
  onAccept: (consentText: string) => Promise<void> | void;
}

export function CheckoutConsentPanel({
  planName,
  displayedPrice,
  currency,
  billingInterval,
  onCancel,
  onAccept,
}: Props) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showError, setShowError] = useState(false);

  // Fail-closed: if the real price/interval is not usable, block checkout.
  const priceInvalid =
    !Number.isFinite(displayedPrice) ||
    displayedPrice <= 0 ||
    !currency ||
    isPlaceholder(currency);

  const displayedPriceStr = priceInvalid ? "" : `$${displayedPrice.toFixed(2)} ${currency.toUpperCase()}`;
  const consentText = priceInvalid ? "" : renderCheckoutConsentText(billingInterval, displayedPriceStr);
  const period = billingInterval === "yearly" ? "annually" : "monthly";
  const cadence = billingInterval === "yearly" ? "each year" : "each month";

  if (priceInvalid) {
    return (
      <div className="rounded-md border border-red-500/50 bg-red-500/10 p-6 text-sm text-red-200">
        <div className="text-[10px] font-bold uppercase tracking-[2px] text-red-300">
          Checkout unavailable
        </div>
        <p className="mt-2">
          This plan's pricing configuration is incomplete. Checkout is disabled
          until the price and currency are set. Please contact billing@astralnautstudios.com.
        </p>
        <button onClick={onCancel} className="btn-ghost mt-4">Close</button>
      </div>
    );
  }

  const handleClick = async () => {
    if (!checked) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setBusy(true);
    try {
      await onAccept(consentText);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-2">
      <div className="rounded-md border border-[var(--border-line)] bg-black/30 p-5">
        <div className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">
          Confirm your subscription
        </div>
        <h2 className="mt-2 text-2xl font-black">{planName}</h2>
        <dl className="mt-4 grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2">
          <dt className="text-[var(--mute)]">Recurring price</dt>
          <dd className="sm:text-right"><strong>{displayedPriceStr}</strong> billed {period}, plus applicable tax</dd>
          <dt className="text-[var(--mute)]">Billing interval</dt>
          <dd className="sm:text-right">{billingInterval === "yearly" ? "Every 12 months" : "Every month"}</dd>
          <dt className="text-[var(--mute)]">Automatic renewal</dt>
          <dd className="sm:text-right">Yes — renews {cadence} until you cancel</dd>
          <dt className="text-[var(--mute)]">Cancel method</dt>
          <dd className="sm:text-right">Account → Subscription → Cancel Subscription</dd>
          <dt className="text-[var(--mute)]">Refund policy</dt>
          <dd className="sm:text-right">All fees are non-refundable except where required by law</dd>
        </dl>
        <p className="mt-3 text-[11px] text-[var(--mute)]">
          Terms v{LEGAL_CONFIG.documents.terms.version} · Subscription &amp; Billing v{LEGAL_CONFIG.documents.subscription.version} ·
          Privacy v{LEGAL_CONFIG.documents.privacy.version} · Renewal disclosure v{LEGAL_CONFIG.renewalDisclosureVersion}
        </p>
      </div>

      <label
        htmlFor="checkout-consent"
        className={`mt-4 flex items-start gap-3 rounded-md border p-4 text-sm ${
          showError && !checked
            ? "border-red-500 bg-red-500/10"
            : "border-[var(--border-line)] bg-black/20"
        }`}
      >
        <input
          id="checkout-consent"
          type="checkbox"
          checked={checked}
          onChange={(e) => { setChecked(e.target.checked); if (e.target.checked) setShowError(false); }}
          aria-describedby={showError && !checked ? "checkout-consent-error" : undefined}
          aria-invalid={showError && !checked}
          className="mt-1"
        />
        <span className="text-[var(--ink2)]">
          {consentText}{" "}
          (<Link to="/terms" target="_blank" rel="noopener" className="underline hover:text-[var(--neon)]">Terms of Service</Link>,{" "}
          <Link to="/subscription-policy" target="_blank" rel="noopener" className="underline hover:text-[var(--neon)]">Subscription and Billing Policy</Link>,{" "}
          <Link to="/privacy" target="_blank" rel="noopener" className="underline hover:text-[var(--neon)]">Privacy Policy</Link>).
        </span>
      </label>

      <div
        id="checkout-consent-error"
        role="alert"
        aria-live="polite"
        className="mt-2 min-h-[1.25rem] text-xs text-red-400"
      >
        {showError && !checked ? "Please review and accept the subscription terms to continue." : ""}
      </div>

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button onClick={onCancel} className="btn-ghost" disabled={busy}>Cancel</button>
        <button onClick={handleClick} className="btn-cta" disabled={busy}>
          {busy ? "Preparing checkout…" : "Continue to payment →"}
        </button>
      </div>
    </div>
  );
}
