const streakOutput =
  document.getElementById("streakOutput");

const waterOutput =
  document.getElementById("waterOutput");

const waterDrops =
  document.getElementById("waterDrops");  


const calorieOutput =
  document.getElementById("calorieOutput");

const calorieGoalOutput =
  document.getElementById("calorieGoalOutput");

const proteinOutput =
  document.getElementById("proteinOutput");

const proteinGoalOutput =
  document.getElementById("proteinGoalOutput");


const workoutOutput =
  document.getElementById("workoutOutput");

const sleepOutput =
  document.getElementById("sleepOutput");

const workoutWeek =
  document.getElementById("workoutWeek");

const sleepWeek =
  document.getElementById("sleepWeek");

const trackwiseDateKey =
  new Date().toISOString().slice(0, 10);

const waterKey =
  `fuelai-water-oz-${trackwiseDateKey}`;

let waterOz =
  Number(localStorage.getItem(waterKey)) || 0;

function getSetup() {
  try {
    return JSON.parse(
      localStorage.getItem("fuelai-setup") || "{}"
    );
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
  return (
    Number(
      String(value || "").replace(/[^\d.]/g, "")
    ) || 0
  );
}

function estimateTargets(setup) {
  const weight =
    cleanNumber(setup.weight);

  const goal =
    setup.goal || "fuelwise";

  const activity =
    setup.activityLevel || "low";

  let multiplier =
    14;

  if (activity === "0-1") multiplier = 13;
  if (activity === "2-3") multiplier = 14;
  if (activity === "4-5") multiplier = 15;
  if (activity === "6plus") multiplier = 16;

  let calories =
    weight ? weight * multiplier : 2200;

  if (goal === "cutwise") calories -= 300;
  if (goal === "gainwise") calories += 300;

  return {
    calories:
      Math.round(calories),

    protein:
      weight ? Math.round(weight) : 160
  };
}

function pct(value, target) {
  if (!target) return 0;

  return Math.min(
    100,
    Math.round((value / target) * 100)
  );
}

function getPastDateKey(daysBack) {
  const date =
    new Date();

  date.setDate(
    date.getDate() - daysBack
  );

  return date.toISOString().slice(0, 10);
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

  if (waterOutput) {
    waterOutput.textContent =
      `${waterOz} / 128 oz`;
  }

  if (!waterDrops) return;

  waterDrops.innerHTML = "";

  const completed =
    Math.floor(waterOz / 16);

  for (let i = 0; i < 8; i++) {

    const cell =
      document.createElement("div");

    cell.className =
      "week-cell";

cell.innerHTML = `
  <span class="week-label">
    ${7 - i}
  </span>
`;

      const drop =
      document.createElement("span");

    const isComplete =
      i < completed;

    drop.className =
      isComplete
        ? i === 7
          ? "water-drop final filled"
          : "water-drop filled"
        : i === 7
          ? "water-drop final empty"
          : "water-drop empty";

    drop.textContent =
      i === 7
        ? "💦"
        : "💧";

    cell.appendChild(drop);
    waterDrops.appendChild(cell);

  }

}

function renderCaloriesAndProtein() {
  const setup =
    getSetup();

  const targets =
    estimateTargets(setup);

  const summary =
    getDailySummary();

  const calories =
    Number(summary.calories || 0);

  const protein =
    Number(summary.protein || 0);

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

if (proteinOutput) {
  proteinOutput.textContent =
    `${protein}g / ${targets.protein}g`;
}
  
  if (proteinGoalOutput) {
    proteinGoalOutput.textContent =
      "Daily protein target";
  }
  

}

function renderWorkoutWeek() {
  if (!workoutWeek) return;

  workoutWeek.innerHTML = "";

  for (let i = 6; i >= 0; i--) {
    const dateKey =
      getPastDateKey(i);

    const key =
      `fuelai-workout-${dateKey}`;

    const logged =
      localStorage.getItem(key) === "complete";

    const dot =
      document.createElement("span");

    dot.className =
      logged
        ? "week-dot good"
        : "week-dot empty";

    dot.title =
      `Day ${7 - i}: ${logged ? "Logged" : "Not Logged"}`;

const cell =
  document.createElement("div");

cell.className =
  "week-cell";

cell.innerHTML = `
  <span class="week-label">
     ${i - i}
  </span>
`;

cell.appendChild(dot);

workoutWeek.appendChild(cell);

    }

  if (workoutOutput) {
    workoutOutput.textContent =
      "7-Day Log";
  }
}

function renderSleepWeek() {

  if (!sleepWeek) return;

  sleepWeek.innerHTML = "";

  for (let i = 6; i >= 0; i--) {

    const dateKey =
      getPastDateKey(i);

    const key =
      `fuelai-sleep-quality-${dateKey}`;

    const value =
      localStorage.getItem(key);

    let status =
      "empty";

    if (value === "Poor") {
      status = "poor";
    }

    if (
      value === "Okay" ||
      value === "Good"
    ) {
      status = "okay";
    }

    if (value === "Great") {
      status = "good";
    }

    const dot =
      document.createElement("span");

    dot.className =
      `sleep-dot ${status}`;

    dot.title =
      `Day ${7 - i}: ${value || "Not Logged"}`;

const cell =
  document.createElement("div");

cell.className =
  "week-cell";

cell.innerHTML = `
  <span class="week-label">
    Day ${7 - i}
  </span>
`;

cell.appendChild(dot);

sleepWeek.appendChild(cell);
  }

  if (sleepOutput) {
    sleepOutput.textContent =
      "7-Day Log";
  }

}

renderStreak();
renderHydration();
renderCaloriesAndProtein();
renderWorkoutWeek();
renderSleepWeek();