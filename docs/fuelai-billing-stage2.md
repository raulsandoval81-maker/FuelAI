# FuelAI individual Checkout (Stage 2)

The browser posts only `{ "plan": "fitness" | "sports" | "combat" }` to
`POST /api/billing/checkout` with a Firebase ID token. The server verifies
the token (including revocation), reads `users/{uid}`, resolves trusted member
eligibility, selects a catalog Price ID from environment, retrieves the Stripe
Price, and checks active USD monthly recurring amount and test/live mode before
creating one subscription Checkout Session. Wellness has no checkout.

Required server configuration:

- `FUELAI_STRIPE_SECRET_KEY` — a Stripe secret key, never sent to the browser.
- `FUELAI_PUBLIC_ORIGIN` — the exact HTTPS origin for success/cancel URLs.
- `FUELAI_STRIPE_PRICE_FITNESS_PUBLIC`
- `FUELAI_STRIPE_PRICE_FITNESS_MEMBER`
- `FUELAI_STRIPE_PRICE_SPORTS_PUBLIC`
- `FUELAI_STRIPE_PRICE_SPORTS_MEMBER`
- `FUELAI_STRIPE_PRICE_COMBAT_PUBLIC`
- `FUELAI_STRIPE_PRICE_COMBAT_MEMBER`
- Existing Firebase Admin configuration used by other API routes:
  `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
  `FIREBASE_PRIVATE_KEY_B64`.

No values or Price IDs are committed. The Team Price variable from Stage 1 is
not used by this endpoint. Stripe access uses server-side HTTPS; no Stripe npm
package is required. The configured Price is validated before use.

The response contains only `checkoutUrl` and `checkoutSessionId`.
`success.html` is informational and does not activate access. Signed webhook
fulfillment, subscription state, customer reuse, billing portal, and Team
checkout remain Stage 3/4 work. Existing test Payment Links remain available
until this flow is verified in Stripe test mode.
