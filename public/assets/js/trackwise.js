"use strict";


/* =========================
   DOM
========================= */

const streakOutput =
  document.getElementById(
    "streakOutput"
  );

const waterOutput =
  document.getElementById(
    "waterOutput"
  );

const waterDrops =
  document.getElementById(
    "waterDrops"
  );

const calorieOutput =
  document.getElementById(
    "calorieOutput"
  );

const calorieGoalOutput =
  document.getElementById(
    "calorieGoalOutput"
  );

const proteinOutput =
  document.getElementById(
    "proteinOutput"
  );

const proteinGoalOutput =
  document.getElementById(
    "proteinGoalOutput"
  );

const workoutOutput =
  document.getElementById(
    "workoutOutput"
  );

const sleepOutput =
  document.getElementById(
    "sleepOutput"
  );

const workoutWeek =
  document.getElementById(
    "workoutWeek"
  );

const sleepWeek =
  document.getElementById(
    "sleepWeek"
  );


const TRACKWISE_TIME_ZONE =
  "America/Los_Angeles";



/* =========================
   DATE HELPERS
========================= */

function getDateKey(
  date = new Date()
) {

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          TRACKWISE_TIME_ZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit"
      }
    )
      .formatToParts(
        date
      );


  const year =
    parts.find(
      (part) =>
        part.type ===
        "year"
    )?.value;


  const month =
    parts.find(
      (part) =>
        part.type ===
        "month"
    )?.value;


  const day =
    parts.find(
      (part) =>
        part.type ===
        "day"
    )?.value;


  return (
    `${year}-${month}-${day}`
  );
}


function getPastDateKey(
  daysBack
) {

  const date =
    new Date();


  date.setDate(
    date.getDate() -
    daysBack
  );


  return (
    getDateKey(
      date
    )
  );
}


const trackwiseDateKey =
  getDateKey();



/* =========================
   SETUP + LOG HELPERS
========================= */

function getSetup() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "fuelai-setup"
      ) || "{}"
    );

  } catch {

    return {};

  }

}


function getDailyLogs() {

  if (
    window.FuelAILog &&
    typeof window.FuelAILog
      .getDailyLogs ===
      "function"
  ) {

    return (
      window.FuelAILog
        .getDailyLogs() ||
      {}
    );

  }


  return {};

}


function getDailySummary() {

  if (
    window.FuelAILog &&
    typeof window.FuelAILog
      .getFuelSummary ===
      "function"
  ) {

    const summary =
      window.FuelAILog
        .getFuelSummary() ||
      {};


    return (
      summary.today ||
      summary
    );

  }


  return {};

}


function cleanNumber(
  value
) {

  const match =
    String(
      value ?? ""
    )
      .replace(
        /,/g,
        ""
      )
      .match(
        /-?\d+(?:\.\d+)?/
      );


  if (
    !match
  ) {
    return 0;
  }


  const number =
    Number(
      match[0]
    );


  return (
    Number.isFinite(
      number
    )
      ? number
      : 0
  );

}



/* =========================
   TARGETS
========================= */

function estimateTargets(
  setup
) {

  const weight =
    cleanNumber(
      setup.weight
    );


  const goal =
    setup.goal ||
    "fuelwise";


  let calories =
    weight
      ? weight * 14
      : 2200;


  if (
    goal ===
    "cutwise"
  ) {

    calories =
      weight
        ? weight * 11
        : 1800;

  }


  if (
    goal ===
    "gainwise"
  ) {

    calories =
      weight
        ? weight * 16
        : 2600;

  }


  return {

    calories:
      Math.round(
        calories
      ),

    protein:
      weight
        ? Math.round(
            weight * 0.8
          )
        : 160

  };

}



/* =========================
   STREAK
========================= */

function renderStreak() {

  if (
    !streakOutput
  ) {
    return;
  }


  const logs =
    getDailyLogs();


  let streak =
    0;


  for (
    let i = 0;
    i < 90;
    i++
  ) {

    const dateKey =
      getPastDateKey(
        i
      );


    const day =
      logs[
        dateKey
      ];


    if (
      day &&
      Number(
        day.totalEntries ||
        0
      ) > 0
    ) {

      streak++;

    } else {

      break;

    }

  }


  streakOutput.textContent =
    `${streak} Day${
      streak === 1
        ? ""
        : "s"
    }`;

}



/* =========================
   HYDRATION
========================= */

function getWaterToday() {

  const summary =
    getDailySummary();


  const logWater =
    cleanNumber(
      summary.waterToday ??
      summary.water
    );


  if (
    logWater > 0
  ) {

    return (
      Math.min(
        logWater,
        128
      )
    );

  }


  /*
   * Legacy fallback while older
   * local water data still exists.
   */

  const waterKey =
    `fuelai-water-oz-${trackwiseDateKey}`;


  return Math.min(
    Number(
      localStorage.getItem(
        waterKey
      )
    ) || 0,
    128
  );

}


function renderHydration() {

  const waterOz =
    getWaterToday();


  if (
    waterOutput
  ) {

    waterOutput.textContent =
      `${waterOz} / 128 oz`;

  }


  if (
    !waterDrops
  ) {
    return;
  }


  waterDrops.innerHTML =
    "";


  const completed =
    Math.floor(
      waterOz / 16
    );


  for (
    let i = 0;
    i < 8;
    i++
  ) {

    const cell =
      document.createElement(
        "div"
      );


    cell.className =
      "week-cell";


    cell.innerHTML = `
      <span class="week-label">
        ${i + 1}
      </span>
    `;


    const drop =
      document.createElement(
        "span"
      );


    const isComplete =
      i < completed;


    drop.className =
      isComplete
        ? (
            i === 7
              ? "water-drop final filled"
              : "water-drop filled"
          )
        : (
            i === 7
              ? "water-drop final empty"
              : "water-drop empty"
          );


    drop.textContent =
      i === 0
        ? "💦"
        : "💧";


    cell.appendChild(
      drop
    );


    waterDrops.appendChild(
      cell
    );

  }

}



/* =========================
   CALORIES + PROTEIN
========================= */

function renderCaloriesAndProtein() {

  const setup =
    getSetup();


  const targets =
    estimateTargets(
      setup
    );


  const summary =
    getDailySummary();


  let calories =
    cleanNumber(
      summary.caloriesToday ??
      summary.calories
    );


  let protein =
    cleanNumber(
      summary.proteinToday ??
      summary.protein
    );


  /*
   * Safety guard against old
   * corrupted/all-time totals.
   */

  if (
    calories > 10000
  ) {
    calories = 0;
  }


  if (
    protein > 500
  ) {
    protein = 0;
  }


  if (
    calorieOutput
  ) {

    calorieOutput.textContent =
      `${calories} / ${targets.calories}`;

  }


  if (
    calorieGoalOutput
  ) {

    calorieGoalOutput.textContent =
      setup.goal ===
        "cutwise"
        ? "CutWise calorie target"
        : setup.goal ===
            "gainwise"
          ? "GainWise calorie target"
          : "FuelWise calorie target";

  }


  if (
    proteinOutput
  ) {

    proteinOutput.textContent =
      `${protein}g / ${targets.protein}g`;

  }


  if (
    proteinGoalOutput
  ) {

    proteinGoalOutput.textContent =
      "Daily protein target";

  }

}



/* =========================
   WORKOUT WEEK
========================= */

function getWorkoutIconForDate(
  dateKey
) {

  const start =
    new Date(
      "2026-01-01T12:00:00"
    ).getTime();


  const current =
    new Date(
      `${dateKey}T12:00:00`
    ).getTime();


  const dayIndex =
    Math.floor(
      (
        current -
        start
      ) /
      86400000
    );


  return (
    dayIndex % 2 === 0
      ? "🏋️"
      : "💪"
  );

}


function hasWorkoutForDate(
  dateKey
) {

  const logs =
    getDailyLogs();


  const day =
    logs[
      dateKey
    ];


  /*
   * Prefer FuelAILog when it
   * exposes day-level data.
   */

  if (
    day
  ) {

    if (
      day.trainingToday ||
      day.training ||
      Number(
        day.trainingSessions ||
        0
      ) > 0
    ) {

      return true;

    }


    if (
      Array.isArray(
        day.entries
      ) &&
      day.entries.some(
        (entry) =>
          entry.type ===
          "training"
      )
    ) {

      return true;

    }

  }


  /*
   * Legacy fallback.
   */

  return (
    localStorage.getItem(
      `fuelai-workout-${dateKey}`
    ) ===
    "complete"
  );

}


function renderWorkoutWeek() {

  if (
    !workoutWeek
  ) {
    return;
  }


  workoutWeek.innerHTML =
    "";


  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const dateKey =
      getPastDateKey(
        i
      );


    const logged =
      hasWorkoutForDate(
        dateKey
      );


    const dot =
      document.createElement(
        "span"
      );


    dot.textContent =
      getWorkoutIconForDate(
        dateKey
      );


    dot.className =
      logged
        ? "workout-icon active"
        : "workout-icon inactive";


    dot.title =
      `Day ${i + 1}: ${
        logged
          ? "Logged"
          : "Not Logged"
      }`;


    const cell =
      document.createElement(
        "div"
      );


    cell.className =
      "week-cell";


    cell.innerHTML = `
      <span class="week-label">
        ${i + 1}
      </span>
    `;


    cell.appendChild(
      dot
    );


    workoutWeek.appendChild(
      cell
    );

  }


  if (
    workoutOutput
  ) {

    workoutOutput.textContent =
      "7-Day Log";

  }

}



/* =========================
   SLEEP WEEK
========================= */

function getSleepStatus(
  dateKey
) {

  const qualityKey =
    `fuelai-sleep-quality-${dateKey}`;


  const hoursKey =
    `fuelai-sleep-hours-${dateKey}`;


  const savedQuality =
    localStorage.getItem(
      qualityKey
    );


  const hours =
    cleanNumber(
      localStorage.getItem(
        hoursKey
      )
    );


  /*
   * Current Daily Check-In labels.
   */

  if (
    savedQuality
      ?.toLowerCase()
      .includes(
        "low"
      )
  ) {
    return "poor";
  }


  if (
    savedQuality
      ?.toLowerCase()
      .includes(
        "moderate"
      )
  ) {
    return "okay";
  }


  if (
    savedQuality
      ?.toLowerCase()
      .includes(
        "strong"
      )
  ) {
    return "good";
  }


  /*
   * Legacy labels.
   */

  if (
    savedQuality
      ?.toLowerCase()
      .includes(
        "poor"
      )
  ) {
    return "poor";
  }


  if (
    savedQuality
      ?.toLowerCase()
      .includes(
        "okay"
      )
  ) {
    return "okay";
  }


  if (
    savedQuality
      ?.toLowerCase()
      .includes(
        "great"
      )
  ) {
    return "good";
  }


  /*
   * Numeric fallback if quality
   * was never saved.
   */

  if (
    hours > 0 &&
    hours < 6
  ) {
    return "poor";
  }


  if (
    hours >= 6 &&
    hours < 8
  ) {
    return "okay";
  }


  if (
    hours >= 8 &&
    hours <= 10
  ) {
    return "good";
  }


  if (
    hours > 10
  ) {
    return "okay";
  }


  return "empty";

}


function renderSleepWeek() {

  if (
    !sleepWeek
  ) {
    return;
  }


  sleepWeek.innerHTML =
    "";


  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const dateKey =
      getPastDateKey(
        i
      );


    const status =
      getSleepStatus(
        dateKey
      );


    const hours =
      localStorage.getItem(
        `fuelai-sleep-hours-${dateKey}`
      );


    const dot =
      document.createElement(
        "span"
      );


    dot.className =
      `sleep-dot ${status}`;


    dot.title =
      hours
        ? `Day ${i + 1}: ${hours} hours`
        : `Day ${i + 1}: Not Logged`;


    const cell =
      document.createElement(
        "div"
      );


    cell.className =
      "week-cell";


    cell.innerHTML = `
      <span class="week-label">
        ${i + 1}
      </span>
    `;


    cell.appendChild(
      dot
    );


    sleepWeek.appendChild(
      cell
    );

  }


  if (
    sleepOutput
  ) {

    sleepOutput.textContent =
      "7-Day Log";

  }

}



/* =========================
   START
========================= */

renderStreak();

renderHydration();

renderCaloriesAndProtein();

renderWorkoutWeek();

renderSleepWeek();