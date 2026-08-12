const FUELAI_PLAN_KEY =
  "fuelai-plan";

const FUELAI_FEATURES = {

  free: {
    mealScansPerDay: 2,
    fridgeScansPerDay: 1,

    trackwise: true,
    trackwiseDays: 3,

    trainingwise: false,

    combatAthlete: false,
    weightwise: false
  },

  standard: {
    mealScansPerDay: 5,
    fridgeScansPerDay: 2,

    trackwise: true,
    trackwiseDays: 60,

    trainingwise: true,

    combatAthlete: false,
    weightwise: false
  },

  plus: {
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
 * PLAN
 * ========================================
 */

function normalizeFuelAIPlan(plan) {
  const value =
    String(plan || "")
      .trim()
      .toLowerCase();

  /*
   * Backward compatibility
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
  return normalizeFuelAIPlan(
    localStorage.getItem(
      FUELAI_PLAN_KEY
    )
  );
}


function setFuelAIPlan(plan) {
  const normalized =
    normalizeFuelAIPlan(plan);

  localStorage.setItem(
    FUELAI_PLAN_KEY,
    normalized
  );

  return normalized;
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
 * SETUP / PROFILE
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
    value === "general-fitness" ||
    value === "sports-athlete"
  ) {
    return "fitness-enthusiast";
  }

  if (
    value === "fitness-enthusiast" ||
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

    case "mealwise":
      return true;


    case "fridgewise":
      return true;


    case "trackwise":
      return (
        features.trackwise === true
      );


    case "trainingwise":
      return (
        features.trainingwise === true &&
        (
          profile ===
            "fitness-enthusiast" ||

          profile ===
            "combat-athlete"
        )
      );


    case "combatAthlete":
      return (
        features.combatAthlete === true &&
        profile ===
          "combat-athlete"
      );


    case "weightwise":
      return (
        features.weightwise === true &&
        profile ===
          "combat-athlete"
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
  const plan =
    getFuelAIPlan();

  const profile =
    getFuelAIProfile();

  const features =
    getFuelAIFeatures();

  return {
    plan,
    profile,

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
  getFuelAIPlan,
  setFuelAIPlan,
  getFuelAIFeatures,

  getFuelAISetup,
  getFuelAIProfile,

  canUseFuelAITool,
  getFuelAIAccess,

  isFuelAIDevUnlocked
};