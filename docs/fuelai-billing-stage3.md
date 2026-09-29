# FuelAI Stripe fulfillment (Stage 3)

Stage 3 adds signed Stripe subscription webhook fulfillment at:

- `POST /api/billing/webhook`

The endpoint reads the raw request body, verifies the Stripe `v1` signature with
a five-minute tolerance, rejects test/live mode mismatches, and accepts only
subscription lifecycle events used by FuelAI:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Before granting paid access, the webhook requires canonical checkout metadata
(`uid`, `plan`, `pricingAudience`) and verifies that the subscription contains
exactly one licensed monthly Price matching the server-side FuelAI catalog and
the configured Stripe Price ID. A signed event cannot create a missing FuelAI
user.

Active or trialing subscriptions write server-authoritative billing state to
`users/{uid}` and set the canonical paid plan. Canceled, unpaid, or
`incomplete_expired` events revoke the current matching subscription back to
Wellness. `past_due` is recorded but does not immediately revoke access, so
Stripe's configured retry/grace policy can finish before an `unpaid` or
cancellation event. Older out-of-order events cannot overwrite newer billing
state.

Processed Stripe event IDs are recorded under the private `system/billing`
namespace so Stripe retries are idempotent. Existing Firestore rules already
deny browser access to `system/**`; Admin SDK writes remain server-only.

Required configuration from Stage 2 remains in place, plus:

- `FUELAI_STRIPE_WEBHOOK_SECRET` — Stripe endpoint signing secret (`whsec_...`)

The Stripe endpoint should be configured for the three subscription events
above. Do not grant access from `success.html`; that page remains informational.

Still later work:

- customer reuse and Billing Portal
- plan-change checkout/portal UX
- Team checkout and Team subscription fulfillment
- client consumption of the server-authoritative entitlement snapshot
