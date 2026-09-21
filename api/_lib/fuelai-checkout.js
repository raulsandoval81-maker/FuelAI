import { catalogPriceFor } from "./fuelai-billing-catalog.js";
import { pricingAudienceFromTrustedUser } from "./fuelai-billing-entitlements.js";

const PAID_PLANS = new Set(["fitness", "sports", "combat"]);

export class CheckoutError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function checkoutPlanFromBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 1 || !PAID_PLANS.has(body.plan)) {
    throw new CheckoutError(400, "Choose a valid paid FuelAI plan.");
  }
  return body.plan;
}

export function validateConfiguredPrice(price, expected, priceId, testMode) {
  if (!price || price.id !== priceId || price.active !== true ||
      price.currency !== expected.currency ||
      price.unit_amount !== expected.monthlyCents ||
      price.type !== "recurring" || price.recurring?.interval !== "month" ||
      price.recurring?.interval_count !== 1 ||
      price.recurring?.usage_type !== "licensed" ||
      price.livemode === testMode) {
    throw new CheckoutError(503, "FuelAI checkout price is not configured correctly.");
  }
}

export function checkoutOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash) throw new Error();
    return url.origin;
  } catch {
    throw new CheckoutError(503, "FuelAI checkout is not configured.");
  }
}

export async function createIndividualCheckout({
  body, token, auth, db, stripe, env,
}) {
  const plan = checkoutPlanFromBody(body);
  if (!token) throw new CheckoutError(401, "Sign in to continue.");

  let user;
  try {
    user = await auth.verifyIdToken(token, true);
  } catch {
    throw new CheckoutError(401, "Sign in again to continue.");
  }
  if (!user?.uid) throw new CheckoutError(401, "Sign in again to continue.");

  const userSnapshot = await db.collection("users").doc(user.uid).get();
  const storedUser = userSnapshot.exists ? userSnapshot.data() || {} : {};
  const audience = pricingAudienceFromTrustedUser(storedUser);
  const expected = catalogPriceFor(plan, audience);
  const priceId = String(env[expected.priceEnv] || "").trim();
  const secret = String(env.FUELAI_STRIPE_SECRET_KEY || "").trim();
  const testMode = secret.startsWith("sk_test_");
  if (!/^price_[A-Za-z0-9]+$/.test(priceId) ||
      (!testMode && !secret.startsWith("sk_live_"))) {
    throw new CheckoutError(503, "FuelAI checkout is not configured.");
  }
  const origin = checkoutOrigin(env.FUELAI_PUBLIC_ORIGIN);

  const price = await stripe.retrievePrice({ secret, priceId });
  validateConfiguredPrice(price, expected, priceId, testMode);

  const fields = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    client_reference_id: user.uid,
    success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/account/plans.html?checkout=cancelled`,
    "metadata[uid]": user.uid,
    "metadata[plan]": plan,
    "metadata[pricingAudience]": audience,
    "subscription_data[metadata][uid]": user.uid,
    "subscription_data[metadata][plan]": plan,
    "subscription_data[metadata][pricingAudience]": audience,
  });
  if (user.email && user.email_verified === true) {
    fields.set("customer_email", user.email);
  }

  const session = await stripe.createCheckoutSession({ secret, fields });
  let checkoutUrl;
  try {
    checkoutUrl = new URL(session?.url);
  } catch {
    throw new CheckoutError(502, "Stripe did not return a checkout link.");
  }
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(session?.id || "") ||
      checkoutUrl.protocol !== "https:" ||
      checkoutUrl.hostname !== "checkout.stripe.com") {
    throw new CheckoutError(502, "Stripe did not return a valid checkout link.");
  }
  return { checkoutUrl: checkoutUrl.toString(), checkoutSessionId: session.id };
}
