const FUELAI_LOG_KEY = "fuelai-log-v1";
const FUELAI_LOG_DAYS = 90;

function getFuelLog() {
  return JSON.parse(localStorage.getItem(FUELAI_LOG_KEY) || "[]");
}

function saveFuelLog(logs) {
  const cutoff = Date.now() - FUELAI_LOG_DAYS * 24 * 60 * 60 * 1000;

  const cleaned = logs.filter((entry) => {
    return new Date(entry.createdAt).getTime() >= cutoff;
  });

  localStorage.setItem(FUELAI_LOG_KEY, JSON.stringify(cleaned));
}

function addFuelLog(entry) {
  const logs = getFuelLog();

  logs.push({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry
  });

  saveFuelLog(logs);
}

function getTodayLogs() {
  const today = new Date().toISOString().slice(0, 10);

  return getFuelLog().filter((entry) => {
    return entry.createdAt.slice(0, 10) === today;
  });
}

function getFuelSummary() {
  const logs = getFuelLog();
  const todayLogs = getTodayLogs();

  const caloriesToday = todayLogs.reduce((sum, entry) => {
    return sum + Number(entry.calories || 0);
  }, 0);

  const waterToday = todayLogs.reduce((sum, entry) => {
    return sum + Number(entry.water || 0);
  }, 0);

  const trainingToday = todayLogs.some((entry) => {
    return entry.type === "training";
  });

  return {
    totalLogs: logs.length,
    caloriesToday,
    waterToday,
    trainingToday,
    todayCount: todayLogs.length
  };
}

window.FuelAILog = {
  getFuelLog,
  saveFuelLog,
  addFuelLog,
  getTodayLogs,
  getFuelSummary
};