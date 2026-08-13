"use strict";


function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );

  if (element) {
    element.textContent =
      value;
  }

}


function getRecentDays(
  dailyLogs,
  count = 7
) {

  return Object
    .values(
      dailyLogs || {}
    )
    .filter(
      (day) =>
        day &&
        day.date
    )
    .sort(
      (a, b) =>
        String(
          b.date
        ).localeCompare(
          String(
            a.date
          )
        )
    )
    .slice(
      0,
      count
    );

}


function getReadiness(
  summary
) {

  const feeling =
    String(
      summary.feeling || ""
    )
      .trim()
      .toLowerCase();

  const sleepScore =
    Number(
      summary.sleepScore || 0
    );


  /*
   * V1 uses only signals already
   * normalized by FuelAI.
   *
   * This is awareness logic,
   * not medical clearance.
   */

  if (
    feeling === "bad" ||
    (
      sleepScore > 0 &&
      sleepScore <= 1
    )
  ) {

    return {
      label:
        "RECOVERY FOCUS",

      guidance:
        "Today’s recovery signals deserve attention. Consider adjusting expectations and use your check-in, coaching judgment, and how you actually feel before hard training."
    };

  }


  if (
    feeling === "good" &&
    sleepScore >= 2
  ) {

    return {
      label:
        "READY — MONITOR",

      guidance:
        "Today’s available signals look generally supportive. Keep monitoring how you feel as training develops."
    };

  }


  if (
    feeling === "great" &&
    sleepScore >= 2
  ) {

    return {
      label:
        "READY — MONITOR",

      guidance:
        "Today’s available signals look generally supportive. Stay aware of changes during training rather than treating this status as clearance."
    };

  }


  return {
    label:
      "CHECK SIGNALS",

    guidance:
      "FightReady does not have enough strong signals for a clear readiness picture yet. Complete today’s check-in and keep logging consistently."
  };

}


function renderFightReady() {

  if (
    !window.FuelAILog
  ) {
    return;
  }


  window.FuelAILog
    .syncDailyLogs?.();


  const summary =
    window.FuelAILog
      .getFuelSummary?.();


  if (!summary) {
    return;
  }


  const readiness =
    getReadiness(
      summary
    );


  setText(
    "readinessStatus",
    readiness.label
  );


  setText(
    "readinessGuidance",
    readiness.guidance
  );


  setText(
    "feelingOutput",
    summary.feeling ||
      "Not Logged"
  );


  setText(
    "sleepOutput",
    summary.sleepHours
      ? `${Number(
          summary.sleepHours
        ).toFixed(1)} hr`
      : "Not Logged"
  );


  setText(
    "sleepQualityOutput",
    summary.sleepQuality ||
      "Not Logged"
  );


  setText(
    "trainingOutput",
    summary.trainingToday
      ? "Logged Today"
      : "Not Logged"
  );


  setText(
    "waterOutput",
    summary.waterToday
      ? `${Number(
          summary.waterToday
        ).toFixed(0)} oz`
      : "Not Logged"
  );


  const recentDays =
    getRecentDays(
      summary.dailyLogs,
      7
    );


  const sleepDays =
    recentDays.filter(
      (day) =>
        Number(
          day.sleepHours
        ) > 0
    );


  const averageSleep =
    sleepDays.length
      ? sleepDays.reduce(
          (
            sum,
            day
          ) =>
            sum +
            Number(
              day.sleepHours || 0
            ),
          0
        ) /
        sleepDays.length
      : 0;


  setText(
    "sleepAverageOutput",
    averageSleep
      ? `${averageSleep.toFixed(1)} hr`
      : "Not Enough Data"
  );


  const trainingDays =
    recentDays.filter(
      (day) =>
        day.trainingToday ===
        true
    ).length;


  setText(
    "trainingDaysOutput",
    String(
      trainingDays
    )
  );


  const hydrationDays =
    recentDays.filter(
      (day) =>
        Number(
          day.water
        ) > 0
    ).length;


  setText(
    "hydrationDaysOutput",
    String(
      hydrationDays
    )
  );


  const checkInDays =
    recentDays.filter(
      (day) =>
        Boolean(
          day.feeling
        ) ||
        Number(
          day.sleepHours
        ) > 0
    ).length;


  setText(
    "checkInDaysOutput",
    String(
      checkInDays
    )
  );


  setText(
    "dataDaysOutput",
    String(
      recentDays.length
    )
  );

}


renderFightReady();
