import { getAdminAuth, getAdminDb } from "../_lib/firebase-admin.js";
import {
  CheckoutError,
  createIndividualCheckout,
} from "../_lib/fuelai-checkout.js";
import { stripeCheckoutHttp } from "../_lib/stripe-checkout-http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const authorization = String(req.headers?.authorization || "");
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim() : "";
  try {
    const result = await createIndividualCheckout({
      body: req.body,
      token,
      auth: getAdminAuth(),
      db: getAdminDb(),
      stripe: stripeCheckoutHttp,
      env: process.env,
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(result);
  } catch (error) {
    const status = error instanceof CheckoutError ? error.statusCode : 502;
    if (!(error instanceof CheckoutError)) {
      console.error("FuelAI checkout failed", { name: error?.name || "Error" });
    }
    return res.status(status).json({
      error: error instanceof CheckoutError
        ? error.message : "Checkout is temporarily unavailable.",
    });
  }
}
