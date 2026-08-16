(() => {
  "use strict";


  const MAX_DAYS =
    42;


  function getSafeDays() {

    const dailyLogs =
      window.FuelAILog
        ?.getDailyLogs?.() ||
      {};


    return Object.entries(
      dailyLogs
    )
      .map(
        (
          [
            dateKey,
            day
          ]
        ) => ({

          /*
           * Some older daily records may
           * not contain their own date.
           * The object key is authoritative.
           */
          date:
            day?.date ||
            dateKey,

          weight:
            day?.latestWeight ??
            null,

          sleepHours:
            day?.sleepHours ??
            null,

          hydrationOz:
            day?.water ??
            null,

          calories:
            day?.calories ??
            null,

          caloriesTarget:
            day?.caloriesTarget ??
            null,

          trainingToday:
            Boolean(
              day?.trainingToday
            )

        })
      )
      .filter(
        day =>
          /^\d{4}-\d{2}-\d{2}$/
            .test(
              day.date
            )
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      )
      .slice(
        -MAX_DAYS
      );

  }


  async function syncTeamMetrics() {

    const firebase =
      window.FuelAIFirebase;


    const user =
      firebase
        ?.auth
        ?.currentUser;


    if (
      !user ||
      !window.FuelAILog
    ) {
      return {
        ok: false,
        skipped: true
      };
    }


    const days =
      getSafeDays();


    const token =
      await user
        .getIdToken(
          true
        );


    const response =
      await fetch(
        "/api/team/metrics-sync",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body:
            JSON.stringify({
              days
            })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Unable to sync Team metrics"
      );

    }


    return {
      ...data,
      sent:
        days.length
    };

  }


  let syncTimer =
    null;


  function queueTeamMetricsSync() {

    clearTimeout(
      syncTimer
    );


    syncTimer =
      setTimeout(
        async () => {

          try {

            await syncTeamMetrics();

          } catch (error) {

            console.warn(
              "FuelAI Team metrics sync skipped:",
              error?.message ||
              error
            );

          }

        },
        750
      );

  }


  function connectFirebaseAuth() {

    const firebase =
      window.FuelAIFirebase;


    if (
      !firebase?.watchAuth
    ) {
      return;
    }


    firebase.watchAuth(
      user => {

        if (user) {
          queueTeamMetricsSync();
        }

      }
    );

  }


  /*
   * FuelAI Log announces data changes.
   * Team Metrics decides whether those
   * changes need to be synchronized.
   */
  window.addEventListener(
    "fuelai:daily-log-updated",
    queueTeamMetricsSync
  );


  /*
   * firebase.js may already be ready,
   * or may finish after this helper.
   */
  if (
    window.FuelAIFirebase
      ?.watchAuth
  ) {

    connectFirebaseAuth();

  } else {

    window.addEventListener(
      "fuelai:firebase-ready",
      connectFirebaseAuth,
      {
        once: true
      }
    );

  }


  window.FuelAITeamMetrics = {
    getSafeDays,
    syncTeamMetrics,
    queueTeamMetricsSync
  };

})();
