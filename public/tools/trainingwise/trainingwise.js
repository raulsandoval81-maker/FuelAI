(() => {

  "use strict";


  const output =
    document.getElementById(
      "trainingwiseOutput"
    );


  const modeLabels = {

    interval:
      "Interval · 45 / 15",

    emom:
      "EMOM · 10 Minutes",

    conditioning:
      "Guided Workout · Conditioning",

    strength:
      "Guided Workout · Strength",

    recovery:
      "Guided Workout · Recovery / Movement"

  };


  let timerId =
    null;

  let intervalState =
    null;


  function clearTimer() {

    if (
      timerId !==
      null
    ) {

      clearInterval(
        timerId
      );

      timerId =
        null;

    }

  }


  function formatTime(
    seconds
  ) {

    return String(
      Math.max(
        0,
        seconds
      )
    )
      .padStart(
        2,
        "0"
      );

  }


  function renderInterval() {

    clearTimer();


    intervalState = {

      workSeconds:
        45,

      restSeconds:
        15,

      rounds:
        8,

      currentRound:
        1,

      phase:
        "work",

      remaining:
        45,

      running:
        false,

      completed:
        false

    };


    output.innerHTML = `
      <p class="trainingwise-label">
        INTERVAL
      </p>

      <h2>
        45 / 15 Conditioning
      </h2>

      <p>
        45 seconds work,
        15 seconds recovery.
      </p>

      <div class="trainingwise-preset">
        8 rounds · 8 minutes
      </div>

      <div class="trainingwise-timer">

        <div
          id="intervalRound"
          class="trainingwise-timer-round"
        >
          Round 1 / 8
        </div>

        <div
          id="intervalPhase"
          class="trainingwise-timer-phase"
        >
          WORK
        </div>

        <div
          id="intervalClock"
          class="trainingwise-clock"
        >
          45
        </div>

      </div>

      <div class="trainingwise-controls">

        <button
          id="intervalStartBtn"
          type="button"
        >
          Start
        </button>

        <button
          id="intervalPauseBtn"
          type="button"
          disabled
        >
          Pause
        </button>

        <button
          id="intervalStopBtn"
          type="button"
        >
          End Session
        </button>

      </div>

      <p
        id="intervalMessage"
        class="trainingwise-session-message"
      >
        Start when ready.
      </p>
    `;


    wireIntervalControls();

  }


  function updateIntervalDisplay() {

    if (
      !intervalState
    ) {
      return;
    }


    const round =
      document.getElementById(
        "intervalRound"
      );

    const phase =
      document.getElementById(
        "intervalPhase"
      );

    const clock =
      document.getElementById(
        "intervalClock"
      );


    if (round) {

      round.textContent =
        `Round ${
          intervalState.currentRound
        } / ${
          intervalState.rounds
        }`;

    }


    if (phase) {

      phase.textContent =
        intervalState.phase ===
        "work"
          ? "WORK"
          : "RECOVER";

    }


    if (clock) {

      clock.textContent =
        formatTime(
          intervalState.remaining
        );

    }
    const timer =
  document.querySelector(
    ".trainingwise-timer"
  );


if (timer) {

  timer.classList.remove(
    "phase-work",
    "phase-rest",
    "phase-paused",
    "phase-complete"
  );


  timer.classList.add(
    intervalState.phase === "work"
      ? "phase-work"
      : "phase-rest"
  );

}

  }


  function finishInterval() {

    clearTimer();


    if (
      !intervalState ||
      intervalState.completed
    ) {
      return;
    }


    intervalState.running =
      false;

    intervalState.completed =
      true;

      const timer =
  document.querySelector(
    ".trainingwise-timer"
  );


timer?.classList.remove(
  "phase-work",
  "phase-rest",
  "phase-paused"
);


timer?.classList.add(
  "phase-complete"
);


    const message =
      document.getElementById(
        "intervalMessage"
      );


    if (message) {

      message.textContent =
        "Session complete.";

    }


    const startBtn =
      document.getElementById(
        "intervalStartBtn"
      );

    const pauseBtn =
      document.getElementById(
        "intervalPauseBtn"
      );


    if (startBtn) {

      startBtn.disabled =
        true;

    }


    if (pauseBtn) {

      pauseBtn.disabled =
        true;

    }


    window.FuelAILog
      ?.addFuelLog?.({

        type:
          "training",

        sessions:
          1,

        source:
          "trainingwise",

        trainingType:
          "interval",

        preset:
          "45/15",

        rounds:
          intervalState.rounds,

        durationMinutes:
          8,

        completed:
          true

      });

  }


  function advanceInterval() {

    if (
      !intervalState
    ) {
      return;
    }


    if (
      intervalState.phase ===
      "work"
    ) {

      intervalState.phase =
        "rest";

      intervalState.remaining =
        intervalState.restSeconds;

      updateIntervalDisplay();

      return;

    }


    if (
      intervalState.currentRound >=
      intervalState.rounds
    ) {

      finishInterval();

      return;

    }


    intervalState.currentRound +=
      1;

    intervalState.phase =
      "work";

    intervalState.remaining =
      intervalState.workSeconds;

    updateIntervalDisplay();

  }


  function tickInterval() {

    if (
      !intervalState ||
      !intervalState.running
    ) {
      return;
    }


    intervalState.remaining -=
      1;


    if (
      intervalState.remaining <=
      0
    ) {

      advanceInterval();

      return;

    }


    updateIntervalDisplay();

  }


  function startInterval() {

    if (
      !intervalState ||
      intervalState.completed
    ) {
      return;
    }


    if (
      intervalState.running
    ) {
      return;
    }


    intervalState.running =
      true;


    const startBtn =
      document.getElementById(
        "intervalStartBtn"
      );

    const pauseBtn =
      document.getElementById(
        "intervalPauseBtn"
      );


    if (startBtn) {

      startBtn.textContent =
        "Running";

      startBtn.disabled =
        true;

    }


    if (pauseBtn) {

      pauseBtn.disabled =
        false;

    }


    timerId =
      setInterval(
        tickInterval,
        1000
      );

  }


  function pauseInterval() {

    if (
      !intervalState ||
      !intervalState.running
    ) {
      return;
    }

    const timer =
  document.querySelector(
    ".trainingwise-timer"
  );


timer?.classList.remove(
  "phase-work",
  "phase-rest"
);


timer?.classList.add(
  "phase-paused"
);


    intervalState.running =
      false;

    clearTimer();


    const startBtn =
      document.getElementById(
        "intervalStartBtn"
      );

    const pauseBtn =
      document.getElementById(
        "intervalPauseBtn"
      );


    if (startBtn) {

      startBtn.textContent =
        "Resume";

      startBtn.disabled =
        false;

    }


    if (pauseBtn) {

      pauseBtn.disabled =
        true;

    }

  }


  function stopInterval() {

    clearTimer();


    if (
      intervalState
    ) {

      intervalState.running =
        false;

    }


    renderInterval();

  }


  function wireIntervalControls() {

    document
      .getElementById(
        "intervalStartBtn"
      )
      ?.addEventListener(
        "click",
        startInterval
      );


    document
      .getElementById(
        "intervalPauseBtn"
      )
      ?.addEventListener(
        "click",
        pauseInterval
      );


    document
      .getElementById(
        "intervalStopBtn"
      )
      ?.addEventListener(
        "click",
        stopInterval
      );

  }


  function openMode(
    mode
  ) {

    if (
      !output ||
      !modeLabels[mode]
    ) {
      return;
    }


    output.classList
      .remove(
        "hidden"
      );


    if (
      mode ===
      "interval"
    ) {

      renderInterval();

    } else {

      clearTimer();

      output.innerHTML = `
        <p class="trainingwise-label">
          SELECTED SESSION
        </p>

        <h2>
          ${modeLabels[mode]}
        </h2>

        <p>
          Training engine coming next.
        </p>
      `;

    }


    output.scrollIntoView({
      behavior:
        "smooth",

      block:
        "nearest"
    });

  }


  document
    .querySelectorAll(
      "[data-training-mode]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            openMode(
              button.dataset
                .trainingMode
            );

          }
        );

      }
    );

})();
