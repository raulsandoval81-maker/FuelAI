"use strict";


/* =========================
   CONSTANTS
========================= */

const FUELAI_LOG_KEY =
  "fuelai-log-v1";

const FUELAI_DAILY_KEY =
  "fuelai-daily-log-v1";

const FUELAI_LOG_DAYS =
  42;

const FUELAI_LEGACY_DATE_PREFIXES = [
  "fuelai-water-oz-",
  "fuelai-workout-",
  "fuelai-sleep-hours-",
  "fuelai-sleep-quality-"
];

const FUEL_LOG_TIME_ZONE =
  "America/Los_Angeles";



/* =========================
   SAFE STORAGE
========================= */

function safeJSONParse(
  value,
  fallback
) {

  try {

    const parsed =
      JSON.parse(
        value
      );

    return (
      parsed ??
      fallback
    );

  } catch {

    return fallback;

  }

}


function getSetup() {

  return safeJSONParse(
    localStorage.getItem(
      "fuelai-setup"
    ) || "{}",
    {}
  );

}



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
          FUEL_LOG_TIME_ZONE,

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


function todayKey() {

  return getDateKey(
    new Date()
  );

}


function getEntryDateKey(
  entry
) {

  const raw =
    entry?.createdAt;


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


  return getDateKey(
    date
  );

}



/* =========================
   NUMBER HELPERS
========================= */

function parseFuelNumber(
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
   RAW LOGS
========================= */

function getFuelLog() {

  const logs =
    safeJSONParse(
      localStorage.getItem(
        FUELAI_LOG_KEY
      ) || "[]",
      []
    );


  const cleaned =
    pruneFuelLogEntries(
      Array.isArray(logs)
        ? logs
        : []
    );


  if (
    JSON.stringify(cleaned) !==
    JSON.stringify(logs)
  ) {
    localStorage.setItem(
      FUELAI_LOG_KEY,
      JSON.stringify(cleaned)
    );
  }


  return cleaned;

}


function getDailyLogs() {

  const logs =
    safeJSONParse(
      localStorage.getItem(
        FUELAI_DAILY_KEY
      ) || "{}",
      {}
    );


  const normalized = (
    logs &&
    typeof logs ===
    "object" &&
    !Array.isArray(
      logs
    )
      ? logs
      : {}
  );


  const cleaned =
    pruneDailyLogEntries(
      normalized
    );


  if (
    JSON.stringify(cleaned) !==
    JSON.stringify(normalized)
  ) {
    localStorage.setItem(
      FUELAI_DAILY_KEY,
      JSON.stringify(cleaned)
    );
  }


  return cleaned;

}



/* =========================
   RETENTION
========================= */

function getRetentionCutoff() {
  return (
    Date.now() -
    (
      FUELAI_LOG_DAYS *
      24 *
      60 *
      60 *
      1000
    )
  );
}


function getRetentionCutoffKey() {
  return getDateKey(
    new Date(
      getRetentionCutoff()
    )
  );
}


function pruneFuelLogEntries(
  logs
) {
  const cutoff =
    getRetentionCutoff();


  return (
    Array.isArray(logs)
      ? logs
      : []
  ).filter(
    (entry) => {
      const timestamp =
        new Date(
          entry?.createdAt
        ).getTime();


      return (
        Number.isFinite(timestamp) &&
        timestamp >= cutoff
      );
    }
  );
}


function pruneDailyLogEntries(
  dailyLogs
) {
  const cutoffKey =
    getRetentionCutoffKey();

  const cleaned = {};


  Object.entries(
    dailyLogs || {}
  ).forEach(
    ([dateKey, value]) => {
      if (dateKey >= cutoffKey) {
        cleaned[dateKey] = value;
      }
    }
  );


  return cleaned;
}


function pruneLegacyDatedKeys() {
  const cutoffKey =
    getRetentionCutoffKey();

  const keys = [];


  for (
    let index = 0;
    index < localStorage.length;
    index += 1
  ) {
    const key =
      localStorage.key(index);

    if (key) {
      keys.push(key);
    }
  }


  keys.forEach(
    (key) => {
      const prefix =
        FUELAI_LEGACY_DATE_PREFIXES
          .find(
            candidate =>
              key.startsWith(candidate)
          );


      if (!prefix) {
        return;
      }


      const dateKey =
        key.slice(prefix.length);


      if (
        /^\d{4}-\d{2}-\d{2}$/.test(
          dateKey
        ) &&
        dateKey < cutoffKey
      ) {
        localStorage.removeItem(key);
      }
    }
  );
}


function pruneExpiredFuelData() {
  getFuelLog();
  getDailyLogs();
  pruneLegacyDatedKeys();
}

function saveFuelLog(
  logs
) {
  const cleaned =
    pruneFuelLogEntries(logs);


  localStorage.setItem(
    FUELAI_LOG_KEY,
    JSON.stringify(
      cleaned
    )
  );

}


function saveDailyLogs(
  dailyLogs
) {
  const cleaned =
    pruneDailyLogEntries(
      dailyLogs
    );


  localStorage.setItem(
    FUELAI_DAILY_KEY,
    JSON.stringify(
      cleaned
    )
  );

}



/* =========================
   TARGETS
========================= */

function getDailyTargets(
  setup
) {

  const weight =
    parseFuelNumber(
      setup.weight
    );


  if (
    !weight
  ) {

    return {
      caloriesTarget:
        null,

      proteinTarget:
        null
    };

  }


  let caloriesTarget =
    Math.round(
      weight * 14
    );


  if (
    setup.goal ===
    "cutwise"
  ) {

    caloriesTarget =
      Math.round(
        weight * 11
      );

  }


  if (
    setup.goal ===
    "gainwise"
  ) {

    caloriesTarget =
      Math.round(
        weight * 16
      );

  }


  const proteinTarget =
    Math.round(
      weight * 0.8
    );


  return {
    caloriesTarget,
    proteinTarget
  };

}



/* =========================
   IDS
========================= */

function createLogId() {

  if (
    crypto?.randomUUID
  ) {

    return crypto.randomUUID();

  }


  return (
    `fuel-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
  );

}



/* =========================
   ADD EVENT
========================= */

function addFuelLog(
  entry
) {

  const logs =
    getFuelLog();


  logs.push({
    id:
      createLogId(),

    createdAt:
      new Date()
        .toISOString(),

    ...entry
  });


  saveFuelLog(
    logs
  );


  buildTodayDailyLog();


  /*
   * Announce that FuelAI's daily data
   * changed.
   *
   * Consumers decide what to do with it.
   * The logging layer remains neutral.
   */
  window.dispatchEvent(
    new CustomEvent(
      "fuelai:daily-log-updated"
    )
  );

}



/* =========================
   FILTER EVENTS BY DAY
========================= */

function getLogsForDate(
  dateKey
) {

  return getFuelLog()
    .filter(
      (entry) =>

        getEntryDateKey(
          entry
        ) ===
        dateKey
    );

}


function getTodayLogs() {

  return getLogsForDate(
    todayKey()
  );

}



/* =========================
   SLEEP
========================= */

function getLegacySleep(
  dateKey
) {

  const hours =
    parseFuelNumber(
      localStorage.getItem(
        `fuelai-sleep-hours-${dateKey}`
      )
    );


  const storedQuality =
    String(
      localStorage.getItem(
        `fuelai-sleep-quality-${dateKey}`
      ) || ""
    );


  return {
    hours,
    quality:
      storedQuality
  };

}


function getSleepStatus(
  hours,
  savedQuality = ""
) {

  const quality =
    String(
      savedQuality ||
      ""
    )
      .trim();


  if (
    quality
  ) {

    let score =
      0;


    const lower =
      quality.toLowerCase();


    if (
      lower.includes(
        "strong"
      ) ||
      lower.includes(
        "great"
      )
    ) {
      score = 3;
    }

    else if (
      lower.includes(
        "moderate"
      ) ||
      lower.includes(
        "okay"
      ) ||
      lower.includes(
        "long sleep"
      )
    ) {
      score = 2;
    }

    else if (
      lower.includes(
        "low"
      ) ||
      lower.includes(
        "poor"
      )
    ) {
      score = 1;
    }


    return {
      sleepHours:
        hours,

      sleepQuality:
        quality,

      sleepScore:
        score
    };

  }


  if (
    !hours
  ) {

    return {
      sleepHours:
        0,

      sleepQuality:
        "Not Logged",

      sleepScore:
        0
    };

  }


  if (
    hours < 6
  ) {

    return {
      sleepHours:
        hours,

      sleepQuality:
        "Low Recovery",

      sleepScore:
        1
    };

  }


  if (
    hours < 8
  ) {

    return {
      sleepHours:
        hours,

      sleepQuality:
        "Moderate Recovery",

      sleepScore:
        2
    };

  }


  if (
    hours <= 10
  ) {

    return {
      sleepHours:
        hours,

      sleepQuality:
        "Strong Recovery",

      sleepScore:
        3
    };

  }


  return {
    sleepHours:
      hours,

    sleepQuality:
      "Long Sleep — Check How You Feel",

    sleepScore:
      2
  };

}



/* =========================
   DAILY AGGREGATION
========================= */

function buildDailyLogForDate(
  dateKey
) {

  const setup =
    getSetup();


  const targets =
    getDailyTargets(
      setup
    );


  const logs =
    getLogsForDate(
      dateKey
    );


  const calories =
    logs.reduce(
      (
        sum,
        entry
      ) => {

        return (
          sum +
          parseFuelNumber(
            entry.calories
          )
        );

      },
      0
    );


  const protein =
    logs.reduce(
      (
        sum,
        entry
      ) => {

        return (
          sum +
          parseFuelNumber(
            entry.protein
          )
        );

      },
      0
    );


  const carbs =
    logs.reduce(
      (
        sum,
        entry
      ) => {

        return (
          sum +
          parseFuelNumber(
            entry.carbs
          )
        );

      },
      0
    );


  const fats =
    logs.reduce(
      (
        sum,
        entry
      ) => {

        return (
          sum +
          parseFuelNumber(
            entry.fats ??
            entry.fat
          )
        );

      },
      0
    );


  /*
   * EVENT LOG IS NOW PRIMARY
   */

  const waterFromLogs =
    logs
      .filter(
        (entry) =>
          entry.type ===
          "water"
      )
      .reduce(
        (
          sum,
          entry
        ) => {

          return (
            sum +
            parseFuelNumber(
              entry.water
            )
          );

        },
        0
      );


  /*
   * Legacy fallback for days where
   * hydration was only stored in
   * fuelai-water-oz-*.
   */

  const legacyWater =
    parseFuelNumber(
      localStorage.getItem(
        `fuelai-water-oz-${dateKey}`
      )
    );


  const water =
    waterFromLogs > 0
      ? waterFromLogs
      : legacyWater;


  const trainingFromLogs =
    logs.some(
      (entry) =>
        entry.type ===
        "training"
    );


  const legacyTraining =
    localStorage.getItem(
      `fuelai-workout-${dateKey}`
    ) ===
    "complete";


  const trainingToday =
    trainingFromLogs ||
    legacyTraining;


  /*
   * Prefer Daily Check-In event
   * for sleep.
   */

  const latestCheckIn =
    logs
      .filter(
        (entry) =>
          entry.type ===
          "todays-check-in"
      )
      .slice(
        -1
      )[0];


  const legacySleep =
    getLegacySleep(
      dateKey
    );


  const sleepHours =
    parseFuelNumber(
      latestCheckIn
        ?.sleepHours
    ) ||
    legacySleep.hours;


  const sleepQualityInput =
    latestCheckIn
      ?.sleepQuality ||
    legacySleep.quality;


  const sleep =
    getSleepStatus(
      sleepHours,
      sleepQualityInput
    );


  const latestWeightEntry =
    logs
      .filter(
        (entry) =>
          entry.type ===
          "weight"
      )
      .slice(
        -1
      )[0];


  const latestWeight =
    latestWeightEntry
      ? parseFuelNumber(
          latestWeightEntry.weight
        )
      : null;


  const scanCount =
    logs.filter(
      (entry) =>
        entry.type ===
        "meal"
    ).length;


  return {

    date:
      dateKey,

    goal:
      setup.goal ||
      "fuelwise",

    guide:
      setup.guide ||
      "wiseguy",

    wiseFlavor:
      setup.wiseFlavor ||
      "sweetspot",

    lifestyleType:
      setup.lifestyleType ||
      "general-health",

    activityLevel:
      setup.activityLevel ||
      "2-3",


    calories:
      Math.round(
        calories * 10
      ) / 10,

    protein:
      Math.round(
        protein * 10
      ) / 10,

    carbs:
      Math.round(
        carbs * 10
      ) / 10,

    fats:
      Math.round(
        fats * 10
      ) / 10,

    water:
      Math.round(
        water * 10
      ) / 10,


    sleepHours:
      sleep.sleepHours,

    sleepQuality:
      sleep.sleepQuality,

    sleepScore:
      sleep.sleepScore,


    feeling:
      latestCheckIn
        ?.feeling ||
      "",


    caloriesTarget:
      targets.caloriesTarget,

    proteinTarget:
      targets.proteinTarget,


    trainingToday,

    latestWeight,

    scanCount,

    totalEntries:
      logs.length,

    updatedAt:
      new Date()
        .toISOString()

  };

}



/* =========================
   BUILD TODAY
========================= */

function buildTodayDailyLog() {

  const date =
    todayKey();


  const dailyLogs =
    getDailyLogs();


  dailyLogs[
    date
  ] =
    buildDailyLogForDate(
      date
    );


  saveDailyLogs(
    dailyLogs
  );


  return (
    dailyLogs[
      date
    ]
  );

}



/* =========================
   SYNC ALL DAYS
========================= */

function syncDailyLogs() {

  const logs =
    getFuelLog();


  const dailyLogs =
    getDailyLogs();


  const dates =
    new Set();


  logs.forEach(
    (entry) => {

      const dateKey =
        getEntryDateKey(
          entry
        );


      if (
        dateKey
      ) {

        dates.add(
          dateKey
        );

      }

    }
  );


  /*
   * Include legacy-only days that
   * already exist in daily storage.
   */

  Object.keys(
    dailyLogs
  )
    .forEach(
      (dateKey) => {

        dates.add(
          dateKey
        );

      }
    );


  dates.add(
    todayKey()
  );


  dates.forEach(
    (dateKey) => {

      dailyLogs[
        dateKey
      ] =
        buildDailyLogForDate(
          dateKey
        );

    }
  );


  saveDailyLogs(
    dailyLogs
  );


  return getDailyLogs();

}



/* =========================
   SUMMARY
========================= */

function getFuelSummary() {

  syncDailyLogs();


  const today =
    buildTodayDailyLog();


  const dailyLogs =
    getDailyLogs();


  const allDays =
    Object.values(
      dailyLogs
    );


  return {

    totalDays:
      allDays.length,


    caloriesToday:
      today.calories ||
      0,

    proteinToday:
      today.protein ||
      0,

    carbsToday:
      today.carbs ||
      0,

    fatsToday:
      today.fats ||
      0,

    waterToday:
      today.water ||
      0,


    caloriesTarget:
      today.caloriesTarget ??
      null,

    proteinTarget:
      today.proteinTarget ??
      null,


    trainingToday:
      Boolean(
        today.trainingToday
      ),


    todayCount:
      today.totalEntries ||
      0,


    weightToday:
      today.latestWeight ??
      null,


    sleepHours:
      today.sleepHours ||
      0,

    sleepQuality:
      today.sleepQuality ||
      "Not Logged",

    sleepScore:
      today.sleepScore ||
      0,


    feeling:
      today.feeling ||
      "",


    wiseFlavor:
      today.wiseFlavor ||
      getSetup()
        .wiseFlavor ||
      "sweetspot",


    today,

    dailyLogs

  };

}



/* =========================
   GLOBAL API
========================= */

pruneExpiredFuelData();


window.FuelAILog = {

  retentionDays:
    FUELAI_LOG_DAYS,

  getFuelLog,

  getDailyLogs,

  saveFuelLog,

  saveDailyLogs,

  addFuelLog,

  getTodayLogs,

  getLogsForDate,

  buildTodayDailyLog,

  buildDailyLogForDate,

  syncDailyLogs,

  pruneExpiredFuelData,

  getFuelSummary

};
