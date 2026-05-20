const FUELAI_LOG_KEY = "fuelai-log-v1";
const FUELAI_DAILY_KEY = "fuelai-daily-log-v1";
const FUELAI_LOG_DAYS = 90;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
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
      return (
        new Date(entry.createdAt).getTime()
        >= cutoff
      );
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

  const logs =
    getFuelLog().filter((entry) => {
      return entry.createdAt.slice(0, 10) === dateKey;
    });

  const calories =
    logs.reduce((sum, entry) => {
      return sum + Number(entry.calories || 0);
    }, 0);

  const water =
    logs.reduce((sum, entry) => {
      return sum + Number(entry.water || 0);
    }, 0);

  const trainingCount =
    logs
      .filter((entry) => entry.type === "training")
      .reduce((sum, entry) => {
        return sum + Number(entry.sessions || 1);
      }, 0);

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
    wiseFlavor: setup.wiseFlavor || "medium",
    activityLevel: setup.activityLevel || "low",
    calories,
    water,
    trainingCount,
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
    caloriesToday: today.calories || 0,
    waterToday: today.water || 0,
    trainingToday: today.trainingCount > 0,
    todayCount: today.totalEntries || 0,
    weightToday: today.latestWeight || null,
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