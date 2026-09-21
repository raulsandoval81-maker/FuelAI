# FuelAI billing launch model (Stage 1)

This is configuration and policy only. No checkout, webhook, portal, Stripe
product creation, customer migration, or entitlement write runs at this stage.

The individual entitlement is `plan: wellness | fitness | sports | combat`
with `pricingAudience: public | member`. The separate Team entitlement uses
`teamEnabled: boolean` and `teamTier: null | team_30`. Team may be enabled
only alongside Sports or Combat. A future verified Team billing record must
also bind `teamId` and `billingOwnerUid` to the authenticated active team
owner/coach/admin; team membership and athlete bridges remain separate.

Member pricing requires server-read, server-owned
`users/{uid}.memberPricingEligibility = { status: "verified", source: "..." }`.
There is no such established eligibility writer yet. Until one is approved,
the safe audience is `public`; a browser-provided audience is never authority.
Existing Firestore rules do not permit client writes to this field.

Legacy `free` translates to `wellness`. Legacy `standard` and `plus` remain
recognizable only so internal code can detect them; they do not automatically
translate to Fitness, Sports, or Combat. There are no paying FuelAI customers
or active subscriptions to migrate. Old test Payment Links and offers can be
retired after the new integration is verified. Existing browser and AI
metering behavior is intentionally unchanged by Stage 1.

The catalog defines monthly USD amounts but no Stripe Price IDs. Future
server-side configuration names are:

- `FUELAI_STRIPE_PRICE_FITNESS_PUBLIC`
- `FUELAI_STRIPE_PRICE_FITNESS_MEMBER`
- `FUELAI_STRIPE_PRICE_SPORTS_PUBLIC`
- `FUELAI_STRIPE_PRICE_SPORTS_MEMBER`
- `FUELAI_STRIPE_PRICE_COMBAT_PUBLIC`
- `FUELAI_STRIPE_PRICE_COMBAT_MEMBER`
- `FUELAI_STRIPE_PRICE_TEAM_30`

Checkout and webhook stages will separately require server-only Stripe API
and signing secrets. None are read or required by Stage 1.
