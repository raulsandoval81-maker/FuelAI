const logsContainer =
  document.getElementById("logsContainer");

const todaySnapshot =
  document.getElementById("todaySnapshot");

function getDailyLogsSafe() {
  if (
    !window.FuelAILog ||
    typeof window.FuelAILog.getDailyLogs !== "function"
  ) {
    return {};
  }

  return window.FuelAILog.getDailyLogs() || {};
}

const FUELAI_TIME_ZONE =
  "America/Los_Angeles";

function getTodayKey() {
  return new Date()
    .toLocaleDateString(
      "en-CA",
      {
        timeZone: FUELAI_TIME_ZONE
      }
    );
}
function formatLogDate(dateValue) {
  if (!dateValue) return "DAY";

  const date =
    new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "DAY";
  }

  return date
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    })
    .toUpperCase();
}

function formatLogTime(day) {
  const raw =
    day.updatedAt ||
    day.lastUpdated ||
    day.createdAt ||
    day.date;

  const date =
    new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function normalizeDay(day) {
  return {
    date:
      day.date || "",

    calories:
      Number(day.calories || day.caloriesToday || 0),

    protein:
      Number(day.protein || day.proteinToday || 0),

    water:
      Number(day.water || day.waterToday || 0),

    caloriesTarget:
      day.caloriesTarget || day.targetCalories || "—",

    proteinTarget:
      day.proteinTarget || day.targetProtein || "—",

    trainingToday:
      !!day.trainingToday ||
      !!day.training ||
      Number(day.trainingSessions || 0) > 0,

    latestWeight:
      day.latestWeight ||
      day.weight ||
      "",

    scanCount:
      Number(day.scanCount || day.scans || 0),

    sleepQuality:
      day.sleepQuality || "",

    sleepHours:
      day.sleepHours || "",

    updatedAt:
      day.updatedAt ||
      day.lastUpdated ||
      day.createdAt ||
      day.date
  };
}

function getSortedDays() {
  const dailyLogs =
    getDailyLogsSafe();

  return Object
    .values(dailyLogs)
    .map(normalizeDay)
    .sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
}

function renderTodaySnapshot(days) {
  if (!todaySnapshot) return;

  const todayKey =
    getTodayKey();

  const today =
    days.find(day =>
      String(day.date || "").startsWith(todayKey)
    );

  if (!today) {
    todaySnapshot.innerHTML = `
      No entries yet today.

      <br><br>

      Use Simple Check-In, Scan Meal, or TrackWise to start today.
    `;

    return;
  }

  todaySnapshot.innerHTML = `
    🔥 Calories: ${today.calories}

    <br><br>

    🥩 Protein: ${today.protein}g

    <br><br>

    💧 Hydration: ${today.water} oz

    <br><br>

    🏋️ Training: ${today.trainingToday ? "Logged" : "—"}

    <br><br>

    ⚖️ Weight: ${
      today.latestWeight
        ? `${today.latestWeight} lbs`
        : "—"
    }

    <br><br>

    😴 Sleep: ${
      today.sleepHours || today.sleepQuality
        ? `${today.sleepHours || "—"} hrs ${today.sleepQuality || ""}`
        : "—"
    }
  `;
}

function renderLogs() {
  if (!logsContainer) return;

  const days =
    getSortedDays();

  renderTodaySnapshot(days);

  if (!days.length) {
    logsContainer.innerHTML = `
      <div class="range-card log-card">
        No logs yet.
      </div>
    `;

    return;
  }

  const recentDays =
    days.slice(0, 5);

  logsContainer.innerHTML =
    recentDays.map((day) => {
      const dateLabel =
        formatLogDate(day.date);

      const timeLabel =
        formatLogTime(day);

      return `
        <section class="range-card log-card">

          <div class="log-head">
            <p class="log-date">
              ${dateLabel}
            </p>

            <p class="log-time">
              ${timeLabel ? `Logged ${timeLabel}` : ""}
            </p>
          </div>

          <p class="log-target">
            🎯 ${day.caloriesTarget || "—"} cal / ${day.proteinTarget || "—"}g protein
          </p>

          <div class="log-grid">

            <span>🔥 ${day.calories}</span>

            <span>🥩 ${day.protein}g</span>

            <span>💧 ${day.water} oz</span>

            <span>🏋️ ${day.trainingToday ? "Logged" : "—"}</span>

            <span>
              ⚖️ ${
                day.latestWeight
                  ? `${day.latestWeight} lbs`
                  : "—"
              }
            </span>

            <span>📸 ${day.scanCount}</span>

          </div>

        </section>
      `;
    })
    .join("");
}

renderLogs();