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
   YESTERDAY
========================= */

function renderYesterdaySnapshot(
  days
) {

  const output =
    document.getElementById(
      "yesterdaySnapshot"
    );

  if (
    !output
  ) {
    return;
  }


  const yesterday =
    new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );


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
        yesterday
      );


  const partMap =
    Object.fromEntries(
      parts.map(
        part => [
          part.type,
          part.value
        ]
      )
    );


  const yesterdayKey =
    `${partMap.year}-${partMap.month}-${partMap.day}`;


  const day =
    days.find(
      entry =>
        String(
          entry.date || ""
        ).startsWith(
          yesterdayKey
        )
    );


  if (
    !day
  ) {

    output.innerHTML = `
      No entries yesterday.
    `;

    return;
  }


  output.innerHTML = `
    🔥 Calories:
    ${day.calories}

    <br><br>

    🥩 Protein:
    ${day.protein}g

    <br><br>

    💧 Hydration:
    ${day.water} oz

    <br><br>

    🏋️ Training:
    ${
      day.trainingToday
        ? "Logged"
        : "—"
    }

    <br><br>

    ⚖️ Weight:
    ${
      day.latestWeight
        ? `${day.latestWeight} lbs`
        : "—"
    }

    <br><br>

    😴 Sleep:
    ${
      day.sleepHours ||
      day.sleepQuality
        ? `
            ${day.sleepHours || "—"} hrs
            ${day.sleepQuality || ""}
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
        date
      );

  const map =
    Object.fromEntries(
      parts.map(
        part => [
          part.type,
          part.value
        ]
      )
    );

  return (
    `${map.year}-${map.month}-${map.day}`
  );
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


/*
 * Calendar-cycle dates
 *
 * 7 / 21 / 42 use real Monday-Sunday
 * calendar weeks.
 *
 * 60-day History remains rolling.
 */

function getCalendarCycleDates(
  totalDays
) {

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


  const map =
    Object.fromEntries(
      parts.map(
        part => [
          part.type,
          part.value
        ]
      )
    );


  /*
   * Noon avoids midnight / DST edge cases.
   */

  const today =
    new Date(
      Number(
        map.year
      ),
      Number(
        map.month
      ) - 1,
      Number(
        map.day
      ),
      12,
      0,
      0
    );


  /*
   * JS:
   * Sunday = 0
   * Monday = 1
   *
   * Convert to:
   * Monday = 0 ... Sunday = 6
   */

  const mondayOffset =
    (
      today.getDay() + 6
    ) % 7;


  const currentMonday =
    new Date(
      today
    );

  currentMonday.setDate(
    today.getDate() -
    mondayOffset
  );


  const weeks =
    Math.max(
      1,
      Math.ceil(
        totalDays / 7
      )
    );


  const start =
    new Date(
      currentMonday
    );

  start.setDate(
    currentMonday.getDate() -
    (
      weeks - 1
    ) * 7
  );


  const dates =
    [];


  for (
    let i = 0;
    i < weeks * 7;
    i++
  ) {

    const date =
      new Date(
        start
      );

    date.setDate(
      start.getDate() + i
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


function getDailyStatus(
  day
) {

  if (
    !day
  ) {
    return {
      key: "no-data",
      label: "No Data",
      symbol: "●",
      percent: null
    };
  }


  let earned = 0;
  let possible = 0;


  /*
   * Fuel / calories
   */
  if (
    Number(day.caloriesTarget) > 0
  ) {

    possible++;

    const target =
      Number(
        day.caloriesTarget
      );

    const actual =
      Number(
        day.calories
      ) || 0;

    const ratio =
      actual / target;

    if (
      ratio >= .8 &&
      ratio <= 1.2
    ) {
      earned++;
    }

  }


  /*
   * Protein
   */
  if (
    Number(day.proteinTarget) > 0
  ) {

    possible++;

    const target =
      Number(
        day.proteinTarget
      );

    const actual =
      Number(
        day.protein
      ) || 0;

    if (
      actual >=
      target * .8
    ) {
      earned++;
    }

  }


  /*
   * Hydration
   *
   * V1 uses logged hydration presence/
   * reasonable daily intake rather than
   * punishing the user for missing a
   * personalized hydration target.
   */
  if (
    Number(day.water) > 0
  ) {

    possible++;

    if (
      Number(day.water) >= 48
    ) {
      earned++;
    }

  }


  /*
   * Sleep / recovery
   */
  if (
    Number(day.sleepHours) > 0
  ) {

    possible++;

    if (
      Number(day.sleepHours) >= 7
    ) {
      earned++;
    }

  }


  /*
   * Training / daily engagement
   */
  if (
    day.trainingToday === true
  ) {
    possible++;
    earned++;
  }


  /*
   * No meaningful signals logged.
   */
  if (
    possible < 2
  ) {
    return {
      key: "no-data",
      label:
        possible === 0
          ? "No Data"
          : "Partial",
      symbol: "●",
      percent: null
    };
  }


  const percent =
    Math.round(
      (
        earned /
        possible
      ) * 100
    );


  if (
    percent >= 75
  ) {
    return {
      key: "on-track",
      label: "On Track",
      symbol: "●",
      percent
    };
  }


  if (
    percent >= 45
  ) {
    return {
      key: "mixed",
      label: "Mixed",
      symbol: "●",
      percent
    };
  }


  return {
    key: "attention",
    label: "Needs Attention",
    symbol: "●",
    percent
  };

}


function getCycleSummary(
  dates,
  dayMap
) {

  const statuses =
    dates
      .map(
        date => {

          const key =
            getDateKey(
              date
            );

          return getDailyStatus(
            dayMap.get(
              key
            )
          );

        }
      );


  const scored =
    statuses.filter(
      status =>
        status.percent !== null
    );


  const onTrack =
    scored.filter(
      status =>
        status.key ===
        "on-track"
    ).length;

  const mixed =
    scored.filter(
      status =>
        status.key ===
        "mixed"
    ).length;

  const attention =
    scored.filter(
      status =>
        status.key ===
        "attention"
    ).length;


  const percent =
    scored.length
      ? Math.round(
          (
            onTrack /
            scored.length
          ) * 100
        )
      : 0;


  return {
    onTrack,
    mixed,
    attention,
    scored:
      scored.length,
    percent
  };

}


function renderCycleSummary(
  dates,
  dayMap
) {

  const summary =
    getCycleSummary(
      dates,
      dayMap
    );


  if (
    !summary.scored
  ) {
    return `
      <div class="cycle-summary">
        <span class="status-no-data">
          ● No scored days yet
        </span>
      </div>
    `;
  }


  return `
    <div class="cycle-summary">

      <strong>
        ${summary.percent}% On Track
      </strong>

      <span class="cycle-sample-size">
        ${summary.scored}
        ${
          summary.scored === 1
            ? "scored day"
            : "scored days"
        }
      </span>

      <div class="cycle-summary-stats">

        <span class="status-on-track">
          ● ${summary.onTrack} On Track
        </span>

        <span class="status-mixed">
          ● ${summary.mixed} Mixed
        </span>

        <span class="status-attention">
          ● ${summary.attention} Needs Attention
        </span>

      </div>

    </div>
  `;

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


  const status =
    getDailyStatus(
      day
    );


  return `
    <button
      class="${classes} status-${status.key}"
      type="button"
      data-date="${key}"
      ${
        unlocked
          ? ""
          : "disabled"
      }
      aria-label="${weekday} ${number}: ${status.label}"
    >

      <strong>
        ${weekday}
      </strong>

      <span class="cycle-date-number">
        ${number}
      </span>

      <span
        class="cycle-status-dot"
        title="${status.label}"
      >
        ${status.symbol}
      </span>

      <small class="cycle-status-label">
        ${status.label}
      </small>

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
    getCalendarCycleDates(
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


    const weekNumber =
      Math.floor(i / 7) + 1;

    weeks.push(
      `
        <div class="cycle-week-wrap">

          <p class="cycle-week-label">
            Week ${weekNumber}
          </p>

          <div class="cycle-week">
            ${row}
          </div>

        </div>
      `
    );

  }


  const summary =
    renderCycleSummary(
      dates,
      dayMap
    );


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

      ${summary}

      ${weeks.join("")}
    `;

    return;

  }


  container.innerHTML = `
    ${summary}
    ${weeks.join("")}
  `;

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
    getCalendarCycleDates(
      7
    );

  const dayMap =
    getDayMap(
      days
    );


  cycle7Calendar.innerHTML =
    `
      <div class="cycle-summary-wrap">
        ${renderCycleSummary(
          dates,
          dayMap
        )}
      </div>

      <div class="cycle-week cycle-week-seven">
        ${
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
            )
        }
      </div>
    `;


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

    if (cycle21) {
      cycle21.hidden = false;
    }

    renderCycleWeeks(
      cycle21Calendar,
      21,
      days
    );

  } else {

    if (cycle21) {
      cycle21.hidden = true;
    }

  }


  if (
    cycleAccess.fortyTwo
  ) {

    if (cycle42) {
      cycle42.hidden = false;
    }

    renderCycleWeeks(
      cycle42Calendar,
      42,
      days
    );

  } else {

    if (cycle42) {
      cycle42.hidden = true;
    }

  }


  if (
    cycleAccess.sixty
  ) {

    if (historyCard) {
      historyCard.hidden = false;
    }

  } else {

    if (historyCard) {
      historyCard.hidden = true;
    }

  }

}


/* =========================
   RECENT LOGS
========================= */

function renderLogs() {

  const days =
    getSortedDays();


  renderTodaySnapshot(
    days
  );



  renderYesterdaySnapshot(
    days
  );

  renderHistoryTrends(
    days
  );

  renderMacroTrends(
    days
  );

  renderProgressCycles(
    days
  );


  /*
   * Legacy Recent History support.
   * The new cycle UI no longer
   * requires logsContainer.
   */
  if (
    !logsContainer
  ) {
    return;
  }


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
   60 DAY TRENDS
========================= */

function makeTrendSVG(
  values
) {

  const clean =
    values.filter(
      value =>
        Number.isFinite(
          Number(value)
        )
    )
    .map(
      Number
    );


  if (
    clean.length < 2
  ) {
    return "";
  }


  const width = 320;
  const height = 100;
  const pad = 8;

  const min =
    Math.min(
      ...clean
    );

  const max =
    Math.max(
      ...clean
    );

  const spread =
    max - min || 1;


  const points =
    clean.map(
      (
        value,
        index
      ) => {

        const x =
          pad +
          (
            index /
            Math.max(
              clean.length - 1,
              1
            )
          ) *
          (
            width -
            pad * 2
          );

        const y =
          height -
          pad -
          (
            (
              value - min
            ) /
            spread
          ) *
          (
            height -
            pad * 2
          );

        return `${x},${y}`;

      }
    )
    .join(" ");


  return `
    <svg
      class="trend-chart"
      viewBox="0 0 ${width} ${height}"
      preserveAspectRatio="none"
      aria-hidden="true"
    >

      <line
        class="trend-grid-line"
        x1="0"
        y1="25"
        x2="${width}"
        y2="25"
      />

      <line
        class="trend-grid-line"
        x1="0"
        y1="50"
        x2="${width}"
        y2="50"
      />

      <line
        class="trend-grid-line"
        x1="0"
        y1="75"
        x2="${width}"
        y2="75"
      />

      <polyline
        class="trend-line"
        points="${points}"
      />

    </svg>
  `;

}


function renderTrendCard(
  title,
  latest,
  values
) {

  const chart =
    makeTrendSVG(
      values
    );


  return `
    <section class="trend-card">

      <div class="trend-card-head">

        <strong>
          ${title}
        </strong>

        <span>
          ${latest}
        </span>

      </div>

      ${
        chart ||
        `
          <div class="trend-empty">
            Not enough data yet.
          </div>
        `
      }

    </section>
  `;

}


function renderHistoryTrends(
  days
) {

  const container =
    document.getElementById(
      "historyTrendGrid"
    );

  if (
    !container
  ) {
    return;
  }


  const history =
    days
      .slice(
        0,
        60
      )
      .reverse();


  const weight =
    history
      .map(
        day =>
          Number(
            day.latestWeight
          )
      )
      .filter(
        value =>
          Number.isFinite(
            value
          ) &&
          value > 0
      );


  const calories =
    history
      .map(
        day =>
          Number(
            day.calories
          )
      )
      .filter(
        Number.isFinite
      );


  const hydration =
    history
      .map(
        day =>
          Number(
            day.water
          )
      )
      .filter(
        Number.isFinite
      );


  const sleep =
    history
      .map(
        day =>
          Number(
            day.sleepHours
          )
      )
      .filter(
        value =>
          Number.isFinite(
            value
          ) &&
          value > 0
      );


  container.innerHTML = [

    renderTrendCard(
      "⚖️ Weight",
      weight.length
        ? `${weight.at(-1)} lbs`
        : "—",
      weight
    ),

    renderTrendCard(
      "🔥 Calories",
      calories.length
        ? `${calories.at(-1)} cal`
        : "—",
      calories
    ),

    renderTrendCard(
      "💧 Hydration",
      hydration.length
        ? `${hydration.at(-1)} oz`
        : "—",
      hydration
    ),

    renderTrendCard(
      "😴 Sleep",
      sleep.length
        ? `${sleep.at(-1)} hrs`
        : "—",
      sleep
    )

  ].join("");

}


/* =========================
   14 DAY MACRO BALANCE
========================= */

function renderMacroTrends(
  days
) {

  const container =
    document.getElementById(
      "macroTrendGrid"
    );


  if (
    !container
  ) {
    return;
  }


  const history =
    days
      .slice(
        0,
        14
      )
      .reverse();


  const proteinPct = [];
  const carbsPct = [];
  const fatsPct = [];


  history.forEach(
    day => {

      const protein =
        Number(
          day.protein
        ) || 0;

      const carbs =
        Number(
          day.carbs
        ) || 0;

      const fats =
        Number(
          day.fats ??
          day.fat
        ) || 0;


      const proteinCalories =
        protein * 4;

      const carbCalories =
        carbs * 4;

      const fatCalories =
        fats * 9;

      const total =
        proteinCalories +
        carbCalories +
        fatCalories;


      if (
        total <= 0
      ) {
        return;
      }


      const p =
        Math.round(
          proteinCalories /
          total *
          100
        );

      const c =
        Math.round(
          carbCalories /
          total *
          100
        );

      const f =
        Math.max(
          0,
          100 - p - c
        );


      proteinPct.push(p);
      carbsPct.push(c);
      fatsPct.push(f);

    }
  );


  const average =
    values => {

      if (
        !values.length
      ) {
        return null;
      }

      return Math.round(
        values.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        values.length
      );

    };


  const avgProtein =
    average(
      proteinPct
    );

  const avgCarbs =
    average(
      carbsPct
    );

  const avgFats =
    average(
      fatsPct
    );


  container.innerHTML = [

    renderTrendCard(
      "🥩 Protein",
      avgProtein !== null
        ? `${avgProtein}% avg`
        : "—",
      proteinPct
    ),

    renderTrendCard(
      "🍞 Carbs",
      avgCarbs !== null
        ? `${avgCarbs}% avg`
        : "—",
      carbsPct
    ),

    renderTrendCard(
      "🥑 Fat",
      avgFats !== null
        ? `${avgFats}% avg`
        : "—",
      fatsPct
    )

  ].join("");

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
    fullHistoryContainer.hidden;


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
