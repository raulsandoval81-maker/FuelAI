const logsContainer =
  document.getElementById("logsContainer");

function formatLogDate(dateValue) {
  const date =
    new Date(dateValue);

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

function renderLogs() {
  const dailyLogs =
    window.FuelAILog.getDailyLogs();

  const days =
    Object.values(dailyLogs)
      .sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      );

  if (!days.length) {
    logsContainer.innerHTML = `
      <div class="range-card log-card">
        No logs yet.
      </div>
    `;

    return;
  }

  logsContainer.innerHTML =
    days.map((day) => {
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

            <span>🔥 ${day.calories || 0}</span>

            <span>🥩 ${day.protein || 0}g</span>

            <span>💧 ${day.water || 0} oz</span>

            <span>🏋️ ${day.trainingToday ? "Logged" : "—"}</span>

            <span>
              ⚖️ ${
                day.latestWeight
                  ? `${day.latestWeight} lbs`
                  : "—"
              }
            </span>

            <span>📸 ${day.scanCount || 0}</span>

          </div>

        </section>
      `;
    })
    .join("");
}

renderLogs();