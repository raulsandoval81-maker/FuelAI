const STRIPE_API = "https://api.stripe.com/v1";

async function stripeRequest({ secret, path, fields, fetchImpl = fetch }) {
  const response = await fetchImpl(`${STRIPE_API}${path}`, {
    method: fields ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(fields ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(fields ? { body: fields.toString() } : {}),
  });
  if (!response.ok) throw new Error("Stripe checkout request failed");
  return response.json();
}

export const stripeCheckoutHttp = {
  retrievePrice({ secret, priceId, fetchImpl }) {
    return stripeRequest({
      secret, path: `/prices/${encodeURIComponent(priceId)}`, fetchImpl,
    });
  },
  createCheckoutSession({ secret, fields, fetchImpl }) {
    return stripeRequest({
      secret, path: "/checkout/sessions", fields, fetchImpl,
    });
  },
};
