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

const TRACKWISE_TIME_ZONE =
  "America/Los_Angeles";


function getDateKey(date = new Date()) {

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: TRACKWISE_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(date);

  const year =
    parts.find(p => p.type === "year").value;

  const month =
    parts.find(p => p.type === "month").value;

  const day =
    parts.find(p => p.type === "day").value;

  return `${year}-${month}-${day}`;
}
const trackwiseDateKey =
  getDateKey();

const waterKey =
  `fuelai-water-oz-${trackwiseDateKey}`;

let waterOz =
  Number(
    localStorage.getItem(waterKey)
  ) || 0;


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
    typeof window.FuelAILog.getFuelSummary === "function"
  ) {
    const summary =
      window.FuelAILog.getFuelSummary() || {};

    return summary.today || summary;
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

let calories =
  weight ? weight * 14 : 2200;

if (goal === "cutwise") {
  calories =
    weight ? weight * 11 : 1800;
}

if (goal === "gainwise") {
  calories =
    weight ? weight * 16 : 2600;
}

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

  return getDateKey(date);
}

function renderStreak() {
  if (!streakOutput || !window.FuelAILog) return;

  const logs =
    window.FuelAILog.getDailyLogs();

  let streak =
    0;

  for (let i = 0; i < 90; i++) {
    const dateKey =
      getPastDateKey(i);

    const day =
      logs[dateKey];

    if (
      day &&
      Number(day.totalEntries || 0) > 0
    ) {
      streak++;
    } else {
      break;
    }
  }

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
    ${i + 1}
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
  i === 0
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
function getWorkoutIconForDate(dateKey) {

  const start =
    new Date("2026-01-01").getTime();

const current =
  new Date(
    `${dateKey}T12:00:00`
  ).getTime();

  const dayIndex =
    Math.floor((current - start) / 86400000);

  return dayIndex % 2 === 0
    ? "🏋️"
    : "💪";
}

function renderWorkoutWeek() {
  if (!workoutWeek) return;

  workoutWeek.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const dateKey =
      getPastDateKey(i);

    const key =
      `fuelai-workout-${dateKey}`;

    const logged =
      localStorage.getItem(key) === "complete";

const dot =
  document.createElement("span");

dot.textContent =
  getWorkoutIconForDate(dateKey);

dot.className =
  logged
    ? "workout-icon active"
    : "workout-icon inactive";

dot.title =
  `Day ${i + 1}: ${logged ? "Logged" : "Not Logged"}`;
  
const cell =
  document.createElement("div");

cell.className =
  "week-cell";

cell.innerHTML = `
  <span class="week-label">
     ${i + 1}
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

 for (let i = 0; i < 7; i++) {

    const dateKey =
      getPastDateKey(i);

    const key =
      `fuelai-sleep-quality-${dateKey}`;

    const value =
      localStorage.getItem(key);

    let status =
      "empty";

if (value?.includes("Poor")) {
  status = "poor";
}

if (value?.includes("Okay")) {
  status = "okay";
}

if (value?.includes("Great")) {
  status = "good";
}


    const dot =
      document.createElement("span");

    dot.className =
      `sleep-dot ${status}`;


dot.title =
  `Day ${i + 1}: ${value || "Not Logged"}`;


      const cell =
  document.createElement("div");

cell.className =
  "week-cell";

cell.innerHTML = `
  <span class="week-label">
    Day ${i + 1}
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
