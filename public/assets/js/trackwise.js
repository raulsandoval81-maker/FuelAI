const streakOutput = document.getElementById("streakOutput");

const waterOutput = document.getElementById("waterOutput");
const addWaterBtn = document.getElementById("addWaterBtn");

const calorieOutput = document.getElementById("calorieOutput");
const calorieGoalOutput = document.getElementById("calorieGoalOutput");
const calorieMeter = document.getElementById("calorieMeter");

const proteinOutput = document.getElementById("proteinOutput");
const proteinGoalOutput = document.getElementById("proteinGoalOutput");
const proteinMeter = document.getElementById("proteinMeter");

const workoutOutput = document.getElementById("workoutOutput");
const sleepOutput = document.getElementById("sleepOutput");

const todayKey = new Date().toISOString().slice(0, 10);

const waterKey = `fuelai-water-oz-${todayKey}`;
const workoutKey = `fuelai-workout-${todayKey}`;
const sleepKey = `fuelai-sleep-${todayKey}`;

let waterOz = Number(localStorage.getItem(waterKey)) || 0;

function getSetup() {
  try {
    return JSON.parse(localStorage.getItem("fuelai-setup") || "{}");
  } catch {
    return {};
  }
}

function getDailySummary() {
  if (
    window.FuelAILog &&
    typeof window.FuelAILog.getDailySummary === "function"
  ) {
    return window.FuelAILog.getDailySummary() || {};
  }

  return {};
}

function cleanNumber(value) {
  return Number(String(value || "").replace(/[^\d.]/g, "")) || 0;
}

function estimateTargets(setup) {
  const weight = cleanNumber(setup.weight);
  const goal = setup.goal || "fuelwise";
  const activity = setup.activityLevel || "low";

  let multiplier = 14;

  if (activity === "0-1") multiplier = 13;
  if (activity === "2-3") multiplier = 14;
  if (activity === "4-5") multiplier = 15;
  if (activity === "6plus") multiplier = 16;

  let calories = weight ? weight * multiplier : 2200;

  if (goal === "cutwise") calories -= 300;
  if (goal === "gainwise") calories += 300;

  return {
    calories: Math.round(calories),
    protein: weight ? Math.round(weight) : 160
  };
}

function pct(value, target) {
  if (!target) return 0;

  return Math.min(100, Math.round((value / target) * 100));
}

function renderStreak() {
  const streak =
    Number(localStorage.getItem("fuelai-checkin-streak")) ||
    Number(localStorage.getItem("fuelai-streak")) ||
    0;

  if (!streakOutput) return;

  streakOutput.textContent =
    `${streak} Day${streak === 1 ? "" : "s"}`;
}

function renderHydration() {
  if (!waterOutput) return;

  waterOutput.textContent =
    `${waterOz} / 128 oz`;
}

function renderCaloriesAndProtein() {
  const setup = getSetup();
  const targets = estimateTargets(setup);
  const summary = getDailySummary();

  const calories = Number(summary.calories || 0);
  const protein = Number(summary.protein || 0);

  if (calorieOutput) {
    calorieOutput.textContent =
      `${calories} / ${targets.calories}`;
  }

  if (calorieGoalOutput) {
    calorieGoalOutput.textContent =
      setup.goal === "cutwise"
        ? "CutWise calorie target"
        : setup.goal === "gainwise"
          ? "GainWise calorie target"
          : "FuelWise calorie target";
  }

  if (calorieMeter) {
    calorieMeter.style.width =
      `${pct(calories, targets.calories)}%`;
  }

  if (proteinOutput) {
    proteinOutput.textContent =
      `${protein}g / ${targets.protein}g`;
  }

  if (proteinGoalOutput) {
    proteinGoalOutput.textContent =
      "Daily protein target";
  }

  if (proteinMeter) {
    proteinMeter.style.width =
      `${pct(protein, targets.protein)}%`;
  }
}

function renderWorkout() {
  const complete =
    localStorage.getItem(workoutKey) === "complete";

  if (!workoutOutput) return;

  workoutOutput.textContent =
    complete ? "Logged" : "Not Logged";
}

function renderSleep() {
  const sleep =
    localStorage.getItem(sleepKey) || "Not Logged";

  if (!sleepOutput) return;

  sleepOutput.textContent =
    sleep;
}

addWaterBtn?.addEventListener("click", () => {
  waterOz = Math.min(waterOz + 8, 128);

  localStorage.setItem(
    waterKey,
    String(waterOz)
  );

  renderHydration();
});

renderStreak();
renderHydration();
renderCaloriesAndProtein();
renderWorkout();
renderSleep();