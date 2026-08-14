const FUELAI_PLAN_KEY =
  "fuelai-plan";


/*
 * ========================================
 * PROFILE → VALID PLANS
 * ========================================
 */

const FUELAI_PROFILE_PLANS = {

  "general-health": {
    label: "General Health",
    defaultPlan: "free",
    allowedPlans: [
      "free",
      "standard"
    ]
  },

  "fitness-enthusiast": {
    label: "Fitness Enthusiast",
    defaultPlan: "standard",
    allowedPlans: [
      "standard",
      "plus"
    ]
  },

  "sports-athlete": {
    label: "Sports Athlete",
    defaultPlan: "standard",
    allowedPlans: [
      "standard",
      "plus"
    ]
  },

  "combat-athlete": {
    label: "Combat Athlete",
    defaultPlan: "plus",
    allowedPlans: [
      "plus"
    ]
  }

};


/*
 * ========================================
 * PLAN FEATURES
 * ========================================
 */

const FUELAI_FEATURES = {

  free: {
    label: "Free",

    mealScansPerDay: 2,
    fridgeScansPerDay: 1,

    trackwise: true,
    trackwiseDays: 3,

    trainingwise: false,

    combatAthlete: false,
    weightwise: false
  },


  standard: {
    label: "FuelAI",

    mealScansPerDay: 5,
    fridgeScansPerDay: 2,

    trackwise: true,
    trackwiseDays: 60,

    trainingwise: true,

    combatAthlete: false,
    weightwise: false
  },


  plus: {
    label: "FuelAI+",

    mealScansPerDay: 8,
    fridgeScansPerDay: 4,

    trackwise: true,
    trackwiseDays: 90,

    trainingwise: true,

    combatAthlete: true,
    weightwise: true
  }

};


/*
 * ========================================
 * SETUP
 * ========================================
 */

function getFuelAISetup() {
  try {
    return JSON.parse(
      localStorage.getItem(
        "fuelai-setup"
      ) || "{}"
    );
  } catch (error) {
    console.warn(
      "Unable to read FuelAI setup.",
      error
    );

    return {};
  }
}


/*
 * ========================================
 * PROFILE
 * ========================================
 */

function normalizeFuelAIProfile(
  profile
) {
  const value =
    String(profile || "")
      .trim()
      .toLowerCase();

  /*
   * Old profile migration
   */
  if (
    value === "general-fitness"
  ) {
    return "fitness-enthusiast";
  }

  if (
    value === "fitness-enthusiast" ||
    value === "sports-athlete" ||
    value === "combat-athlete"
  ) {
    return value;
  }

  return "general-health";
}


function getFuelAIProfile() {
  const setup =
    getFuelAISetup();

  return normalizeFuelAIProfile(
    setup.lifestyleType
  );
}


function getFuelAIProfileConfig() {
  const profile =
    getFuelAIProfile();

  return (
    FUELAI_PROFILE_PLANS[profile] ||
    FUELAI_PROFILE_PLANS[
      "general-health"
    ]
  );
}


/*
 * ========================================
 * PLAN
 * ========================================
 */

function normalizeFuelAIPlan(plan) {
  const value =
    String(plan || "")
      .trim()
      .toLowerCase();

  /*
   * Old Basic plan migration
   */
  if (value === "basic") {
    return "standard";
  }

  if (
    value === "standard" ||
    value === "plus"
  ) {
    return value;
  }

  return "free";
}


function getFuelAIPlan() {
  const profileConfig =
    getFuelAIProfileConfig();

  const stored =
    localStorage.getItem(
      FUELAI_PLAN_KEY
    );

  /*
   * No plan yet:
   * use the natural starting plan
   * for this profile.
   */
  if (!stored) {
    return profileConfig.defaultPlan;
  }

  const plan =
    normalizeFuelAIPlan(
      stored
    );

  /*
   * Existing plan is valid for
   * this profile.
   */
  if (
    profileConfig.allowedPlans.includes(
      plan
    )
  ) {
    return plan;
  }

  /*
   * Invalid profile/plan combination.
   *
   * Example:
   * Combat Athlete + Free
   *
   * Fall back to the profile's
   * natural plan.
   */
  return profileConfig.defaultPlan;
}


function setFuelAIPlan(plan) {
  const normalized =
    normalizeFuelAIPlan(
      plan
    );

  const profileConfig =
    getFuelAIProfileConfig();

  if (
    !profileConfig.allowedPlans.includes(
      normalized
    )
  ) {
    console.warn(
      `Plan "${normalized}" is not available for ${profileConfig.label}.`
    );

    return false;
  }

  localStorage.setItem(
    FUELAI_PLAN_KEY,
    normalized
  );

  return true;
}


function getAllowedFuelAIPlans() {
  return [
    ...getFuelAIProfileConfig()
      .allowedPlans
  ];
}


function getFuelAIFeatures() {
  const plan =
    getFuelAIPlan();

  return (
    FUELAI_FEATURES[plan] ||
    FUELAI_FEATURES.free
  );
}


/*
 * ========================================
 * DEVELOPER OVERRIDE
 * ========================================
 */

function isFuelAIDevUnlocked() {
  return (
    localStorage.getItem(
      "fuelai-dev-unlock-all"
    ) === "true"
  );
}


/*
 * ========================================
 * TOOL ACCESS
 * ========================================
 */

function canUseFuelAITool(tool) {

  if (isFuelAIDevUnlocked()) {
    return true;
  }

  const features =
    getFuelAIFeatures();

  const profile =
    getFuelAIProfile();


  switch (tool) {

    /*
     * Core FuelAI
     */

    case "mealwise":
      return true;


    case "fridgewise":
      return true;


    case "trackwise":
      return (
        features.trackwise === true
      );


    /*
     * TrainingWise
     *
     * Fitness Enthusiast
     * or Combat Athlete
     */

    case "trainingwise":
      return (
        features.trainingwise === true &&
        (
          profile ===
            "fitness-enthusiast" ||

          profile ===
            "sports-athlete" ||

          profile ===
            "combat-athlete"
        )
      );


    /*
     * Combat suite
     *
     * Combat Athlete + Plus
     */

    case "combatAthlete":
      return (
        profile ===
          "combat-athlete" &&

        features.combatAthlete ===
          true
      );


    case "weightwise":
      return (
        profile ===
          "combat-athlete" &&

        features.weightwise ===
          true
      );


    default:
      return false;
  }
}


/*
 * ========================================
 * FULL ACCESS SNAPSHOT
 * ========================================
 */

function getFuelAIAccess() {

  const profile =
    getFuelAIProfile();

  const profileConfig =
    getFuelAIProfileConfig();

  const plan =
    getFuelAIPlan();

  const features =
    getFuelAIFeatures();


  return {

    profile,

    profileLabel:
      profileConfig.label,

    plan,

    planLabel:
      features.label,

    allowedPlans:
      getAllowedFuelAIPlans(),

    developerUnlock:
      isFuelAIDevUnlocked(),


    limits: {

      mealScansPerDay:
        features.mealScansPerDay,

      fridgeScansPerDay:
        features.fridgeScansPerDay,

      trackwiseDays:
        features.trackwiseDays

    },


    tools: {

      mealwise:
        canUseFuelAITool(
          "mealwise"
        ),

      fridgewise:
        canUseFuelAITool(
          "fridgewise"
        ),

      trackwise:
        canUseFuelAITool(
          "trackwise"
        ),

      trainingwise:
        canUseFuelAITool(
          "trainingwise"
        ),

      combatAthlete:
        canUseFuelAITool(
          "combatAthlete"
        ),

      weightwise:
        canUseFuelAITool(
          "weightwise"
        )

    }

  };
}


/*
 * ========================================
 * PUBLIC API
 * ========================================
 */

window.FuelAIPlan = {

  profiles:
    FUELAI_PROFILE_PLANS,

  features:
    FUELAI_FEATURES,

  getFuelAISetup,

  getFuelAIProfile,
  getFuelAIProfileConfig,

  getFuelAIPlan,
  setFuelAIPlan,

  getAllowedFuelAIPlans,

  getFuelAIFeatures,

  canUseFuelAITool,
  getFuelAIAccess,

  isFuelAIDevUnlocked

};