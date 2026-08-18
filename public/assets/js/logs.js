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


const cycle7Calendar =
  document.getElementById(
    "cycle7Calendar"
  );

const cycle7Detail =
  document.getElementById(
    "cycle7Detail"
  );

const cycle21Calendar =
  document.getElementById(
    "cycle21Calendar"
  );

const cycle42Calendar =
  document.getElementById(
    "cycle42Calendar"
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
    trackwiseDays: 7
  };


const historyDays =
  Number(
    features.trackwiseDays
  ) || 7;


const fuelAIAccess =
  window.FuelAIPlan
    ?.getFuelAIAccess?.() ||
  {};

const currentProfile =
  fuelAIAccess.profile ||
  "general-health";

const currentPlan =
  fuelAIAccess.effectivePlan ||
  fuelAIAccess.plan ||
  "free";

const isFreePlan =
  currentPlan ===
  "free";


function getCycleAccess() {

  if (
    isFreePlan
  ) {
    return {
      seven: true,
      twentyOne: false,
      fortyTwo: false,
      sixty: false
    };
  }


  if (
    currentProfile ===
      "sports-athlete" ||
    currentProfile ===
      "combat-athlete"
  ) {
    return {
      seven: true,
      twentyOne: false,
      fortyTwo: true,
      sixty: true
    };
  }


  return {
    seven: true,
    twentyOne: true,
    fortyTwo: false,
    sixty: true
  };

}


const cycleAccess =
  getCycleAccess();



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
   PROGRESS CYCLES
========================= */

function getDateKey(
  date
) {
  return date
    .toISOString()
    .slice(0, 10);
}


function getPastDates(
  count
) {

  const dates =
    [];

  const today =
    new Date();


  for (
    let i = count - 1;
    i >= 0;
    i--
  ) {

    const date =
      new Date(
        today
      );

    date.setDate(
      today.getDate() - i
    );

    dates.push(
      date
    );

  }


  return dates;

}


function getDayMap(
  days
) {

  return new Map(
    days.map(
      day => [
        String(
          day.date
        ).slice(
          0,
          10
        ),
        day
      ]
    )
  );

}


function renderCycleDay(
  date,
  day,
  unlocked
) {

  const todayKey =
    getTodayKey();

  const key =
    getDateKey(
      date
    );

  const weekday =
    date.toLocaleDateString(
      "en-US",
      {
        weekday:
          "short"
      }
    );

  const number =
    date.getDate();


  const classes =
    [
      "cycle-day",
      day
        ? "logged"
        : "",
      key === todayKey
        ? "today"
        : "",
      unlocked
        ? ""
        : "locked"
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      );


  return `
    <button
      class="${classes}"
      type="button"
      data-date="${key}"
      ${
        unlocked
          ? ""
          : "disabled"
      }
    >
      <strong>
        ${weekday}
      </strong>

      <span>
        ${number}
      </span>
    </button>
  `;

}


function renderCycleWeeks(
  container,
  totalDays,
  days
) {

  if (
    !container
  ) {
    return;
  }


  const dates =
    getPastDates(
      totalDays
    );

  const dayMap =
    getDayMap(
      days
    );

  const weeks =
    [];


  for (
    let i = 0;
    i < dates.length;
    i += 7
  ) {

    const row =
      dates
        .slice(
          i,
          i + 7
        )
        .map(
          date => {

            const key =
              getDateKey(
                date
              );

            const unlocked =
              (
                totalDays <=
                historyDays
              );

            return renderCycleDay(
              date,
              dayMap.get(
                key
              ),
              unlocked
            );

          }
        )
        .join(
          ""
        );


    weeks.push(
      `
        <div class="cycle-week">
          ${row}
        </div>
      `
    );

  }


  if (
    totalDays >
    historyDays
  ) {

    container.innerHTML = `
      <p class="range-note">
        ${
          totalDays
        }-day history is not included
        with your current plan.
      </p>

      ${weeks.join("")}
    `;

    return;

  }


  container.innerHTML =
    weeks.join("");

}


function renderSevenDayCycle(
  days
) {

  if (
    !cycle7Calendar
  ) {
    return;
  }


  const dates =
    getPastDates(
      7
    );

  const dayMap =
    getDayMap(
      days
    );


  cycle7Calendar.innerHTML =
    dates
      .map(
        date => {

          const key =
            getDateKey(
              date
            );

          return renderCycleDay(
            date,
            dayMap.get(
              key
            ),
            true
          );

        }
      )
      .join(
        ""
      );


  cycle7Calendar
    .querySelectorAll(
      ".cycle-day"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const key =
              button.dataset
                .date;

            const day =
              dayMap.get(
                key
              );


            if (
              !cycle7Detail
            ) {
              return;
            }


            if (
              !day
            ) {

              cycle7Detail.innerHTML = `
                <section class="range-card log-card">
                  No entries for this day yet.
                </section>
              `;

              return;

            }


            cycle7Detail.innerHTML =
              renderLogCards(
                [
                  day
                ]
              );

          }
        );

      }
    );

}


function renderProgressCycles(
  days
) {

  const cycle21 =
    document.getElementById(
      "cycle21"
    );

  const cycle42 =
    document.getElementById(
      "cycle42"
    );

  const historyCard =
    document.getElementById(
      "history60Card"
    );


  renderSevenDayCycle(
    days
  );


  if (
    cycleAccess.twentyOne
  ) {

    cycle21?.classList.remove(
      "hidden"
    );

    renderCycleWeeks(
      cycle21Calendar,
      21,
      days
    );

  } else {

    cycle21?.classList.add(
      "hidden"
    );

  }


  if (
    cycleAccess.fortyTwo
  ) {

    cycle42?.classList.remove(
      "hidden"
    );

    renderCycleWeeks(
      cycle42Calendar,
      42,
      days
    );

  } else {

    cycle42?.classList.add(
      "hidden"
    );

  }


  if (
    cycleAccess.sixty
  ) {

    historyCard?.classList.remove(
      "hidden"
    );

  } else {

    historyCard?.classList.add(
      "hidden"
    );

  }

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

  renderProgressCycles(
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
