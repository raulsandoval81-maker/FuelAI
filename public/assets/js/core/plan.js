const FUELAI_PLAN_KEY = "fuelai-plan";
const FUELAI_BETA_KEY = "fuelai-beta-access";

const CANONICAL_PLANS = [
  "wellness",
  "fitness",
  "sports",
  "combat"
];

const LEGACY_AMBIGUOUS_PLANS = new Set([
  "basic",
  "standard",
  "plus"
]);

const FUELAI_PROFILE_PLANS = {
  "general-health": {
    label: "General Health",
    defaultPlan: "wellness",
    allowedPlans: [...CANONICAL_PLANS]
  },
  "fitness-enthusiast": {
    label: "Fitness Enthusiast",
    defaultPlan: "fitness",
    allowedPlans: [...CANONICAL_PLANS]
  },
  "sports-athlete": {
    label: "Sports Athlete",
    defaultPlan: "sports",
    allowedPlans: [...CANONICAL_PLANS]
  },
  "combat-athlete": {
    label: "Combat Athlete",
    defaultPlan: "combat",
    allowedPlans: [...CANONICAL_PLANS]
  }
};

/*
 * Client feature exposure remains intentionally conservative during the
 * plan-name migration. Fitness and Sports preserve the former Standard
 * feature surface; Combat preserves the former Plus feature surface.
 * Server entitlements remain authoritative for billing and paid access.
 */
const FUELAI_FEATURES = {
  wellness: {
    label: "Wellness",
    mealScansPerDay: 2,
    fridgeScansPerDay: 1,
    trackwise: true,
    trackwiseDays: 7,
    trainingwise: false,
    combatAthlete: false,
    weightwise: false
  },
  fitness: {
    label: "Fitness",
    mealScansPerDay: 5,
    fridgeScansPerDay: 2,
    trackwise: true,
    trackwiseDays: 60,
    trainingwise: true,
    combatAthlete: false,
    weightwise: false
  },
  sports: {
    label: "Sports",
    mealScansPerDay: 5,
    fridgeScansPerDay: 2,
    trackwise: true,
    trackwiseDays: 60,
    trainingwise: true,
    combatAthlete: false,
    weightwise: false
  },
  combat: {
    label: "Combat",
    mealScansPerDay: 8,
    fridgeScansPerDay: 4,
    trackwise: true,
    trackwiseDays: 60,
    trainingwise: true,
    combatAthlete: true,
    weightwise: true
  }
};

function getFuelAISetup() {
  try {
    return JSON.parse(localStorage.getItem("fuelai-setup") || "{}");
  } catch (error) {
    console.warn("Unable to read FuelAI setup.", error);
    return {};
  }
}

function normalizeFuelAIProfile(profile) {
  const value = String(profile || "").trim().toLowerCase();
  if (value === "general-fitness") return "fitness-enthusiast";
  if ([
    "general-health",
    "fitness-enthusiast",
    "sports-athlete",
    "combat-athlete"
  ].includes(value)) return value;
  return "general-health";
}

function getFuelAIProfile() {
  return normalizeFuelAIProfile(getFuelAISetup().lifestyleType);
}

function getFuelAIProfileConfig() {
  return FUELAI_PROFILE_PLANS[getFuelAIProfile()] || FUELAI_PROFILE_PLANS["general-health"];
}

/*
 * Billing policy intentionally permits only one automatic legacy mapping:
 * free -> wellness. Standard/Plus (and the older Basic alias) are recognized
 * so callers can surface migration state, but are never silently promoted to
 * a paid canonical plan.
 */
function translateLegacyFuelAIPlan(plan) {
  const value = String(plan || "").trim().toLowerCase();

  if (CANONICAL_PLANS.includes(value)) {
    return { status: "canonical", plan: value, legacyPlan: null };
  }

  if (value === "free") {
    return { status: "mapped", plan: "wellness", legacyPlan: value };
  }

  if (LEGACY_AMBIGUOUS_PLANS.has(value)) {
    return { status: "migration_required", plan: null, legacyPlan: value };
  }

  return { status: "unrecognized", plan: null, legacyPlan: value || null };
}

function normalizeFuelAIPlan(plan, fallback = null) {
  const translated = translateLegacyFuelAIPlan(plan);
  return translated.plan || fallback;
}

function getFuelAIPlanMigration() {
  const stored = localStorage.getItem(FUELAI_PLAN_KEY);
  if (!stored) return { status: "none", plan: null, legacyPlan: null };
  return translateLegacyFuelAIPlan(stored);
}

function getFuelAIPlan() {
  const profileConfig = getFuelAIProfileConfig();
  const stored = localStorage.getItem(FUELAI_PLAN_KEY);
  if (!stored) return profileConfig.defaultPlan;

  const translated = translateLegacyFuelAIPlan(stored);
  if (translated.plan && profileConfig.allowedPlans.includes(translated.plan)) {
    return translated.plan;
  }

  /*
   * Ambiguous legacy values are left untouched in storage and fall back to
   * the profile's canonical starting plan until an explicit migration choice
   * is made. This avoids fabricating a paid entitlement in the browser.
   */
  return profileConfig.defaultPlan;
}

function setFuelAIPlan(plan) {
  const translated = translateLegacyFuelAIPlan(plan);
  const normalized = translated.plan;
  const profileConfig = getFuelAIProfileConfig();

  if (!normalized || !profileConfig.allowedPlans.includes(normalized)) {
    console.warn(`Plan "${String(plan || "")}" requires a canonical FuelAI plan.`);
    return false;
  }

  localStorage.setItem(FUELAI_PLAN_KEY, normalized);
  return true;
}

function migrateStoredFuelAIPlan() {
  const migration = getFuelAIPlanMigration();
  if (migration.status !== "mapped" || !migration.plan) return migration;
  localStorage.setItem(FUELAI_PLAN_KEY, migration.plan);
  return { ...migration, status: "migrated" };
}

function getAllowedFuelAIPlans() {
  return [...getFuelAIProfileConfig().allowedPlans];
}

function getFuelAIBetaAccess() {
  try {
    const beta = JSON.parse(localStorage.getItem(FUELAI_BETA_KEY) || "{}");
    const enabled = beta.enabled === true;
    const translated = translateLegacyFuelAIPlan(beta.accessLevel);
    const accessLevel = translated.plan;

    return {
      enabled,
      accessLevel: enabled ? accessLevel : null,
      cohort: String(beta.cohort || ""),
      startedAt: beta.startedAt || null,
      expiresAt: beta.expiresAt || null,
      migrationStatus: translated.status,
      legacyAccessLevel: translated.legacyPlan
    };
  } catch (error) {
    console.warn("Unable to read FuelAI beta access.", error);
    return {
      enabled: false,
      accessLevel: null,
      cohort: "",
      startedAt: null,
      expiresAt: null,
      migrationStatus: "unrecognized",
      legacyAccessLevel: null
    };
  }
}

function isFuelAIBetaUser() {
  return getFuelAIBetaAccess().enabled === true;
}

function getFuelAIEffectivePlan() {
  const purchasedPlan = getFuelAIPlan();
  const beta = getFuelAIBetaAccess();
  return beta.enabled && beta.accessLevel ? beta.accessLevel : purchasedPlan;
}

function getFuelAIFeatures() {
  const plan = getFuelAIEffectivePlan();
  return FUELAI_FEATURES[plan] || FUELAI_FEATURES.wellness;
}

function isFuelAIDevUnlocked() {
  return localStorage.getItem("fuelai-dev-unlock-all") === "true";
}

function canUseFuelAITool(tool) {
  if (isFuelAIDevUnlocked()) return true;

  const features = getFuelAIFeatures();
  const profile = getFuelAIProfile();

  switch (tool) {
    case "mealwise":
    case "fridgewise":
      return true;
    case "trackwise":
      return features.trackwise === true;
    case "trainingwise":
      return features.trainingwise === true && [
        "fitness-enthusiast",
        "sports-athlete",
        "combat-athlete"
      ].includes(profile);
    case "combatAthlete":
      return profile === "combat-athlete" && features.combatAthlete === true;
    case "cutwise":
    case "weightwise":
      return profile === "combat-athlete" && features.weightwise === true;
    default:
      return false;
  }
}

function getFuelAIAccess() {
  const profile = getFuelAIProfile();
  const profileConfig = getFuelAIProfileConfig();
  const plan = getFuelAIPlan();
  const effectivePlan = getFuelAIEffectivePlan();
  const beta = getFuelAIBetaAccess();
  const features = getFuelAIFeatures();
  const migration = getFuelAIPlanMigration();

  return {
    profile,
    profileLabel: profileConfig.label,
    plan,
    planLabel: FUELAI_FEATURES[plan]?.label || plan,
    effectivePlan,
    effectivePlanLabel: features.label,
    betaUser: beta.enabled,
    beta,
    planMigration: migration,
    allowedPlans: getAllowedFuelAIPlans(),
    developerUnlock: isFuelAIDevUnlocked(),
    limits: {
      mealScansPerDay: features.mealScansPerDay,
      fridgeScansPerDay: features.fridgeScansPerDay,
      trackwiseDays: features.trackwiseDays
    },
    tools: {
      mealwise: canUseFuelAITool("mealwise"),
      fridgewise: canUseFuelAITool("fridgewise"),
      trackwise: canUseFuelAITool("trackwise"),
      trainingwise: canUseFuelAITool("trainingwise"),
      cutwise: canUseFuelAITool("cutwise"),
      combatAthlete: canUseFuelAITool("combatAthlete"),
      weightwise: canUseFuelAITool("weightwise")
    }
  };
}

window.FuelAIPlan = {
  profiles: FUELAI_PROFILE_PLANS,
  features: FUELAI_FEATURES,
  canonicalPlans: [...CANONICAL_PLANS],
  getFuelAISetup,
  getFuelAIProfile,
  getFuelAIProfileConfig,
  translateLegacyFuelAIPlan,
  normalizeFuelAIPlan,
  getFuelAIPlanMigration,
  migrateStoredFuelAIPlan,
  getFuelAIPlan,
  setFuelAIPlan,
  getAllowedFuelAIPlans,
  getFuelAIFeatures,
  getFuelAIBetaAccess,
  isFuelAIBetaUser,
  getFuelAIEffectivePlan,
  canUseFuelAITool,
  getFuelAIAccess,
  isFuelAIDevUnlocked
};
