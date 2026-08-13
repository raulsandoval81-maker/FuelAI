"use strict";


/* =========================
   DOM
========================= */

const logsContainer =
  document.getElementById(
    "logsContainer"
  );

const todaySnapshot =
  document.getElementById(
    "todaySnapshot"
  );

const toggleFullHistoryBtn =
  document.getElementById(
    "toggleFullHistoryBtn"
  );

const fullHistoryContainer =
  document.getElementById(
    "fullHistoryContainer"
  );


const LOGS_TIME_ZONE =
  "America/Los_Angeles";



/* =========================
   PLAN ACCESS
========================= */

const features =
  window.FuelAIPlan
    ?.getFuelAIFeatures?.() ||
  {
    trackwiseDays: 3
  };


const historyDays =
  Number(
    features.trackwiseDays
  ) || 3;



/* =========================
   HELPERS
========================= */

function parseLogNumber(
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


function getDailyLogsSafe() {

  if (
    !window.FuelAILog ||
    typeof window.FuelAILog
      .getDailyLogs !==
      "function"
  ) {
    return {};
  }


  return (
    window.FuelAILog
      .getDailyLogs() ||
    {}
  );

}



/* =========================
   DATE HELPERS
========================= */

function getTodayKey() {

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          LOGS_TIME_ZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit"
      }
    )
      .formatToParts(
        new Date()
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


function formatLogDate(
  dateValue
) {

  if (
    !dateValue
  ) {
    return "DAY";
  }


  const date =
    new Date(
      `${dateValue}T12:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "DAY";
  }


  return date
    .toLocaleDateString(
      "en-US",
      {
        weekday:
          "short",

        month:
          "short",

        day:
          "numeric"
      }
    )
    .toUpperCase();

}


function formatLogTime(
  day
) {

  const raw =
    day.updatedAt ||
    day.lastUpdated ||
    day.createdAt ||
    "";


  if (
    !raw
  ) {
    return "";
  }


  const date =
    new Date(
      raw
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  return date
    .toLocaleTimeString(
      "en-US",
      {
        hour:
          "numeric",

        minute:
          "2-digit"
      }
    );

}



/* =========================
   NORMALIZE
========================= */

function normalizeDay(
  day
) {

  return {

    date:
      day.date ||
      "",

    calories:
      parseLogNumber(
        day.calories ??
        day.caloriesToday
      ),

    protein:
      parseLogNumber(
        day.protein ??
        day.proteinToday
      ),

    water:
      parseLogNumber(
        day.water ??
        day.waterToday
      ),

    caloriesTarget:
      day.caloriesTarget ??
      day.targetCalories ??
      "—",

    proteinTarget:
      day.proteinTarget ??
      day.targetProtein ??
      "—",

    trainingToday:
      Boolean(
        day.trainingToday ||
        day.training ||
        Number(
          day.trainingSessions ||
          0
        ) > 0
      ),

    latestWeight:
      day.latestWeight ??
      day.weight ??
      "",

    scanCount:
      parseLogNumber(
        day.scanCount ??
        day.scans
      ),

    sleepQuality:
      day.sleepQuality ||
      "",

    sleepHours:
      day.sleepHours ||
      "",

    updatedAt:
      day.updatedAt ||
      day.lastUpdated ||
      day.createdAt ||
      ""

  };

}


function getSortedDays() {

  const dailyLogs =
    getDailyLogsSafe();


  return Object
    .values(
      dailyLogs
    )
    .map(
      normalizeDay
    )
    .filter(
      (day) =>
        day.date
    )
    .sort(
      (a, b) => {

        return (
          new Date(
            `${b.date}T12:00:00`
          ) -
          new Date(
            `${a.date}T12:00:00`
          )
        );

      }
    );

}



/* =========================
   TODAY
========================= */

function renderTodaySnapshot(
  days
) {

  if (
    !todaySnapshot
  ) {
    return;
  }


  const todayKey =
    getTodayKey();


  const today =
    days.find(
      (day) =>
        String(
          day.date ||
          ""
        ).startsWith(
          todayKey
        )
    );


  if (
    !today
  ) {

    todaySnapshot.innerHTML = `
      No entries yet today.

      <br><br>

      Use Daily Check-In, MealWise,
      or TrackWise to start today.
    `;

    return;

  }


  todaySnapshot.innerHTML = `
    🔥 Calories:
    ${today.calories}

    <br><br>

    🥩 Protein:
    ${today.protein}g

    <br><br>

    💧 Hydration:
    ${today.water} oz

    <br><br>

    🏋️ Training:
    ${
      today.trainingToday
        ? "Logged"
        : "—"
    }

    <br><br>

    ⚖️ Weight:
    ${
      today.latestWeight
        ? `${today.latestWeight} lbs`
        : "—"
    }

    <br><br>

    😴 Sleep:
    ${
      today.sleepHours ||
      today.sleepQuality
        ? `
            ${today.sleepHours || "—"} hrs
            ${today.sleepQuality || ""}
          `
        : "—"
    }
  `;

}



/* =========================
   LOG CARDS
========================= */

function renderLogCards(
  days
) {

  return days
    .map(
      (day) => {

        const dateLabel =
          formatLogDate(
            day.date
          );


        const timeLabel =
          formatLogTime(
            day
          );


        return `
          <section class="range-card log-card">

            <div class="log-head">

              <p class="log-date">
                ${dateLabel}
              </p>

              <p class="log-time">
                ${
                  timeLabel
                    ? `Updated ${timeLabel}`
                    : ""
                }
              </p>

            </div>


            <p class="log-target">
              🎯
              ${day.caloriesTarget || "—"} cal
              /
              ${day.proteinTarget || "—"}g protein
            </p>


            <div class="log-grid">

              <span>
                🔥 ${day.calories}
              </span>

              <span>
                🥩 ${day.protein}g
              </span>

              <span>
                💧 ${day.water} oz
              </span>

              <span>
                🏋️ ${
                  day.trainingToday
                    ? "Logged"
                    : "—"
                }
              </span>

              <span>
                ⚖️ ${
                  day.latestWeight
                    ? `${day.latestWeight} lbs`
                    : "—"
                }
              </span>

              <span>
                📸 ${day.scanCount}
              </span>

            </div>


            ${
              day.sleepHours ||
              day.sleepQuality
                ? `
                  <p class="range-note">
                    😴 Sleep:
                    ${day.sleepHours || "—"} hrs
                    ${day.sleepQuality || ""}
                  </p>
                `
                : ""
            }

          </section>
        `;

      }
    )
    .join("");

}



/* =========================
   RECENT LOGS
========================= */

function renderLogs() {

  if (
    !logsContainer
  ) {
    return;
  }


  const days =
    getSortedDays();


  renderTodaySnapshot(
    days
  );


  if (
    !days.length
  ) {

    logsContainer.innerHTML = `
      <div class="range-card log-card">
        No logs yet.
      </div>
    `;

    return;

  }


  const recentDays =
    days.slice(
      0,
      Math.min(
        3,
        historyDays
      )
    );


  logsContainer.innerHTML =
    renderLogCards(
      recentDays
    );

}



/* =========================
   FULL HISTORY
========================= */

function renderFullHistory(
  days
) {

  if (
    !fullHistoryContainer
  ) {
    return;
  }


  const allowedDays =
    days.slice(
      0,
      historyDays
    );


  if (
    !allowedDays.length
  ) {

    fullHistoryContainer.innerHTML = `
      <section class="range-card log-card">
        No history yet.
      </section>
    `;

    return;

  }


  fullHistoryContainer.innerHTML =
    renderLogCards(
      allowedDays
    );

}



/* =========================
   HISTORY BUTTON
========================= */

function updateHistoryButton() {

  if (
    !toggleFullHistoryBtn ||
    !fullHistoryContainer
  ) {
    return;
  }


  const isHidden =
    fullHistoryContainer
      .classList
      .contains(
        "hidden"
      );


  toggleFullHistoryBtn.textContent =
    isHidden
      ? `Show ${historyDays}-Day Log History ↓`
      : `Hide ${historyDays}-Day Log History ↑`;

}


toggleFullHistoryBtn
  ?.addEventListener(
    "click",
    () => {

      const days =
        getSortedDays();


      renderFullHistory(
        days
      );


      fullHistoryContainer
        ?.classList
        .toggle(
          "hidden"
        );


      updateHistoryButton();

    }
  );



/* =========================
   START
========================= */

updateHistoryButton();

renderLogs();