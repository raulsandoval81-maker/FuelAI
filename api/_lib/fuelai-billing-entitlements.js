// Pure Stage 1 policy. Callers must supply records read by an authenticated
// server path; browser-provided audience, membership, or team data is untrusted.
const PLANS = new Set(["wellness", "fitness", "sports", "combat"]);
const AUDIENCES = new Set(["public", "member"]);
const TEAM_PLANS = new Set(["sports", "combat"]);

export function translateLegacyPlan(value) {
  const plan = String(value || "").trim().toLowerCase();
  if (plan === "free") return { status: "mapped", plan: "wellness" };
  if (plan === "standard" || plan === "plus") {
    return { status: "migration_required", legacyPlan: plan };
  }
  if (PLANS.has(plan)) return { status: "canonical", plan };
  return { status: "unrecognized", legacyPlan: plan };
}

export function pricingAudienceFromTrustedUser(user = {}) {
  const eligibility = user.memberPricingEligibility;
  return eligibility?.status === "verified" &&
    typeof eligibility.source === "string" &&
    eligibility.source.trim() !== ""
    ? "member"
    : "public";
}

export function validateCanonicalEntitlement(value) {
  if (!value || !PLANS.has(value.plan)) return false;
  if (!AUDIENCES.has(value.pricingAudience)) return false;
  if (typeof value.teamEnabled !== "boolean") return false;
  if (value.teamTier !== null && value.teamTier !== "team_30") return false;
  return value.teamEnabled
    ? TEAM_PLANS.has(value.plan) && value.teamTier === "team_30"
    : value.teamTier === null;
}

export function canonicalEntitlementFromTrustedUser(user = {}) {
  const translated = translateLegacyPlan(user.plan);
  if (!["mapped", "canonical"].includes(translated.status)) {
    return { status: translated.status, legacyPlan: translated.legacyPlan };
  }
  const entitlement = {
    plan: translated.plan,
    pricingAudience: pricingAudienceFromTrustedUser(user),
    teamEnabled: user.teamEnabled === true,
    teamTier: user.teamTier ?? null,
  };
  return validateCanonicalEntitlement(entitlement)
    ? { status: "ready", entitlement }
    : { status: "invalid_entitlement" };
}

export function resolveTeamBillingOwner({ callerUid, teamId, team, membership, plan }) {
  const uid = String(callerUid || "").trim();
  const id = String(teamId || "").trim();
  const role = String(membership?.role || "").trim().toLowerCase();
  if (!uid || !id || !TEAM_PLANS.has(plan)) return null;
  if (team?.status !== "active") return null;
  if (membership?.uid !== uid || membership?.status !== "active") return null;
  if (role !== "coach" && role !== "admin") return null;
  // The existing team schema has createdBy, not a separate owner role.
  // Both an active owner-coach and other active coach/admin are permitted.
  return { teamId: id, billingOwnerUid: uid };
}
