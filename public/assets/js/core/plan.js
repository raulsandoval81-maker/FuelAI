const FUELAI_PLAN_KEY = "fuelai-plan";

const FUELAI_FEATURES = {
  free: {
    mealScansPerDay: 2,
    fridgeScansPerDay: 1,
    trackwise: false,
    combatAthlete: false
  },

  basic: {
    mealScansPerDay: Infinity,
    fridgeScansPerDay: Infinity,
    trackwise: true,
    combatAthlete: false
  },

  plus: {
    mealScansPerDay: Infinity,
    fridgeScansPerDay: Infinity,
    trackwise: true,
    combatAthlete: true
  }
};

function getFuelAIPlan() {
  return localStorage.getItem(FUELAI_PLAN_KEY) || "free";
}

function setFuelAIPlan(plan) {
  localStorage.setItem(FUELAI_PLAN_KEY, plan);
}

function getFuelAIFeatures() {
  const plan = getFuelAIPlan();
  return FUELAI_FEATURES[plan] || FUELAI_FEATURES.free;
}

window.FuelAIPlan = {
  getFuelAIPlan,
  setFuelAIPlan,
  getFuelAIFeatures
};