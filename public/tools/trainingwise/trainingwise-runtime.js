(() => {
  "use strict";

  if (window.__trainingWiseRuntimeInstalled) return;
  window.__trainingWiseRuntimeInstalled = true;

  const nativeSetInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);
  const nativeSetTimeout = window.setTimeout.bind(window);

  const reliableIntervals = new Map();
  const ONE_SECOND = 1000;
  const DRIVER_MS = 200;

  const monotonicNow = () => {
    if (window.performance && typeof window.performance.now === "function") {
      return window.performance.now();
    }
    return Date.now();
  };

  function runReliableInterval(record) {
    if (!record || !record.active) return;

    const elapsed = Math.max(0, monotonicNow() - record.startedAt);
    const targetTicks = Math.floor(elapsed / ONE_SECOND);
    let due = targetTicks - record.emittedTicks;

    if (due <= 0) return;

    while (due > 0 && record.active) {
      record.emittedTicks += 1;
      due -= 1;
      record.callback(...record.args);
    }
  }

  window.setInterval = function trainingWiseSetInterval(callback, delay, ...args) {
    const ms = Number(delay) || 0;

    if (typeof callback !== "function" || ms !== ONE_SECOND) {
      return nativeSetInterval(callback, delay, ...args);
    }

    const record = {
      active: true,
      callback,
      args,
      startedAt: monotonicNow(),
      emittedTicks: 0,
      driverId: null
    };

    record.driverId = nativeSetInterval(
      () => runReliableInterval(record),
      DRIVER_MS
    );

    reliableIntervals.set(record.driverId, record);
    return record.driverId;
  };

  window.clearInterval = function trainingWiseClearInterval(id) {
    const record = reliableIntervals.get(id);

    if (record) {
      record.active = false;
      reliableIntervals.delete(id);
    }

    nativeClearInterval(id);
  };

  function flushReliableIntervals() {
    reliableIntervals.forEach((record) => runReliableInterval(record));
  }

  let wakeLock = null;
  let wakeLockWanted = false;

  function isTimedSessionRunning() {
    const pauseButtons = [
      "intervalPauseBtn",
      "emomPauseBtn",
      "tabataPauseBtn",
      "tabataBoardPauseBtn"
    ];

    return pauseButtons.some((id) => {
      const button = document.getElementById(id);
      return Boolean(button && !button.disabled);
    });
  }

  async function releaseWakeLock() {
    const lock = wakeLock;
    wakeLock = null;

    if (!lock) return;

    try {
      await lock.release();
    } catch (error) {
      console.debug("TrainingWise wake lock release skipped.", error);
    }
  }

  async function requestWakeLock() {
    if (
      !wakeLockWanted ||
      document.visibilityState !== "visible" ||
      !("wakeLock" in navigator) ||
      wakeLock
    ) {
      return;
    }

    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener?.(
        "release",
        () => {
          wakeLock = null;
        },
        { once: true }
      );
    } catch (error) {
      console.debug("TrainingWise wake lock unavailable.", error);
      wakeLock = null;
    }
  }

  async function syncWakeLockToSession() {
    wakeLockWanted = isTimedSessionRunning();

    if (wakeLockWanted) {
      await requestWakeLock();
    } else {
      await releaseWakeLock();
    }
  }

  function scheduleWakeLockSync() {
    nativeSetTimeout(() => {
      syncWakeLockToSession();
    }, 0);
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest(
        "#intervalStartBtn, #intervalPauseBtn, #intervalStopBtn, " +
        "#emomStartBtn, #emomPauseBtn, #emomStopBtn, " +
        "#tabataStartBtn, #tabataPauseBtn, #tabataStopBtn, " +
        "#tabataBoardStartBtn, #tabataBoardPauseBtn, #tabataBoardExitBtn, " +
        "[data-trainingwise-board-action], [data-trainingwise-board-exit]"
      )
      : null;

    if (!target) return;
    scheduleWakeLockSync();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      flushReliableIntervals();
      syncWakeLockToSession();
      return;
    }

    releaseWakeLock();
  });

  window.addEventListener("pageshow", () => {
    flushReliableIntervals();
    syncWakeLockToSession();
  });

  window.addEventListener("pagehide", () => {
    wakeLockWanted = false;
    releaseWakeLock();
  });

  window.TrainingWiseRuntime = {
    flushReliableIntervals,
    syncWakeLockToSession,
    isTimedSessionRunning,
    getReliableIntervalCount: () => reliableIntervals.size
  };
})();
