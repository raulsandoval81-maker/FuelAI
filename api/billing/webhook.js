import { FieldValue, getAdminDb } from "../_lib/firebase-admin.js";
import {
  StripeWebhookError,
  expectedStripeLiveMode,
  fulfillStripeSubscriptionEvent,
  parseStripeEvent,
  subscriptionUpdateFromEvent,
  verifyStripeSignature,
} from "../_lib/stripe-webhook.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      throw new StripeWebhookError(413, "Stripe webhook payload is too large.");
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await readRawBody(req);
    verifyStripeSignature({
      payload: rawBody,
      signatureHeader: req.headers?.["stripe-signature"],
      secret: process.env.FUELAI_STRIPE_WEBHOOK_SECRET,
    });

    const event = parseStripeEvent(rawBody);
    const expectedLiveMode = expectedStripeLiveMode(process.env.FUELAI_STRIPE_SECRET_KEY);
    const update = subscriptionUpdateFromEvent(event, expectedLiveMode);
    const result = await fulfillStripeSubscriptionEvent({
      db: getAdminDb(),
      fieldValue: FieldValue,
      update,
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    const status = error instanceof StripeWebhookError ? error.statusCode : 500;
    if (!(error instanceof StripeWebhookError)) {
      console.error("FuelAI Stripe webhook failed", { name: error?.name || "Error" });
    }
    return res.status(status).json({
      error: error instanceof StripeWebhookError
        ? error.message
        : "Webhook processing failed.",
    });
  }
}
