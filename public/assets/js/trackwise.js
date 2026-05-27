const todayStatus =
  document.getElementById("todayStatus");

const todayNote =
  document.getElementById("todayNote");

const calorieOutput =
  document.getElementById("calorieOutput");

const proteinOutput =
  document.getElementById("proteinOutput");

const carbOutput =
  document.getElementById("carbOutput");

const fatOutput =
  document.getElementById("fatOutput");

const waterOutput =
  document.getElementById("waterOutput");

const addWaterBtn =
  document.getElementById("addWaterBtn");

const streakOutput =
  document.getElementById("streakOutput");



const trackwiseTodayKey =
  new Date().toISOString().slice(0, 10);

const waterKey =
  `fuelai-water-${trackwiseTodayKey}`;

let water =
  Number(localStorage.getItem(waterKey)) || 0;


function renderWater() {
  if (!waterOutput) return;

  waterOutput.textContent =
    `${water} / 8 Cups`;
}


function addWater() {
  water =
    Math.min(water + 1, 8);

  localStorage.setItem(
    waterKey,
    String(water)
  );

  renderWater();
  renderTodayStatus();
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


function renderMacros() {
  const summary =
    getDailySummary();

  const calories =
    Number(summary.calories || 0);

  const protein =
    Number(summary.protein || 0);

  const carbs =
    Number(summary.carbs || 0);

  const fats =
    Number(summary.fats || 0);

  if (calorieOutput) {
    calorieOutput.textContent =
      calories;
  }

  if (proteinOutput) {
    proteinOutput.textContent =
      `${protein}g`;
  }

  if (carbOutput) {
    carbOutput.textContent =
      `${carbs}g`;
  }

  if (fatOutput) {
    fatOutput.textContent =
      `${fats}g`;
  }

  return {
    calories,
    protein,
    carbs,
    fats
  };
}


function getStreak() {
  return (
    Number(localStorage.getItem("fuelai-streak")) ||
    Number(localStorage.getItem("fuelai-checkin-streak")) ||
    0
  );
}


function renderStreak() {
  const streak =
    getStreak();

  if (!streakOutput) return;

  streakOutput.textContent =
    `${streak} Day${streak === 1 ? "" : "s"} Streak`;
}


function renderTodayStatus() {
  const macros =
    renderMacros();

  const hasFuel =
    macros.calories > 0 ||
    macros.protein > 0 ||
    macros.carbs > 0 ||
    macros.fats > 0;

  const hasWater =
    water > 0;

  if (!todayStatus || !todayNote) return;

  if (hasFuel && hasWater) {
    todayStatus.textContent =
      "You have started today.";

    todayNote.textContent =
      "Fuel and hydration are both moving.";
    return;
  }

  if (hasFuel) {
    todayStatus.textContent =
      "Fuel logged.";

    todayNote.textContent =
      "Hydration still needs attention.";
    return;
  }

  if (hasWater) {
    todayStatus.textContent =
      "Hydration started.";

    todayNote.textContent =
      "Log food when you are ready.";
    return;
  }

  todayStatus.textContent =
    "Nothing logged yet.";

  todayNote.textContent =
    "Start with water, a meal scan, or your daily check-in.";
}


addWaterBtn?.addEventListener(
  "click",
  addWater
);

renderWater();
renderMacros();
renderStreak();
renderTodayStatus();