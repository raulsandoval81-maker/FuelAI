const calorieOutput = document.getElementById("calorieOutput");
const calorieGoalOutput = document.getElementById("calorieGoalOutput");
const calorieMeter = document.getElementById("calorieMeter");

const proteinOutput = document.getElementById("proteinOutput");
const proteinGoalOutput = document.getElementById("proteinGoalOutput");
const proteinMeter = document.getElementById("proteinMeter");

const waterOutput = document.getElementById("waterOutput");
const addWaterBtn = document.getElementById("addWaterBtn");

const streakOutput = document.getElementById("streakOutput");

const todayKey = new Date().toISOString().slice(0, 10);
const waterKey = `fuelai-water-${todayKey}`;

let water = Number(localStorage.getItem(waterKey)) || 0;

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

  let activityMultiplier = 14;

  if (activity === "0-1") activityMultiplier = 13;
  if (activity === "2-3") activityMultiplier = 14;
  if (activity === "4-5") activityMultiplier = 15;
  if (activity === "6plus") activityMultiplier = 16;

  let calories = weight ? weight * activityMultiplier : 2200;

  if (goal === "cutwise") {
    calories = calories - 300;
  }

  if (goal === "gainwise") {
    calories = calories + 300;
  }

  const protein = weight ? Math.round(weight) : 160;

  return {
    calories: Math.round(calories),
    protein
  };
}

function pct(value, target) {
  if (!target) return 0;

  return Math.min(100, Math.round((value / target) * 100));
}

function renderWater() {
  if (!waterOutput) return;

  waterOutput.textContent = `${water} / 8`;
}

function renderData() {
  const setup = getSetup();
  const targets = estimateTargets(setup);
  const summary = getDailySummary();

  const calories = Number(summary.calories || 0);
  const protein = Number(summary.protein || 0);
  const carbs = Number(summary.carbs || 0);
  const fats = Number(summary.fats || 0);

  if (calorieOutput) {
    calorieOutput.textContent = `${calories} / ${targets.calories}`;
  }

  if (calorieGoalOutput) {
    calorieGoalOutput.textContent =
      setup.goal === "cutwise"
        ? "CutWise target"
        : setup.goal === "gainwise"
          ? "GainWise target"
          : "FuelWise target";
  }

  if (calorieMeter) {
    calorieMeter.style.width = `${pct(calories, targets.calories)}%`;
  }

  if (proteinOutput) {
    proteinOutput.textContent = `${protein}g / ${targets.protein}g`;
  }

  if (proteinGoalOutput) {
    proteinGoalOutput.textContent = "Daily protein target";
  }

  if (proteinMeter) {
    proteinMeter.style.width = `${pct(protein, targets.protein)}%`;
  }


  if (carbOutput) { carbOutput.textContent = `${carbs}g`;
   }

  if (fatOutput) { fatOutput.textContent = `${fats}g`;
   }

  renderStreak();
}

function getStreak() {
  return (
    Number(localStorage.getItem("fuelai-checkin-streak")) ||
    Number(localStorage.getItem("fuelai-streak")) ||
    0
  );
}

function renderStreak() {
  const streak = getStreak();

  if (!streakOutput) return;

  streakOutput.textContent = `${streak} Day${streak === 1 ? "" : "s"}`;
}

addWaterBtn?.addEventListener("click", () => {
  water = Math.min(water + 1, 8);

  localStorage.setItem(waterKey, String(water));

  renderWater();
});

renderWater();
renderData();