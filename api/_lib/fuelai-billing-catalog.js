// Stage 1 catalog only. Price IDs are supplied by server environment later.
// This module does not create Stripe objects or authorize a purchase.
export const FUELAI_BILLING_CATALOG = Object.freeze({
  wellness: Object.freeze({ monthlyCents: 0, currency: "usd" }),
  fitness: Object.freeze({
    public: Object.freeze({ monthlyCents: 1499, currency: "usd", priceEnv: "FUELAI_STRIPE_PRICE_FITNESS_PUBLIC" }),
    member: Object.freeze({ monthlyCents: 1299, currency: "usd", priceEnv: "FUELAI_STRIPE_PRICE_FITNESS_MEMBER" }),
  }),
  sports: Object.freeze({
    public: Object.freeze({ monthlyCents: 2499, currency: "usd", priceEnv: "FUELAI_STRIPE_PRICE_SPORTS_PUBLIC" }),
    member: Object.freeze({ monthlyCents: 1999, currency: "usd", priceEnv: "FUELAI_STRIPE_PRICE_SPORTS_MEMBER" }),
  }),
  combat: Object.freeze({
    public: Object.freeze({ monthlyCents: 3999, currency: "usd", priceEnv: "FUELAI_STRIPE_PRICE_COMBAT_PUBLIC" }),
    member: Object.freeze({ monthlyCents: 2999, currency: "usd", priceEnv: "FUELAI_STRIPE_PRICE_COMBAT_MEMBER" }),
  }),
  team_30: Object.freeze({
    monthlyCents: 3499,
    currency: "usd",
    athleteLimit: 30,
    requiresPlan: Object.freeze(["sports", "combat"]),
    priceEnv: "FUELAI_STRIPE_PRICE_TEAM_30",
  }),
});

export function catalogPriceFor(plan, pricingAudience = "public") {
  if (plan === "wellness") return FUELAI_BILLING_CATALOG.wellness;
  if (!["fitness", "sports", "combat"].includes(plan)) return null;
  if (!["public", "member"].includes(pricingAudience)) return null;
  return FUELAI_BILLING_CATALOG[plan][pricingAudience];
}
