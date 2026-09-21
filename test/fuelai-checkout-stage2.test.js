import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createIndividualCheckout,
  validateConfiguredPrice,
} from "../api/_lib/fuelai-checkout.js";

const priceIds = {
  FUELAI_STRIPE_PRICE_FITNESS_PUBLIC: "price_FitnessPublic",
  FUELAI_STRIPE_PRICE_FITNESS_MEMBER: "price_FitnessMember",
  FUELAI_STRIPE_PRICE_SPORTS_PUBLIC: "price_SportsPublic",
  FUELAI_STRIPE_PRICE_SPORTS_MEMBER: "price_SportsMember",
  FUELAI_STRIPE_PRICE_COMBAT_PUBLIC: "price_CombatPublic",
  FUELAI_STRIPE_PRICE_COMBAT_MEMBER: "price_CombatMember",
};

function context({
  body = { plan: "sports" },
  storedUser = {},
  uid = "athlete-1",
  priceOverride = {},
} = {}) {
  const calls = [];
  const env = {
    ...priceIds,
    FUELAI_STRIPE_SECRET_KEY: "sk_test_example",
    FUELAI_PUBLIC_ORIGIN: "https://fuelai.example",
  };
  const deps = {
    body,
    token: "verified-token",
    env,
    auth: {
      async verifyIdToken(token, checkRevoked) {
        calls.push(["auth", token, checkRevoked]);
        return { uid, email: "athlete@example.com", email_verified: true };
      },
    },
    db: {
      collection(name) {
        assert.equal(name, "users");
        return {
          doc(id) {
            calls.push(["user", id]);
            return {
              async get() {
                return { exists: true, data: () => storedUser };
              },
            };
          },
        };
      },
    },
    stripe: {
      async retrievePrice({ priceId }) {
        calls.push(["price", priceId]);
        const amount = priceId === priceIds.FUELAI_STRIPE_PRICE_SPORTS_MEMBER
          ? 1999 : 2499;
        return {
          id: priceId, active: true, currency: "usd", unit_amount: amount,
          type: "recurring", recurring: {
            interval: "month", interval_count: 1, usage_type: "licensed",
          },
          livemode: false, ...priceOverride,
        };
      },
      async createCheckoutSession({ fields }) {
        calls.push(["session", Object.fromEntries(fields)]);
        return {
          id: "cs_test_example",
          url: "https://checkout.stripe.com/c/pay/example",
        };
      },
    },
  };
  return { deps, calls };
}

test("only a canonical paid plan may be sent by the browser", async () => {
  for (const body of [
    { plan: "wellness" }, { plan: "team_30" }, { plan: "standard" },
    { plan: "sports", amount: 1 }, { plan: "sports", pricingAudience: "member" },
    { plan: "sports", priceId: "price_Forged" },
  ]) {
    const { deps, calls } = context({ body });
    await assert.rejects(createIndividualCheckout(deps), { statusCode: 400 });
    assert.equal(calls.length, 0);
  }
});

test("Firebase authentication is required and checked for revocation", async () => {
  const { deps, calls } = context();
  await assert.rejects(createIndividualCheckout({ ...deps, token: "" }), {
    statusCode: 401,
  });
  assert.equal(calls.length, 0);
  const result = await createIndividualCheckout(deps);
  assert.match(result.checkoutUrl, /^https:\/\/checkout\.stripe\.com\//);
  assert.deepEqual(calls[0], ["auth", "verified-token", true]);
  assert.deepEqual(calls[1], ["user", "athlete-1"]);
});

test("server-owned eligibility chooses member price; browser cannot choose it", async () => {
  const publicCheckout = context({
    storedUser: { pricingAudience: "member" },
  });
  await createIndividualCheckout(publicCheckout.deps);
  assert.deepEqual(publicCheckout.calls[2], ["price", priceIds.FUELAI_STRIPE_PRICE_SPORTS_PUBLIC]);
  const publicFields = publicCheckout.calls[3][1];
  assert.equal(publicFields["metadata[pricingAudience]"], "public");
  assert.equal(publicFields["line_items[0][quantity]"], "1");
  assert.equal(publicFields.client_reference_id, "athlete-1");

  const memberCheckout = context({
    storedUser: {
      memberPricingEligibility: { status: "verified", source: "server-verified" },
    },
  });
  await createIndividualCheckout(memberCheckout.deps);
  assert.deepEqual(memberCheckout.calls[2], ["price", priceIds.FUELAI_STRIPE_PRICE_SPORTS_MEMBER]);
  assert.equal(memberCheckout.calls[3][1]["metadata[pricingAudience]"], "member");
});

test("mismatched, inactive, one-time, or wrong-mode Stripe prices fail before Session creation", async () => {
  for (const priceOverride of [
    { active: false },
    { unit_amount: 1 },
    { currency: "eur" },
    { type: "one_time", recurring: null },
    { livemode: true },
  ]) {
    const { deps, calls } = context({ priceOverride });
    await assert.rejects(createIndividualCheckout(deps), { statusCode: 503 });
    assert.equal(calls.some(([kind]) => kind === "session"), false);
  }
});

test("invalid configuration and untrusted Checkout URL fail closed", async () => {
  const { deps } = context();
  await assert.rejects(createIndividualCheckout({
    ...deps, env: { ...deps.env, FUELAI_PUBLIC_ORIGIN: "http://example.com" },
  }), { statusCode: 503 });
  await assert.rejects(createIndividualCheckout({
    ...deps, stripe: {
      ...deps.stripe,
      async createCheckoutSession() {
        return { id: "cs_test_example", url: "https://example.com/phishing" };
      },
    },
  }), { statusCode: 502 });
});

test("success page is informational and never grants entitlement from redirect parameters", () => {
  const page = readFileSync(new URL("../public/success.html", import.meta.url), "utf8");
  assert.doesNotMatch(page, /localStorage|setup\.membership|params\.get\(["']plan/);
  assert.doesNotMatch(page, /Subscription Active|Membership activated/);
  const client = readFileSync(
    new URL("../public/assets/js/account/plans-checkout.js", import.meta.url),
    "utf8"
  );
  assert.match(client, /JSON\.stringify\(\{ plan \}\)/);
  assert.doesNotMatch(client, /priceId|amount|pricingAudience|localStorage/);
});
