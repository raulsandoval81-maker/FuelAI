import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import {
  StripeWebhookError,
  expectedStripeLiveMode,
  fulfillStripeSubscriptionEvent,
  parseStripeEvent,
  subscriptionUpdateFromEvent,
  verifyStripeSignature,
} from "../api/_lib/stripe-webhook.js";

function signed(payload, secret, timestamp) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.`)
    .update(payload)
    .digest("hex");
}

function subscriptionEvent(overrides = {}) {
  return {
    id: "evt_test123",
    type: "customer.subscription.updated",
    livemode: false,
    created: 1_800_000_000,
    data: {
      object: {
        id: "sub_test123",
        customer: "cus_test123",
        status: "active",
        current_period_end: 1_800_100_000,
        cancel_at_period_end: false,
        metadata: {
          uid: "user-1",
          plan: "sports",
          pricingAudience: "public",
        },
      },
    },
    ...overrides,
  };
}

function fakeDb(seed = {}) {
  const docs = new Map(Object.entries(seed));
  const ref = (path) => ({
    path,
    collection(name) { return ref(`${path}/${name}`); },
    doc(name) { return ref(`${path}/${name}`); },
  });
  return {
    docs,
    collection(name) { return ref(name); },
    async runTransaction(fn) {
      const tx = {
        async get(reference) {
          const value = docs.get(reference.path);
          return {
            exists: value !== undefined,
            data() { return value; },
          };
        },
        set(reference, value, options) {
          if (options?.merge && docs.has(reference.path)) {
            docs.set(reference.path, { ...docs.get(reference.path), ...value });
          } else {
            docs.set(reference.path, value);
          }
        },
      };
      return fn(tx);
    },
  };
}

const fieldValue = {
  serverTimestamp() { return "SERVER_TS"; },
};

test("Stripe signature verification accepts current valid v1 signature", () => {
  const secret = "whsec_testsecret";
  const timestamp = 1_800_000_000;
  const payload = Buffer.from('{"id":"evt_test123"}');
  const signature = signed(payload, secret, timestamp);
  assert.equal(
    verifyStripeSignature({
      payload,
      secret,
      signatureHeader: `t=${timestamp},v1=${signature}`,
      nowSeconds: timestamp + 30,
    }),
    timestamp
  );
});

test("Stripe signature verification rejects tampering and expired requests", () => {
  const secret = "whsec_testsecret";
  const timestamp = 1_800_000_000;
  const payload = Buffer.from('{"id":"evt_test123"}');
  const signature = signed(payload, secret, timestamp);

  assert.throws(
    () => verifyStripeSignature({
      payload: Buffer.from('{"id":"evt_changed"}'),
      secret,
      signatureHeader: `t=${timestamp},v1=${signature}`,
      nowSeconds: timestamp,
    }),
    StripeWebhookError
  );

  assert.throws(
    () => verifyStripeSignature({
      payload,
      secret,
      signatureHeader: `t=${timestamp},v1=${signature}`,
      nowSeconds: timestamp + 301,
    }),
    /Expired Stripe signature/
  );
});

test("Stripe mode derives from server secret key", () => {
  assert.equal(expectedStripeLiveMode("sk_test_abc"), false);
  assert.equal(expectedStripeLiveMode("sk_live_abc"), true);
  assert.throws(() => expectedStripeLiveMode("bad"), /not configured/);
});

test("subscription event produces canonical paid entitlement update", () => {
  const update = subscriptionUpdateFromEvent(subscriptionEvent(), false);
  assert.equal(update.uid, "user-1");
  assert.equal(update.plan, "sports");
  assert.equal(update.active, true);
  assert.equal(update.revoke, false);
});

test("unsupported signed Stripe events are acknowledged without fulfillment", () => {
  const event = subscriptionEvent({ type: "invoice.paid" });
  assert.equal(subscriptionUpdateFromEvent(event, false), null);
});

test("active subscription writes server-authoritative plan and is idempotent", async () => {
  const db = fakeDb({
    "users/user-1": { uid: "user-1", email: "a@example.com" },
  });
  const update = subscriptionUpdateFromEvent(subscriptionEvent(), false);

  const first = await fulfillStripeSubscriptionEvent({ db, fieldValue, update });
  assert.equal(first.ignored, false);
  assert.equal(db.docs.get("users/user-1").plan, "sports");
  assert.equal(db.docs.get("users/user-1").billing.stripeSubscriptionId, "sub_test123");

  const second = await fulfillStripeSubscriptionEvent({ db, fieldValue, update });
  assert.equal(second.ignored, true);
  assert.equal(second.reason, "duplicate");
});

test("canceled current subscription revokes to wellness but stale old cancellation cannot", async () => {
  const db = fakeDb({
    "users/user-1": {
      uid: "user-1",
      plan: "combat",
      billing: {
        stripeSubscriptionId: "sub_newer",
        lastStripeEventCreated: 1_800_000_100,
      },
    },
  });

  const stale = subscriptionUpdateFromEvent(subscriptionEvent({
    id: "evt_old",
    type: "customer.subscription.deleted",
    created: 1_800_000_000,
    data: {
      object: {
        id: "sub_test123",
        customer: "cus_test123",
        status: "canceled",
        metadata: { uid: "user-1", plan: "sports", pricingAudience: "public" },
      },
    },
  }), false);

  const staleResult = await fulfillStripeSubscriptionEvent({ db, fieldValue, update: stale });
  assert.equal(staleResult.reason, "stale");
  assert.equal(db.docs.get("users/user-1").plan, "combat");

  const current = subscriptionUpdateFromEvent(subscriptionEvent({
    id: "evt_new",
    type: "customer.subscription.deleted",
    created: 1_800_000_200,
    data: {
      object: {
        id: "sub_newer",
        customer: "cus_test123",
        status: "canceled",
        metadata: { uid: "user-1", plan: "combat", pricingAudience: "public" },
      },
    },
  }), false);

  const currentResult = await fulfillStripeSubscriptionEvent({ db, fieldValue, update: current });
  assert.equal(currentResult.ignored, false);
  assert.equal(db.docs.get("users/user-1").plan, "wellness");
});

test("raw Stripe payload parser rejects malformed JSON", () => {
  assert.equal(parseStripeEvent(Buffer.from('{"ok":true}')).ok, true);
  assert.throws(() => parseStripeEvent(Buffer.from("{")), /Invalid Stripe webhook payload/);
});
