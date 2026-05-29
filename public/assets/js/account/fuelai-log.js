const FUELAI_LOG_KEY = "fuelai-log-v1";
const FUELAI_DAILY_KEY = "fuelai-daily-log-v1";
const FUELAI_LOG_DAYS = 90;

const FUEL_LOG_TIME_ZONE =
  "America/Los_Angeles";

function todayKey() {
  return new Date()
    .toLocaleDateString(
      "en-CA",
      {
        timeZone: FUEL_LOG_TIME_ZONE
      }
    );
}

function getFuelLog() {
  return JSON.parse(
    localStorage.getItem(FUELAI_LOG_KEY) || "[]"
  );
}

function getDailyLogs() {
  return JSON.parse(
    localStorage.getItem(FUELAI_DAILY_KEY) || "{}"
  );
}

function saveFuelLog(logs) {
  const cutoff =
    Date.now() -
    FUELAI_LOG_DAYS * 24 * 60 * 60 * 1000;

  const cleaned =
    logs.filter((entry) => {
      return new Date(entry.createdAt).getTime() >= cutoff;
    });

  localStorage.setItem(
    FUELAI_LOG_KEY,
    JSON.stringify(cleaned)
  );
}

function saveDailyLogs(dailyLogs) {
  const cutoff =
    Date.now() -
    FUELAI_LOG_DAYS * 24 * 60 * 60 * 1000;

  const cleaned = {};

  Object.keys(dailyLogs).forEach((date) => {
    if (new Date(date).getTime() >= cutoff) {
      cleaned[date] = dailyLogs[date];
    }
  });

  localStorage.setItem(
    FUELAI_DAILY_KEY,
    JSON.stringify(cleaned)
  );
}

function getDailyTargets(setup) {
  const weight =
    Number(setup.weight || 0);

  if (!weight) {
    return {
      caloriesTarget: null,
      proteinTarget: null
    };
  }

  let caloriesTarget =
    Math.round(weight * 14);

  if (setup.goal === "cutwise") {
    caloriesTarget =
      Math.round(weight * 11);
  }

  if (setup.goal === "gainwise") {
    caloriesTarget =
      Math.round(weight * 16);
  }

  const proteinTarget =
    Math.round(weight * 0.8);

  return {
    caloriesTarget,
    proteinTarget
  };
}

function addFuelLog(entry) {
  const logs = getFuelLog();

  logs.push({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry
  });

  saveFuelLog(logs);
  buildTodayDailyLog();
}

function getTodayLogs() {
  const today = todayKey();

  return getFuelLog().filter((entry) => {
    return entry.createdAt.slice(0, 10) === today;
  });
}

function buildDailyLogForDate(dateKey) {
  const setup =
    JSON.parse(
      localStorage.getItem("fuelai-setup") || "{}"
    );

  const targets =
    getDailyTargets(setup);

  const logs =
    getFuelLog().filter((entry) => {
      return entry.createdAt.slice(0, 10) === dateKey;
    });

  const calories =
    logs.reduce((sum, entry) => {
      return sum + Number(entry.calories || 0);
    }, 0);

  const protein =
    logs.reduce((sum, entry) => {
      return sum + Number(entry.protein || 0);
    }, 0);

  const carbs =
    logs.reduce((sum, entry) => {
      return sum + Number(entry.carbs || 0);
    }, 0);

  const fats =
    logs.reduce((sum, entry) => {
      return sum + Number(entry.fats || 0);
    }, 0);

const water =
  Number(
    localStorage.getItem(
      `fuelai-water-oz-${dateKey}`
    )
  ) || 0;

const trainingToday =
  localStorage.getItem(
    `fuelai-workout-${dateKey}`
  ) === "complete";

const sleepHours =
  Number(
    localStorage.getItem(
      `fuelai-sleep-hours-${dateKey}`
    )
  ) || 0;

let sleepQuality =
  "Not Logged";

let sleepScore =
  0;

if (
  sleepHours >= 8 &&
  sleepHours <= 9
) {

  sleepQuality =
    "Great";

  sleepScore =
    3;

}

else if (
  sleepHours >= 6 &&
  sleepHours <= 7
) {

  sleepQuality =
    "Okay";

  sleepScore =
    2;

}

else if (sleepHours > 0) {

  sleepQuality =
    "Poor";

  sleepScore =
    1;

}
  const latestWeight =
    logs
      .filter((entry) => entry.type === "weight")
      .slice(-1)[0]?.weight || null;

  const scanCount =
    logs.filter((entry) => {
      return entry.type === "meal";
    }).length;

  return {
    date: dateKey,
    goal: setup.goal || "fuelwise",
    guide: setup.guide || "wiseguy",
    wiseFlavor: setup.wiseFlavor || "sweetspot",
    activityLevel: setup.activityLevel || "low",

    calories,
    protein,
    carbs,
    fats,
    water,


    sleepHours,
    sleepQuality,
    sleepScore,

    caloriesTarget:
      targets.caloriesTarget,

    proteinTarget:
      targets.proteinTarget,

    trainingToday,
    latestWeight,
    scanCount,
    totalEntries: logs.length,
    updatedAt: new Date().toISOString()
  };
}

function buildTodayDailyLog() {
  const date = todayKey();
  const dailyLogs = getDailyLogs();

  dailyLogs[date] =
    buildDailyLogForDate(date);

  saveDailyLogs(dailyLogs);

  return dailyLogs[date];
}

function syncDailyLogs() {
  const logs = getFuelLog();
  const dailyLogs = getDailyLogs();

  const dates = new Set();

  logs.forEach((entry) => {
    dates.add(entry.createdAt.slice(0, 10));
  });

  dates.add(todayKey());

  dates.forEach((date) => {
    dailyLogs[date] =
      buildDailyLogForDate(date);
  });

  saveDailyLogs(dailyLogs);

  return getDailyLogs();
}

function getFuelSummary() {
  syncDailyLogs();

  const today = buildTodayDailyLog();
  const dailyLogs = getDailyLogs();
  const allDays = Object.values(dailyLogs);

  return {
    totalDays: allDays.length,

    caloriesToday:
      today.calories || 0,

    proteinToday:
      today.protein || 0,

    carbsToday:
      today.carbs || 0,

    fatsToday:
      today.fats || 0,

    waterToday:
      today.water || 0,

    caloriesTarget:
      today.caloriesTarget || null,

    proteinTarget:
      today.proteinTarget || null,

    trainingToday:
      today.trainingCount > 0,

    todayCount:
      today.totalEntries || 0,

    weightToday:
      today.latestWeight || null,

    wiseFlavor:
      today.wiseFlavor ||
      JSON.parse(
        localStorage.getItem("fuelai-setup") || "{}"
      ).wiseFlavor ||
      "sweetspot",

    today,
    dailyLogs
  };
}

window.FuelAILog = {
  getFuelLog,
  getDailyLogs,
  saveFuelLog,
  saveDailyLogs,
  addFuelLog,
  getTodayLogs,
  buildTodayDailyLog,
  syncDailyLogs,
  getFuelSummary
};