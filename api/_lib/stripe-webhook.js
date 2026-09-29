import crypto from "node:crypto";

const PAID_PLANS = new Set(["fitness", "sports", "combat"]);
const AUDIENCES = new Set(["public", "member"]);
const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const REVOKE_STATUSES = new Set(["canceled", "unpaid", "incomplete_expired"]);
const SUPPORTED_TYPES = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export class StripeWebhookError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function safeEqualHex(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(left || "") || !/^[a-f0-9]{64}$/i.test(right || "")) {
    return false;
  }
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyStripeSignature({
  payload,
  signatureHeader,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
}) {
  if (!Buffer.isBuffer(payload)) {
    throw new StripeWebhookError(400, "Webhook body must be raw bytes.");
  }
  if (!String(secret || "").startsWith("whsec_")) {
    throw new StripeWebhookError(503, "Stripe webhook is not configured.");
  }

  const parts = String(signatureHeader || "").split(",").map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));
  const timestamp = Number(timestampPart?.slice(2));

  if (!Number.isInteger(timestamp) || !signatures.length) {
    throw new StripeWebhookError(400, "Invalid Stripe signature.");
  }
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
    throw new StripeWebhookError(400, "Expired Stripe signature.");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.`)
    .update(payload)
    .digest("hex");

  if (!signatures.some((signature) => safeEqualHex(signature, expected))) {
    throw new StripeWebhookError(400, "Invalid Stripe signature.");
  }
  return timestamp;
}

export function parseStripeEvent(payload) {
  try {
    const event = JSON.parse(Buffer.isBuffer(payload) ? payload.toString("utf8") : String(payload || ""));
    if (!event || typeof event !== "object" || Array.isArray(event)) throw new Error();
    return event;
  } catch {
    throw new StripeWebhookError(400, "Invalid Stripe webhook payload.");
  }
}

export function expectedStripeLiveMode(secretKey) {
  const key = String(secretKey || "").trim();
  if (key.startsWith("sk_test_")) return false;
  if (key.startsWith("sk_live_")) return true;
  throw new StripeWebhookError(503, "Stripe billing is not configured.");
}

export function subscriptionUpdateFromEvent(event, expectedLiveMode) {
  if (!event || typeof event !== "object") {
    throw new StripeWebhookError(400, "Invalid Stripe event.");
  }
  if (!/^evt_[A-Za-z0-9]+$/.test(String(event.id || ""))) {
    throw new StripeWebhookError(400, "Invalid Stripe event id.");
  }
  if (event.livemode !== expectedLiveMode) {
    throw new StripeWebhookError(400, "Stripe event mode does not match billing configuration.");
  }
  if (!SUPPORTED_TYPES.has(event.type)) return null;

  const subscription = event.data?.object;
  const uid = String(subscription?.metadata?.uid || "").trim();
  const plan = String(subscription?.metadata?.plan || "").trim().toLowerCase();
  const pricingAudience = String(subscription?.metadata?.pricingAudience || "").trim().toLowerCase();
  const subscriptionId = String(subscription?.id || "").trim();
  const customerId = typeof subscription?.customer === "string" ? subscription.customer : "";
  const status = String(subscription?.status || "").trim();
  const created = Number(event.created);

  if (!uid || uid.length > 128 || !/^sub_[A-Za-z0-9]+$/.test(subscriptionId) ||
      (customerId && !/^cus_[A-Za-z0-9]+$/.test(customerId)) ||
      !PAID_PLANS.has(plan) || !AUDIENCES.has(pricingAudience) ||
      !Number.isInteger(created) || created <= 0) {
    throw new StripeWebhookError(400, "Stripe subscription metadata is invalid.");
  }

  return {
    eventId: event.id,
    eventType: event.type,
    eventCreated: created,
    uid,
    plan,
    pricingAudience,
    subscriptionId,
    customerId: customerId || null,
    status,
    active: ACTIVE_STATUSES.has(status),
    revoke: event.type === "customer.subscription.deleted" || REVOKE_STATUSES.has(status),
    currentPeriodEnd: Number.isInteger(subscription.current_period_end)
      ? subscription.current_period_end : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
  };
}

export async function fulfillStripeSubscriptionEvent({
  db,
  fieldValue,
  update,
}) {
  if (!update) return { ignored: true, reason: "unsupported_event" };

  const eventRef = db.collection("system").doc("billing").collection("stripeEvents").doc(update.eventId);
  const userRef = db.collection("users").doc(update.uid);

  return db.runTransaction(async (transaction) => {
    const [eventSnapshot, userSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(userRef),
    ]);

    if (eventSnapshot.exists) {
      return { ignored: true, reason: "duplicate", uid: update.uid };
    }

    const user = userSnapshot.exists ? userSnapshot.data() || {} : {};
    const billing = user.billing && typeof user.billing === "object" ? user.billing : {};
    const lastEventCreated = Number(billing.lastStripeEventCreated || 0);

    if (lastEventCreated > update.eventCreated) {
      transaction.set(eventRef, {
        type: update.eventType,
        uid: update.uid,
        ignored: true,
        reason: "stale",
        processedAt: fieldValue.serverTimestamp(),
      });
      return { ignored: true, reason: "stale", uid: update.uid };
    }

    const nextBilling = {
      provider: "stripe",
      stripeCustomerId: update.customerId,
      stripeSubscriptionId: update.subscriptionId,
      status: update.status,
      plan: update.plan,
      pricingAudience: update.pricingAudience,
      currentPeriodEnd: update.currentPeriodEnd,
      cancelAtPeriodEnd: update.cancelAtPeriodEnd,
      lastStripeEventId: update.eventId,
      lastStripeEventCreated: update.eventCreated,
      updatedAt: fieldValue.serverTimestamp(),
    };

    const userPatch = { billing: nextBilling, updatedAt: fieldValue.serverTimestamp() };

    if (update.active) {
      userPatch.plan = update.plan;
      userPatch.pricingAudience = update.pricingAudience;
    } else if (update.revoke && billing.stripeSubscriptionId === update.subscriptionId) {
      userPatch.plan = "wellness";
    }

    transaction.set(userRef, userPatch, { merge: true });
    transaction.set(eventRef, {
      type: update.eventType,
      uid: update.uid,
      subscriptionId: update.subscriptionId,
      status: update.status,
      processedAt: fieldValue.serverTimestamp(),
    });

    return {
      ignored: false,
      uid: update.uid,
      plan: update.active ? update.plan : userPatch.plan || null,
      status: update.status,
    };
  });
}
