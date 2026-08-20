import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { amountForPriceId } from "@/config/pricingTiers";

interface Props {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
  consentToken: string;
}

export function StripeEmbeddedCheckout({ priceId, customerEmail, userId, returnUrl, consentToken }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const secret = await createCheckoutSession({
      data: {
        priceId,
        customerEmail,
        userId,
        returnUrl: returnUrl || `${window.location.origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
        consentToken,
      },
    });
    if (!secret) throw new Error("Failed to create checkout session");

    // Fired only after Stripe hands back a session, so a failed create is not
    // counted as an abandoned checkout. trackMetaEvent() self-checks marketing
    // consent, so no gate is needed at the call site.
    const amount = amountForPriceId(priceId);
    trackMetaEvent("InitiateCheckout", {
      content_ids: [priceId],
      content_type: "product",
      num_items: 1,
      ...(amount === null ? {} : { value: amount, currency: "USD" }),
    });

    return secret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
