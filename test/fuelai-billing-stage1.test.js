import assert from "node:assert/strict";
import test from "node:test";
import {
  FUELAI_BILLING_CATALOG,
  catalogPriceFor,
} from "../api/_lib/fuelai-billing-catalog.js";
import {
  canonicalEntitlementFromTrustedUser,
  pricingAudienceFromTrustedUser,
  resolveTeamBillingOwner,
  translateLegacyPlan,
  validateCanonicalEntitlement,
} from "../api/_lib/fuelai-billing-entitlements.js";

test("catalog locks monthly prices and keeps Team separate from base plans", () => {
  assert.equal(catalogPriceFor("wellness").monthlyCents, 0);
  for (const [plan, member, publicPrice] of [
    ["fitness", 1299, 1499],
    ["sports", 1999, 2499],
    ["combat", 2999, 3999],
  ]) {
    assert.equal(catalogPriceFor(plan, "member").monthlyCents, member);
    assert.equal(catalogPriceFor(plan, "public").monthlyCents, publicPrice);
  }
  assert.equal(FUELAI_BILLING_CATALOG.team_30.monthlyCents, 3499);
  assert.equal(FUELAI_BILLING_CATALOG.team_30.athleteLimit, 30);
  assert.deepEqual(FUELAI_BILLING_CATALOG.team_30.requiresPlan, ["sports", "combat"]);
  assert.equal(catalogPriceFor("team_30"), null);
  assert.equal(catalogPriceFor("sports", "unknown"), null);
  assert.match(catalogPriceFor("combat", "member").priceEnv, /^FUELAI_STRIPE_PRICE_/);
});

test("legacy free maps; standard and plus require explicit migration", () => {
  assert.deepEqual(translateLegacyPlan("free"), { status: "mapped", plan: "wellness" });
  assert.deepEqual(translateLegacyPlan("standard"), {
    status: "migration_required", legacyPlan: "standard",
  });
  assert.deepEqual(translateLegacyPlan("plus"), {
    status: "migration_required", legacyPlan: "plus",
  });
  assert.deepEqual(canonicalEntitlementFromTrustedUser({ plan: "plus" }), {
    status: "migration_required", legacyPlan: "plus",
  });
});

test("member pricing requires verified server-owned eligibility", () => {
  assert.equal(pricingAudienceFromTrustedUser({ pricingAudience: "member" }), "public");
  assert.equal(pricingAudienceFromTrustedUser({
    memberPricingEligibility: { status: "pending", source: "verified-link" },
  }), "public");
  assert.equal(pricingAudienceFromTrustedUser({
    memberPricingEligibility: { status: "verified", source: "verified-link" },
  }), "member");
  assert.deepEqual(canonicalEntitlementFromTrustedUser({ plan: "sports" }), {
    status: "ready",
    entitlement: {
      plan: "sports", pricingAudience: "public", teamEnabled: false, teamTier: null,
    },
  });
});

test("Team entitlement requires Sports or Combat and a matching tier", () => {
  const base = { pricingAudience: "public", teamEnabled: true, teamTier: "team_30" };
  assert.equal(validateCanonicalEntitlement({ ...base, plan: "sports" }), true);
  assert.equal(validateCanonicalEntitlement({ ...base, plan: "combat" }), true);
  assert.equal(validateCanonicalEntitlement({ ...base, plan: "fitness" }), false);
  assert.equal(validateCanonicalEntitlement({ ...base, plan: "wellness" }), false);
  assert.equal(validateCanonicalEntitlement({ ...base, plan: "sports", teamTier: null }), false);
  assert.equal(validateCanonicalEntitlement({
    ...base, plan: "sports", teamEnabled: false,
  }), false);
});

test("Team billing binding requires the authenticated active coach/admin", () => {
  const context = {
    callerUid: "coach-1",
    teamId: "team-1",
    team: { status: "active", createdBy: "coach-1" },
    membership: { uid: "coach-1", role: "coach", status: "active" },
    plan: "sports",
  };
  assert.deepEqual(resolveTeamBillingOwner(context), {
    teamId: "team-1", billingOwnerUid: "coach-1",
  });
  assert.equal(resolveTeamBillingOwner({ ...context, plan: "fitness" }), null);
  assert.equal(resolveTeamBillingOwner({
    ...context, membership: { ...context.membership, uid: "someone-else" },
  }), null);
  assert.equal(resolveTeamBillingOwner({
    ...context, membership: { ...context.membership, role: "athlete" },
  }), null);
  assert.equal(resolveTeamBillingOwner({
    ...context, membership: { ...context.membership, status: "inactive" },
  }), null);
  assert.deepEqual(resolveTeamBillingOwner({
    ...context, membership: { ...context.membership, role: "admin" },
  }), { teamId: "team-1", billingOwnerUid: "coach-1" });
});
