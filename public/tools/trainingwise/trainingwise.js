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
      "Self-Guided · Conditioning",

    strength:
      "Self-Guided · Strength",

    recovery:
      "Self-Guided · Recovery / Movement"

  };


  let timerId =
    null;

  let intervalState =
    null;

  let emomState =
    null;

  let selfGuidedState =
    null;



  /* =========================
     SHARED TIMER
  ========================= */

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



  function formatSeconds(
    seconds
  ) {

    return String(
      Math.max(
        0,
        Number(seconds) || 0
      )
    )
      .padStart(
        2,
        "0"
      );

  }



  function formatSessionTime(
    totalSeconds
  ) {

    const safe =
      Math.max(
        0,
        Number(totalSeconds) || 0
      );


    const minutes =
      Math.floor(
        safe / 60
      );


    const seconds =
      safe % 60;


    return (
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`
    );

  }



  /* =========================
     INTERVAL
  ========================= */

  function renderInterval() {

    clearTimer();


    intervalState = {

      workSeconds:
        45,

      restSeconds:
        15,

      intervalsPerRound:
        8,

      currentInterval:
        1,

      sessionRounds:
        2,

      currentSessionRound:
        1,

      roundRestSeconds:
        90,

      inRoundRest:
        false,

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
        8 minutes per round
      </div>


      <div class="trainingwise-round-picker">

        <span class="trainingwise-label">
          ROUNDS
        </span>

        <div class="trainingwise-round-options">

          <button
            type="button"
            data-interval-rounds="2"
            class="active"
          >
            2
          </button>

          <button
            type="button"
            data-interval-rounds="3"
          >
            3
          </button>

          <button
            type="button"
            data-interval-rounds="4"
          >
            4
          </button>

        </div>

        <small id="intervalDuration">
          Total: 17:30
        </small>

      </div>


      <div
        class="trainingwise-timer phase-work"
      >

        <div
          id="intervalRound"
          class="trainingwise-timer-round"
        >
          Round 1 / 2 · Interval 1 / 8
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

    const timer =
      document.querySelector(
        ".trainingwise-timer"
      );


    if (round) {

      round.textContent =
        `Round ${
          intervalState.currentSessionRound
        } / ${
          intervalState.sessionRounds
        } · Interval ${
          intervalState.currentInterval
        } / ${
          intervalState.intervalsPerRound
        }`;

    }


    if (phase) {

      if (
        intervalState.phase ===
        "round-rest"
      ) {

        phase.textContent =
          "ROUND REST";

      }

      else if (
        intervalState.phase ===
        "rest"
      ) {

        phase.textContent =
          "RECOVER";

      }

      else {

        phase.textContent =
          "WORK";

      }

    }


    if (clock) {

      clock.textContent =
        formatSeconds(
          intervalState.remaining
        );

    }


    if (
      timer &&
      !intervalState.completed
    ) {

      timer.classList.remove(
        "phase-work",
        "phase-rest",
        "phase-complete"
      );


      timer.classList.add(
        intervalState.phase ===
        "work"
          ? "phase-work"
          : "phase-rest"
      );

    }

  }



  function advanceInterval() {

    if (
      !intervalState
    ) {
      return;
    }


    /*
     * End of round rest.
     * Begin next 8-minute round.
     */

    if (
      intervalState.inRoundRest
    ) {

      intervalState.inRoundRest =
        false;

      intervalState.currentSessionRound +=
        1;

      intervalState.currentInterval =
        1;

      intervalState.phase =
        "work";

      intervalState.remaining =
        intervalState.workSeconds;

      updateIntervalDisplay();

      return;

    }


    /*
     * End of work segment.
     * Every 45 seconds gets its
     * normal 15-second recovery.
     */

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


    /*
     * End of the eighth
     * 15-second recovery.
     */

    if (
      intervalState.currentInterval >=
      intervalState.intervalsPerRound
    ) {

      if (
        intervalState.currentSessionRound >=
        intervalState.sessionRounds
      ) {

        finishInterval();

        return;

      }


      intervalState.inRoundRest =
        true;

      intervalState.phase =
        "round-rest";

      intervalState.remaining =
        intervalState.roundRestSeconds;

      updateIntervalDisplay();

      return;

    }


    intervalState.currentInterval +=
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
      intervalState.completed ||
      intervalState.running
    ) {
      return;
    }


    intervalState.running =
      true;


    updateIntervalDisplay();


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


    intervalState.running =
      false;

    clearTimer();


    const timer =
      document.querySelector(
        ".trainingwise-timer"
      );

    const phase =
      document.getElementById(
        "intervalPhase"
      );

    const startBtn =
      document.getElementById(
        "intervalStartBtn"
      );

    const pauseBtn =
      document.getElementById(
        "intervalPauseBtn"
      );


    timer?.classList.remove(
      "phase-work",
      "phase-rest"
    );

    timer?.classList.add(
      "phase-paused"
    );


    if (phase) {

      phase.textContent =
        "PAUSED";

    }


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

    const phase =
      document.getElementById(
        "intervalPhase"
      );

    const message =
      document.getElementById(
        "intervalMessage"
      );


    timer?.classList.remove(
      "phase-work",
      "phase-rest",
      "phase-paused"
    );

    timer?.classList.add(
      "phase-complete"
    );


    if (phase) {

      phase.textContent =
        "COMPLETE";

    }


    if (message) {

      message.textContent =
        "Session complete.";

    }


    document
      .getElementById(
        "intervalStartBtn"
      )
      ?.setAttribute(
        "disabled",
        ""
      );


    document
      .getElementById(
        "intervalPauseBtn"
      )
      ?.setAttribute(
        "disabled",
        ""
      );


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
          intervalState.sessionRounds,

        intervalsPerRound:
          intervalState.intervalsPerRound,

        roundRestSeconds:
          intervalState.roundRestSeconds,

        durationSeconds:
          (
            8 *
            60 *
            intervalState.sessionRounds
          ) +
          (
            intervalState.roundRestSeconds *
            Math.max(
              0,
              intervalState.sessionRounds - 1
            )
          ),

        completed:
          true

      });

  }



  function stopInterval() {

    clearTimer();

    renderInterval();

  }



  function setIntervalSessionRounds(
    rounds
  ) {

    if (
      !intervalState ||
      intervalState.running
    ) {
      return;
    }


    const selected =
      Number(
        rounds
      );


    if (
      ![2, 3, 4]
        .includes(
          selected
        )
    ) {
      return;
    }


    intervalState.sessionRounds =
      selected;

    intervalState.currentSessionRound =
      1;

    intervalState.currentInterval =
      1;

    intervalState.inRoundRest =
      false;

    intervalState.phase =
      "work";

    intervalState.remaining =
      intervalState.workSeconds;


    document
      .querySelectorAll(
        "[data-interval-rounds]"
      )
      .forEach(
        (button) => {

          button.classList.toggle(
            "active",
            Number(
              button.dataset
                .intervalRounds
            ) === selected
          );

        }
      );


    const duration =
      document.getElementById(
        "intervalDuration"
      );


    if (duration) {

      const totalSeconds =
        (
          selected *
          8 *
          60
        ) +
        (
          Math.max(
            0,
            selected - 1
          ) *
          intervalState.roundRestSeconds
        );


      duration.textContent =
        `Total: ${
          formatSessionTime(
            totalSeconds
          )
        }`;

    }


    updateIntervalDisplay();

  }



  function wireIntervalControls() {

    document
      .querySelectorAll(
        "[data-interval-rounds]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              setIntervalSessionRounds(
                button.dataset
                  .intervalRounds
              );

            }
          );

        }
      );


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



  /* =========================
     EMOM
  ========================= */

  function renderEmom() {

    clearTimer();


    emomState = {

      minutesPerRound:
        10,

      currentMinute:
        1,

      sessionRounds:
        2,

      currentSessionRound:
        1,

      roundRestSeconds:
        120,

      inRoundRest:
        false,

      remaining:
        60,

      running:
        false,

      completed:
        false

    };


    output.innerHTML = `
      <p class="trainingwise-label">
        EMOM
      </p>

      <h2>
        10 Minute EMOM
      </h2>

      <p>
        Start each round on the minute.
        Complete the work, then use
        the remaining time to recover.
      </p>

      <div class="trainingwise-preset">
        10 minutes per round
      </div>


      <div class="trainingwise-round-picker">

        <span class="trainingwise-label">
          ROUNDS
        </span>

        <div class="trainingwise-round-options">

          <button
            type="button"
            data-emom-rounds="2"
            class="active"
          >
            2
          </button>

          <button
            type="button"
            data-emom-rounds="3"
          >
            3
          </button>

          <button
            type="button"
            data-emom-rounds="4"
          >
            4
          </button>

        </div>

        <small id="emomDuration">
          Total: 22:00
        </small>

      </div>


      <div
        class="trainingwise-timer phase-work"
      >

        <div
          id="emomRound"
          class="trainingwise-timer-round"
        >
          Round 1 / 2 · Minute 1 / 10
        </div>

        <div
          id="emomPhase"
          class="trainingwise-timer-phase"
        >
          GO
        </div>

        <div
          id="emomClock"
          class="trainingwise-clock"
        >
          60
        </div>

      </div>


      <div class="trainingwise-controls">

        <button
          id="emomStartBtn"
          type="button"
        >
          Start
        </button>

        <button
          id="emomPauseBtn"
          type="button"
          disabled
        >
          Pause
        </button>

        <button
          id="emomStopBtn"
          type="button"
        >
          End Session
        </button>

      </div>


      <p
        id="emomMessage"
        class="trainingwise-session-message"
      >
        Start when ready.
      </p>
    `;


    wireEmomControls();

  }



  function updateEmomDisplay() {

    if (
      !emomState
    ) {
      return;
    }


    const round =
      document.getElementById(
        "emomRound"
      );

    const phase =
      document.getElementById(
        "emomPhase"
      );

    const clock =
      document.getElementById(
        "emomClock"
      );

    const timer =
      document.querySelector(
        ".trainingwise-timer"
      );


    if (round) {

      round.textContent =
        `Round ${
          emomState.currentSessionRound
        } / ${
          emomState.sessionRounds
        } · Minute ${
          emomState.currentMinute
        } / ${
          emomState.minutesPerRound
        }`;

    }


    if (phase) {

      phase.textContent =
        emomState.inRoundRest
          ? "ROUND REST"
          : "GO";

    }


    if (clock) {

      clock.textContent =
        formatSeconds(
          emomState.remaining
        );

    }


    if (
      timer &&
      !emomState.completed
    ) {

      timer.classList.remove(
        "phase-work",
        "phase-rest",
        "phase-complete"
      );


      timer.classList.add(
        emomState.inRoundRest
          ? "phase-rest"
          : "phase-work"
      );

    }

  }



  function advanceEmom() {

    if (
      !emomState
    ) {
      return;
    }


    /*
     * Round rest finished.
     * Start next 10-minute round.
     */

    if (
      emomState.inRoundRest
    ) {

      emomState.inRoundRest =
        false;

      emomState.currentSessionRound +=
        1;

      emomState.currentMinute =
        1;

      emomState.remaining =
        60;

      updateEmomDisplay();

      return;

    }


    /*
     * Tenth minute finished.
     */

    if (
      emomState.currentMinute >=
      emomState.minutesPerRound
    ) {

      if (
        emomState.currentSessionRound >=
        emomState.sessionRounds
      ) {

        finishEmom();

        return;

      }


      emomState.inRoundRest =
        true;

      emomState.remaining =
        emomState.roundRestSeconds;

      updateEmomDisplay();

      return;

    }


    emomState.currentMinute +=
      1;

    emomState.remaining =
      60;

    updateEmomDisplay();

  }



  function tickEmom() {

    if (
      !emomState ||
      !emomState.running
    ) {
      return;
    }


    emomState.remaining -=
      1;


    if (
      emomState.remaining <=
      0
    ) {

      advanceEmom();

      return;

    }


    updateEmomDisplay();

  }



  function startEmom() {

    if (
      !emomState ||
      emomState.completed ||
      emomState.running
    ) {
      return;
    }


    emomState.running =
      true;


    updateEmomDisplay();


    const startBtn =
      document.getElementById(
        "emomStartBtn"
      );

    const pauseBtn =
      document.getElementById(
        "emomPauseBtn"
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
        tickEmom,
        1000
      );

  }



  function pauseEmom() {

    if (
      !emomState ||
      !emomState.running
    ) {
      return;
    }


    emomState.running =
      false;

    clearTimer();


    const timer =
      document.querySelector(
        ".trainingwise-timer"
      );

    const phase =
      document.getElementById(
        "emomPhase"
      );

    const startBtn =
      document.getElementById(
        "emomStartBtn"
      );

    const pauseBtn =
      document.getElementById(
        "emomPauseBtn"
      );


    timer?.classList.remove(
      "phase-work",
      "phase-rest"
    );

    timer?.classList.add(
      "phase-paused"
    );


    if (phase) {

      phase.textContent =
        "PAUSED";

    }


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



  function finishEmom() {

    clearTimer();


    if (
      !emomState ||
      emomState.completed
    ) {
      return;
    }


    emomState.running =
      false;

    emomState.completed =
      true;


    const timer =
      document.querySelector(
        ".trainingwise-timer"
      );

    const phase =
      document.getElementById(
        "emomPhase"
      );

    const message =
      document.getElementById(
        "emomMessage"
      );


    timer?.classList.remove(
      "phase-work",
      "phase-rest",
      "phase-paused"
    );

    timer?.classList.add(
      "phase-complete"
    );


    if (phase) {

      phase.textContent =
        "COMPLETE";

    }


    if (message) {

      message.textContent =
        "Session complete.";

    }


    document
      .getElementById(
        "emomStartBtn"
      )
      ?.setAttribute(
        "disabled",
        ""
      );


    document
      .getElementById(
        "emomPauseBtn"
      )
      ?.setAttribute(
        "disabled",
        ""
      );


    window.FuelAILog
      ?.addFuelLog?.({

        type:
          "training",

        sessions:
          1,

        source:
          "trainingwise",

        trainingType:
          "emom",

        preset:
          "10-minute",

        rounds:
          emomState.sessionRounds,

        minutesPerRound:
          emomState.minutesPerRound,

        roundRestSeconds:
          emomState.roundRestSeconds,

        durationSeconds:
          (
            emomState.minutesPerRound *
            60 *
            emomState.sessionRounds
          ) +
          (
            emomState.roundRestSeconds *
            Math.max(
              0,
              emomState.sessionRounds - 1
            )
          ),

        completed:
          true

      });

  }



  function stopEmom() {

    clearTimer();

    renderEmom();

  }



  function setEmomSessionRounds(
    rounds
  ) {

    if (
      !emomState ||
      emomState.running
    ) {
      return;
    }


    const selected =
      Number(
        rounds
      );


    if (
      ![2, 3, 4]
        .includes(
          selected
        )
    ) {
      return;
    }


    emomState.sessionRounds =
      selected;

    emomState.currentSessionRound =
      1;

    emomState.currentMinute =
      1;

    emomState.inRoundRest =
      false;

    emomState.remaining =
      60;


    document
      .querySelectorAll(
        "[data-emom-rounds]"
      )
      .forEach(
        (button) => {

          button.classList.toggle(
            "active",
            Number(
              button.dataset
                .emomRounds
            ) === selected
          );

        }
      );


    const duration =
      document.getElementById(
        "emomDuration"
      );


    if (duration) {

      const totalSeconds =
        (
          selected *
          emomState.minutesPerRound *
          60
        ) +
        (
          Math.max(
            0,
            selected - 1
          ) *
          emomState.roundRestSeconds
        );


      duration.textContent =
        `Total: ${
          formatSessionTime(
            totalSeconds
          )
        }`;

    }


    updateEmomDisplay();

  }



  function wireEmomControls() {

    document
      .querySelectorAll(
        "[data-emom-rounds]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              setEmomSessionRounds(
                button.dataset
                  .emomRounds
              );

            }
          );

        }
      );


    document
      .getElementById(
        "emomStartBtn"
      )
      ?.addEventListener(
        "click",
        startEmom
      );


    document
      .getElementById(
        "emomPauseBtn"
      )
      ?.addEventListener(
        "click",
        pauseEmom
      );


    document
      .getElementById(
        "emomStopBtn"
      )
      ?.addEventListener(
        "click",
        stopEmom
      );

  }



  /* =========================
     CURATED CONDITIONING
  ========================= */

  const conditioningLibrary = {

    beginner: {

      15: {

        title:
          "Foundation Circuit",

        warmup: [
          "Easy march — 2 min",
          "Arm circles — 1 min",
          "Bodyweight squats — 1 min"
        ],

        main: [
          "Air Squats — 10 reps",
          "Wall Push-Ups — 8 reps",
          "Reverse Lunges — 8 total",
          "Standing Knee Drives — 10 total"
        ],

        mainMinutes:
          8,

        cooldown: [
          "Easy walk — 2 min",
          "Light stretch — 1 min"
        ]

      },


      30: {

        title:
          "Foundation Builder",

        warmup: [
          "Easy march — 3 min",
          "Arm circles — 1 min",
          "Bodyweight squats — 1 min"
        ],

        main: [
          "Air Squats — 12 reps",
          "Incline Push-Ups — 10 reps",
          "Reverse Lunges — 10 total",
          "Standing Knee Drives — 12 total",
          "Dead Bug — 8 per side"
        ],

        mainMinutes:
          20,

        cooldown: [
          "Easy walk — 3 min",
          "Light mobility — 2 min"
        ]

      },


      45: {

        title:
          "Foundation Endurance",

        warmup: [
          "Easy march — 4 min",
          "Dynamic mobility — 3 min"
        ],

        main: [
          "Air Squats — 12 reps",
          "Incline Push-Ups — 10 reps",
          "Reverse Lunges — 12 total",
          "Standing Knee Drives — 16 total",
          "Glute Bridge — 12 reps",
          "Dead Bug — 8 per side"
        ],

        mainMinutes:
          30,

        cooldown: [
          "Easy walk — 4 min",
          "Light mobility — 4 min"
        ]

      }

    },


    intermediate: {

      15: {

        title:
          "Quick Conditioning",

        warmup: [
          "Light jog or march — 2 min",
          "Dynamic mobility — 2 min"
        ],

        main: [
          "Air Squats — 15 reps",
          "Push-Ups — 10 reps",
          "Mountain Climbers — 20 total",
          "Reverse Lunges — 12 total",
          "Plank — 30 sec"
        ],

        mainMinutes:
          8,

        cooldown: [
          "Easy walk — 2 min",
          "Reset breathing — 1 min"
        ]

      },


      30: {

        title:
          "Full-Body Conditioning",

        warmup: [
          "Light jog or march — 3 min",
          "Dynamic mobility — 2 min"
        ],

        main: [
          "Air Squats — 15 reps",
          "Push-Ups — 12 reps",
          "Mountain Climbers — 24 total",
          "Reverse Lunges — 16 total",
          "Plank — 40 sec"
        ],

        mainMinutes:
          20,

        cooldown: [
          "Easy walk — 3 min",
          "Mobility and breathing — 2 min"
        ]

      },


      45: {

        title:
          "Conditioning Builder",

        warmup: [
          "Light movement — 4 min",
          "Dynamic mobility — 3 min"
        ],

        main: [
          "Air Squats — 18 reps",
          "Push-Ups — 12 reps",
          "Mountain Climbers — 30 total",
          "Reverse Lunges — 20 total",
          "Glute Bridge — 15 reps",
          "Plank — 45 sec"
        ],

        mainMinutes:
          30,

        cooldown: [
          "Easy walk — 4 min",
          "Mobility and breathing — 4 min"
        ]

      }

    },


    advanced: {

      15: {

        title:
          "Fast Conditioning",

        warmup: [
          "Light jog — 2 min",
          "Dynamic mobility — 2 min"
        ],

        main: [
          "Squat Jumps — 10 reps",
          "Push-Ups — 15 reps",
          "Mountain Climbers — 30 total",
          "Alternating Lunges — 16 total",
          "Plank Shoulder Taps — 20 total"
        ],

        mainMinutes:
          8,

        cooldown: [
          "Easy walk — 2 min",
          "Reset breathing — 1 min"
        ]

      },


      30: {

        title:
          "Work Capacity",

        warmup: [
          "Light jog — 3 min",
          "Dynamic mobility — 2 min"
        ],

        main: [
          "Squat Jumps — 12 reps",
          "Push-Ups — 15 reps",
          "Mountain Climbers — 40 total",
          "Alternating Lunges — 20 total",
          "Plank Shoulder Taps — 24 total"
        ],

        mainMinutes:
          20,

        cooldown: [
          "Easy walk — 3 min",
          "Mobility and breathing — 2 min"
        ]

      },


      45: {

        title:
          "Extended Work Capacity",

        warmup: [
          "Light jog — 4 min",
          "Dynamic mobility — 3 min"
        ],

        main: [
          "Squat Jumps — 15 reps",
          "Push-Ups — 18 reps",
          "Mountain Climbers — 50 total",
          "Alternating Lunges — 24 total",
          "Burpees — 8 reps",
          "Plank Shoulder Taps — 30 total"
        ],

        mainMinutes:
          30,

        cooldown: [
          "Easy walk — 4 min",
          "Mobility and breathing — 4 min"
        ]

      }

    }

  };



  function getConditioningWorkout(
    level,
    duration
  ) {

    return (
      conditioningLibrary
        ?.[level]
        ?.[duration] ||
      null
    );

  }



  function renderWorkoutList(
    items
  ) {

    return items
      .map(
        (item) =>
          `<li>${item}</li>`
      )
      .join("");

  }



  /* =========================
     SELF-GUIDED
  ========================= */

  function getSelfGuidedTitle(
    mode
  ) {

    const titles = {

      conditioning:
        "Conditioning",

      strength:
        "Strength",

      recovery:
        "Recovery / Movement"

    };


    return (
      titles[mode] ||
      "Self-Guided Workout"
    );

  }



  const strengthLibrary = {

    "full-body": {

      20: {
        title:
          "Full Body Express",

        warmup: [
          "Easy movement — 2 min",
          "Dynamic mobility — 2 min"
        ],

        main: [
          {
            name: "Bodyweight Squat",
            sets: 3,
            reps: 10
          },
          {
            name: "Push-Ups",
            sets: 3,
            reps: 8
          },
          {
            name: "Glute Bridge",
            sets: 3,
            reps: 12
          },
          {
            name: "Dead Bug",
            sets: 2,
            reps: 8
          }
        ],

        cooldown: [
          "Easy walk — 2 min",
          "Light mobility — 2 min"
        ]
      },


      45: {
        title:
          "Full Body Builder",

        warmup: [
          "Easy movement — 3 min",
          "Dynamic mobility — 4 min"
        ],

        main: [
          {
            name: "Bodyweight Squat",
            sets: 4,
            reps: 10
          },
          {
            name: "Push-Ups",
            sets: 4,
            reps: 10
          },
          {
            name: "Reverse Lunges",
            sets: 3,
            reps: 10
          },
          {
            name: "Glute Bridge",
            sets: 3,
            reps: 15
          },
          {
            name: "Pike Push-Ups",
            sets: 3,
            reps: 8
          },
          {
            name: "Dead Bug",
            sets: 3,
            reps: 10
          }
        ],

        cooldown: [
          "Easy walk — 3 min",
          "Full-body mobility — 3 min"
        ]
      },


      60: {
        title:
          "Full Body Strength",

        warmup: [
          "Easy movement — 4 min",
          "Dynamic mobility — 5 min"
        ],

        main: [
          {
            name: "Bodyweight Squat",
            sets: 4,
            reps: 12
          },
          {
            name: "Push-Ups",
            sets: 4,
            reps: 12
          },
          {
            name: "Reverse Lunges",
            sets: 4,
            reps: 10
          },
          {
            name: "Glute Bridge",
            sets: 4,
            reps: 15
          },
          {
            name: "Pike Push-Ups",
            sets: 3,
            reps: 10
          },
          {
            name: "Calf Raises",
            sets: 3,
            reps: 15
          },
          {
            name: "Dead Bug",
            sets: 3,
            reps: 12
          }
        ],

        cooldown: [
          "Easy walk — 4 min",
          "Full-body mobility — 4 min"
        ]
      }

    },


    "upper-body": {

      20: {
        title:
          "Upper Body Express",

        warmup: [
          "Arm circles — 2 min",
          "Shoulder mobility — 2 min"
        ],

        main: [
          {
            name: "Push-Ups",
            sets: 3,
            reps: 8
          },
          {
            name: "Pike Push-Ups",
            sets: 3,
            reps: 6
          },
          {
            name: "Incline Push-Ups",
            sets: 2,
            reps: 10
          },
          {
            name: "Plank Shoulder Taps",
            sets: 2,
            reps: 16
          }
        ],

        cooldown: [
          "Shoulder mobility — 2 min",
          "Easy breathing — 2 min"
        ]
      },


      45: {
        title:
          "Upper Body Builder",

        warmup: [
          "Easy movement — 2 min",
          "Shoulder mobility — 4 min"
        ],

        main: [
          {
            name: "Push-Ups",
            sets: 4,
            reps: 10
          },
          {
            name: "Pike Push-Ups",
            sets: 3,
            reps: 8
          },
          {
            name: "Close-Grip Push-Ups",
            sets: 3,
            reps: 8
          },
          {
            name: "Incline Push-Ups",
            sets: 3,
            reps: 12
          },
          {
            name: "Plank Shoulder Taps",
            sets: 3,
            reps: 20
          }
        ],

        cooldown: [
          "Shoulder mobility — 3 min",
          "Upper-body stretch — 3 min"
        ]
      },


      60: {
        title:
          "Upper Body Strength",

        warmup: [
          "Easy movement — 3 min",
          "Shoulder mobility — 5 min"
        ],

        main: [
          {
            name: "Push-Ups",
            sets: 5,
            reps: 10
          },
          {
            name: "Pike Push-Ups",
            sets: 4,
            reps: 8
          },
          {
            name: "Close-Grip Push-Ups",
            sets: 4,
            reps: 8
          },
          {
            name: "Incline Push-Ups",
            sets: 3,
            reps: 12
          },
          {
            name: "Plank Shoulder Taps",
            sets: 4,
            reps: 20
          },
          {
            name: "Forearm Plank",
            sets: 3,
            reps: 45
          }
        ],

        cooldown: [
          "Shoulder mobility — 4 min",
          "Upper-body stretch — 4 min"
        ]
      }

    },


    "lower-body": {

      20: {
        title:
          "Lower Body Express",

        warmup: [
          "Easy march — 2 min",
          "Hip mobility — 2 min"
        ],

        main: [
          {
            name: "Bodyweight Squat",
            sets: 3,
            reps: 12
          },
          {
            name: "Reverse Lunges",
            sets: 3,
            reps: 8
          },
          {
            name: "Glute Bridge",
            sets: 3,
            reps: 12
          },
          {
            name: "Calf Raises",
            sets: 2,
            reps: 15
          }
        ],

        cooldown: [
          "Easy walk — 2 min",
          "Hip mobility — 2 min"
        ]
      },


      45: {
        title:
          "Lower Body Builder",

        warmup: [
          "Easy movement — 3 min",
          "Hip and ankle mobility — 4 min"
        ],

        main: [
          {
            name: "Bodyweight Squat",
            sets: 4,
            reps: 12
          },
          {
            name: "Reverse Lunges",
            sets: 4,
            reps: 10
          },
          {
            name: "Split Squat",
            sets: 3,
            reps: 8
          },
          {
            name: "Glute Bridge",
            sets: 4,
            reps: 15
          },
          {
            name: "Calf Raises",
            sets: 3,
            reps: 18
          }
        ],

        cooldown: [
          "Easy walk — 3 min",
          "Lower-body mobility — 3 min"
        ]
      },


      60: {
        title:
          "Lower Body Strength",

        warmup: [
          "Easy movement — 4 min",
          "Hip and ankle mobility — 5 min"
        ],

        main: [
          {
            name: "Bodyweight Squat",
            sets: 5,
            reps: 12
          },
          {
            name: "Reverse Lunges",
            sets: 4,
            reps: 10
          },
          {
            name: "Split Squat",
            sets: 4,
            reps: 10
          },
          {
            name: "Single-Leg Glute Bridge",
            sets: 3,
            reps: 10
          },
          {
            name: "Glute Bridge",
            sets: 3,
            reps: 15
          },
          {
            name: "Calf Raises",
            sets: 4,
            reps: 20
          }
        ],

        cooldown: [
          "Easy walk — 4 min",
          "Lower-body mobility — 4 min"
        ]
      }

    },


    core: {

      20: {
        title:
          "Core Express",

        warmup: [
          "Easy movement — 2 min",
          "Trunk mobility — 2 min"
        ],

        main: [
          {
            name: "Dead Bug",
            sets: 3,
            reps: 8
          },
          {
            name: "Bird Dog",
            sets: 3,
            reps: 8
          },
          {
            name: "Plank",
            sets: 3,
            reps: 30
          },
          {
            name: "Side Plank",
            sets: 2,
            reps: 20
          }
        ],

        cooldown: [
          "Easy breathing — 2 min",
          "Trunk mobility — 2 min"
        ]
      },


      45: {
        title:
          "Core Builder",

        warmup: [
          "Easy movement — 3 min",
          "Trunk mobility — 3 min"
        ],

        main: [
          {
            name: "Dead Bug",
            sets: 4,
            reps: 10
          },
          {
            name: "Bird Dog",
            sets: 4,
            reps: 10
          },
          {
            name: "Plank",
            sets: 4,
            reps: 40
          },
          {
            name: "Side Plank",
            sets: 3,
            reps: 30
          },
          {
            name: "Glute Bridge",
            sets: 3,
            reps: 15
          }
        ],

        cooldown: [
          "Easy breathing — 3 min",
          "Trunk mobility — 3 min"
        ]
      },


      60: {
        title:
          "Core Strength",

        warmup: [
          "Easy movement — 4 min",
          "Trunk mobility — 4 min"
        ],

        main: [
          {
            name: "Dead Bug",
            sets: 4,
            reps: 12
          },
          {
            name: "Bird Dog",
            sets: 4,
            reps: 12
          },
          {
            name: "Plank",
            sets: 4,
            reps: 45
          },
          {
            name: "Side Plank",
            sets: 4,
            reps: 30
          },
          {
            name: "Plank Shoulder Taps",
            sets: 4,
            reps: 20
          },
          {
            name: "Glute Bridge",
            sets: 4,
            reps: 15
          }
        ],

        cooldown: [
          "Easy breathing — 4 min",
          "Trunk mobility — 4 min"
        ]
      }

    }

  };



  function getStrengthTier(
    duration
  ) {

    if (
      duration <= 30
    ) {
      return 20;
    }


    if (
      duration <= 52
    ) {
      return 45;
    }


    return 60;

  }



  function getStrengthWorkout(
    focus,
    duration
  ) {

    const tier =
      getStrengthTier(
        duration
      );


    const base =
      strengthLibrary
        ?.[focus]
        ?.[tier];


    if (!base) {
      return null;
    }


    return {

      ...base,

      focus,

      duration,

      main:
        base.main.map(
          (exercise) => ({
            ...exercise
          })
        )

    };

  }



  function getStrengthFocusLabel(
    focus
  ) {

    const labels = {

      "full-body":
        "Full Body",

      "upper-body":
        "Upper Body",

      "lower-body":
        "Lower Body",

      core:
        "Core"

    };


    return (
      labels[focus] ||
      "Strength"
    );

  }



  function renderStrengthExerciseEditor(
    workout
  ) {

    return workout.main
      .map(
        (exercise, index) => `
          <div
            class="trainingwise-strength-exercise"
            data-strength-exercise="${index}"
          >

            <strong>
              ${exercise.name}
            </strong>

            <div class="trainingwise-strength-fields">

              <label>
                Sets

                <input
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value="${exercise.sets}"
                  data-strength-sets="${index}"
                />
              </label>


              <label>
                Reps

                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value="${exercise.reps}"
                  data-strength-reps="${index}"
                />
              </label>

            </div>

          </div>
        `
      )
      .join("");

  }



  function readStrengthExercises(
    workout
  ) {

    return workout.main
      .map(
        (exercise, index) => {

          const sets =
            Number(
              document
                .querySelector(
                  `[data-strength-sets="${index}"]`
                )
                ?.value
            );


          const reps =
            Number(
              document
                .querySelector(
                  `[data-strength-reps="${index}"]`
                )
                ?.value
            );


          return {

            name:
              exercise.name,

            sets:
              Number.isFinite(sets) &&
              sets >= 1
                ? Math.min(
                    10,
                    Math.round(sets)
                  )
                : exercise.sets,

            reps:
              Number.isFinite(reps) &&
              reps >= 1
                ? Math.min(
                    100,
                    Math.round(reps)
                  )
                : exercise.reps

          };

        }
      );

  }



  function renderStrengthSetup() {

    clearTimer();


    output.innerHTML = `
      <p class="trainingwise-label">
        SELF-GUIDED WORKOUT
      </p>

      <h2>
        Strength
      </h2>

      <p>
        What do you want to train?
      </p>


      <div class="trainingwise-setup-block">

        <span class="trainingwise-label">
          TRAINING FOCUS
        </span>

        <div class="trainingwise-choice-grid">

          <button
            type="button"
            data-strength-focus="full-body"
            class="active"
          >
            Full Body
          </button>

          <button
            type="button"
            data-strength-focus="upper-body"
          >
            Upper Body
          </button>

          <button
            type="button"
            data-strength-focus="lower-body"
          >
            Lower Body
          </button>

          <button
            type="button"
            data-strength-focus="core"
          >
            Core
          </button>

        </div>

      </div>


      <div class="trainingwise-setup-block">

        <span class="trainingwise-label">
          HOW LONG?
        </span>

        <div class="trainingwise-choice-grid">

          <button
            type="button"
            data-strength-duration="20"
            class="active"
          >
            20 min
          </button>

          <button
            type="button"
            data-strength-duration="45"
          >
            45 min
          </button>

          <button
            type="button"
            data-strength-duration="60"
          >
            60 min
          </button>

          <button
            type="button"
            data-strength-duration="custom"
          >
            Custom
          </button>

        </div>

      </div>


      <div
        id="strengthCustomTimeWrap"
        class="trainingwise-setup-block hidden"
      >

        <span class="trainingwise-label">
          CUSTOM TIME
        </span>

        <input
          id="strengthCustomTime"
          type="number"
          min="5"
          max="180"
          step="5"
          value="30"
          inputmode="numeric"
          aria-label="Custom workout time in minutes"
        />

      </div>


      <button
        id="generateStrengthWorkoutBtn"
        class="trainingwise-btn trainingwise-generate-btn"
        type="button"
      >
        Continue →
      </button>


      <div
        id="generatedWorkoutPreview"
        class="trainingwise-workout-preview hidden"
      ></div>
    `;


    wireStrengthSetup();

  }



  function wireStrengthSetup() {

    let selectedFocus =
      "full-body";

    let selectedDuration =
      20;


    document
      .querySelectorAll(
        "[data-strength-focus]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              selectedFocus =
                button.dataset
                  .strengthFocus;


              document
                .querySelectorAll(
                  "[data-strength-focus]"
                )
                .forEach(
                  (item) => {

                    item.classList.toggle(
                      "active",
                      item === button
                    );

                  }
                );

            }
          );

        }
      );


    document
      .querySelectorAll(
        "[data-strength-duration]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              const value =
                button.dataset
                  .strengthDuration;


              selectedDuration =
                value === "custom"
                  ? "custom"
                  : Number(value);


              document
                .querySelectorAll(
                  "[data-strength-duration]"
                )
                .forEach(
                  (item) => {

                    item.classList.toggle(
                      "active",
                      item === button
                    );

                  }
                );


              document
                .getElementById(
                  "strengthCustomTimeWrap"
                )
                ?.classList.toggle(
                  "hidden",
                  value !== "custom"
                );

            }
          );

        }
      );


    document
      .getElementById(
        "generateStrengthWorkoutBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          let duration =
            selectedDuration;


          if (
            selectedDuration ===
            "custom"
          ) {

            const input =
              document.getElementById(
                "strengthCustomTime"
              );

            duration =
              Number(
                input?.value
              );


            if (
              !Number.isFinite(duration) ||
              duration < 5 ||
              duration > 180
            ) {

              return;

            }

          }


          const workout =
            getStrengthWorkout(
              selectedFocus,
              duration
            );


          const preview =
            document.getElementById(
              "generatedWorkoutPreview"
            );


          if (
            !preview ||
            !workout
          ) {
            return;
          }


          preview.classList.remove(
            "hidden"
          );


          preview.innerHTML = `
            <p class="trainingwise-label">
              STRENGTH WORKOUT
            </p>

            <h3>
              ${workout.title}
            </h3>

            <p>
              ${getStrengthFocusLabel(
                selectedFocus
              )}
              ·
              ${duration} minutes
            </p>


            <div class="trainingwise-workout-section">

              <strong>
                Warm-Up
              </strong>

              <ul>
                ${renderWorkoutList(
                  workout.warmup
                )}
              </ul>

            </div>


            <div class="trainingwise-workout-section">

              <strong>
                Strength Work
              </strong>

              <p>
                Recommended sets and reps
                are provided below.
                Adjust them before starting
                if needed.
              </p>

              <div
                class="trainingwise-strength-editor"
              >
                ${renderStrengthExerciseEditor(
                  workout
                )}
              </div>

            </div>


            <div class="trainingwise-workout-section">

              <strong>
                Cool Down
              </strong>

              <ul>
                ${renderWorkoutList(
                  workout.cooldown
                )}
              </ul>

            </div>


            <button
              id="startStrengthWorkoutBtn"
              class="trainingwise-btn"
              type="button"
            >
              Start Workout →
            </button>
          `;


          document
            .getElementById(
              "startStrengthWorkoutBtn"
            )
            ?.addEventListener(
              "click",
              () => {

                const exercises =
                  readStrengthExercises(
                    workout
                  );


                const configuredWorkout = {

                  ...workout,

                  focus:
                    selectedFocus,

                  main:
                    exercises

                };


                renderSelfGuidedExecution(
                  "strength",
                  configuredWorkout,
                  duration,
                  null
                );

              }
            );

        }
      );

  }



  const recoveryLibrary = {

    "full-body": {

      10: {
        title:
          "Full Body Reset",

        moves: [
          {
            name: "Easy Walk / March",
            seconds: 120
          },
          {
            name: "Arm Circles",
            seconds: 60
          },
          {
            name: "Hip Circles",
            seconds: 60
          },
          {
            name: "Bodyweight Squat Flow",
            seconds: 90
          },
          {
            name: "Cat-Cow",
            seconds: 90
          },
          {
            name: "Easy Breathing",
            seconds: 180
          }
        ]
      },


      20: {
        title:
          "Full Body Restore",

        moves: [
          {
            name: "Easy Walk / March",
            seconds: 180
          },
          {
            name: "Shoulder Mobility",
            seconds: 120
          },
          {
            name: "Hip Circles",
            seconds: 120
          },
          {
            name: "Squat-to-Stand",
            seconds: 120
          },
          {
            name: "Reverse Lunge Reach",
            seconds: 120
          },
          {
            name: "Cat-Cow",
            seconds: 120
          },
          {
            name: "Bird Dog",
            seconds: 120
          },
          {
            name: "Glute Bridge",
            seconds: 120
          },
          {
            name: "Easy Breathing",
            seconds: 180
          }
        ]
      },


      30: {
        title:
          "Full Body Mobility",

        moves: [
          {
            name: "Easy Walk / March",
            seconds: 240
          },
          {
            name: "Shoulder Mobility",
            seconds: 150
          },
          {
            name: "Thoracic Rotation",
            seconds: 150
          },
          {
            name: "Hip Circles",
            seconds: 150
          },
          {
            name: "Squat-to-Stand",
            seconds: 150
          },
          {
            name: "Reverse Lunge Reach",
            seconds: 150
          },
          {
            name: "Cat-Cow",
            seconds: 150
          },
          {
            name: "Bird Dog",
            seconds: 150
          },
          {
            name: "Glute Bridge",
            seconds: 150
          },
          {
            name: "Calf / Ankle Mobility",
            seconds: 150
          },
          {
            name: "Easy Breathing",
            seconds: 210
          }
        ]
      }

    },


    "upper-body": {

      10: {
        title:
          "Upper Body Reset",

        moves: [
          {
            name: "Easy Arm Swing",
            seconds: 90
          },
          {
            name: "Arm Circles",
            seconds: 90
          },
          {
            name: "Shoulder Rolls",
            seconds: 90
          },
          {
            name: "Wall Slides",
            seconds: 120
          },
          {
            name: "Thoracic Rotation",
            seconds: 120
          },
          {
            name: "Easy Breathing",
            seconds: 90
          }
        ]
      },


      20: {
        title:
          "Upper Body Restore",

        moves: [
          {
            name: "Easy Arm Swing",
            seconds: 120
          },
          {
            name: "Arm Circles",
            seconds: 120
          },
          {
            name: "Shoulder Rolls",
            seconds: 120
          },
          {
            name: "Wall Slides",
            seconds: 150
          },
          {
            name: "Thoracic Rotation",
            seconds: 150
          },
          {
            name: "Scapular Push-Up",
            seconds: 120
          },
          {
            name: "Chest / Shoulder Mobility",
            seconds: 150
          },
          {
            name: "Easy Breathing",
            seconds: 150
          }
        ]
      },


      30: {
        title:
          "Upper Body Mobility",

        moves: [
          {
            name: "Easy Arm Swing",
            seconds: 180
          },
          {
            name: "Arm Circles",
            seconds: 150
          },
          {
            name: "Shoulder Rolls",
            seconds: 150
          },
          {
            name: "Wall Slides",
            seconds: 180
          },
          {
            name: "Thoracic Rotation",
            seconds: 180
          },
          {
            name: "Scapular Push-Up",
            seconds: 150
          },
          {
            name: "Chest / Shoulder Mobility",
            seconds: 180
          },
          {
            name: "Upper Back Rotation",
            seconds: 180
          },
          {
            name: "Easy Breathing",
            seconds: 210
          }
        ]
      }

    },


    "lower-body": {

      10: {
        title:
          "Lower Body Reset",

        moves: [
          {
            name: "Easy Walk / March",
            seconds: 120
          },
          {
            name: "Hip Circles",
            seconds: 90
          },
          {
            name: "Ankle Rocks",
            seconds: 90
          },
          {
            name: "Squat-to-Stand",
            seconds: 120
          },
          {
            name: "Glute Bridge",
            seconds: 120
          },
          {
            name: "Easy Breathing",
            seconds: 60
          }
        ]
      },


      20: {
        title:
          "Lower Body Restore",

        moves: [
          {
            name: "Easy Walk / March",
            seconds: 180
          },
          {
            name: "Hip Circles",
            seconds: 120
          },
          {
            name: "Ankle Rocks",
            seconds: 120
          },
          {
            name: "Squat-to-Stand",
            seconds: 150
          },
          {
            name: "Reverse Lunge Reach",
            seconds: 150
          },
          {
            name: "Glute Bridge",
            seconds: 150
          },
          {
            name: "Calf Mobility",
            seconds: 120
          },
          {
            name: "Easy Breathing",
            seconds: 120
          }
        ]
      },


      30: {
        title:
          "Lower Body Mobility",

        moves: [
          {
            name: "Easy Walk / March",
            seconds: 240
          },
          {
            name: "Hip Circles",
            seconds: 150
          },
          {
            name: "Ankle Rocks",
            seconds: 150
          },
          {
            name: "Squat-to-Stand",
            seconds: 180
          },
          {
            name: "Reverse Lunge Reach",
            seconds: 180
          },
          {
            name: "Glute Bridge",
            seconds: 180
          },
          {
            name: "Adductor Rock Back",
            seconds: 150
          },
          {
            name: "Calf Mobility",
            seconds: 150
          },
          {
            name: "Easy Breathing",
            seconds: 210
          }
        ]
      }

    },


    "hips-back": {

      10: {
        title:
          "Hips & Back Reset",

        moves: [
          {
            name: "Pelvic Tilt",
            seconds: 90
          },
          {
            name: "Cat-Cow",
            seconds: 120
          },
          {
            name: "Hip Circles",
            seconds: 90
          },
          {
            name: "Bird Dog",
            seconds: 120
          },
          {
            name: "Glute Bridge",
            seconds: 120
          },
          {
            name: "Easy Breathing",
            seconds: 60
          }
        ]
      },


      20: {
        title:
          "Hips & Back Restore",

        moves: [
          {
            name: "Pelvic Tilt",
            seconds: 120
          },
          {
            name: "Cat-Cow",
            seconds: 150
          },
          {
            name: "Hip Circles",
            seconds: 120
          },
          {
            name: "Thoracic Rotation",
            seconds: 150
          },
          {
            name: "Bird Dog",
            seconds: 150
          },
          {
            name: "Glute Bridge",
            seconds: 150
          },
          {
            name: "Adductor Rock Back",
            seconds: 120
          },
          {
            name: "Easy Breathing",
            seconds: 120
          }
        ]
      },


      30: {
        title:
          "Hips & Back Mobility",

        moves: [
          {
            name: "Pelvic Tilt",
            seconds: 150
          },
          {
            name: "Cat-Cow",
            seconds: 180
          },
          {
            name: "Hip Circles",
            seconds: 150
          },
          {
            name: "Thoracic Rotation",
            seconds: 180
          },
          {
            name: "Bird Dog",
            seconds: 180
          },
          {
            name: "Glute Bridge",
            seconds: 180
          },
          {
            name: "Adductor Rock Back",
            seconds: 150
          },
          {
            name: "Hip Flexor Mobility",
            seconds: 180
          },
          {
            name: "Easy Breathing",
            seconds: 210
          }
        ]
      }

    }

  };



  function getRecoveryTier(
    duration
  ) {

    if (
      duration <= 15
    ) {
      return 10;
    }


    if (
      duration <= 25
    ) {
      return 20;
    }


    return 30;

  }



  function getRecoveryWorkout(
    focus,
    duration
  ) {

    const tier =
      getRecoveryTier(
        duration
      );


    const base =
      recoveryLibrary
        ?.[focus]
        ?.[tier];


    if (!base) {
      return null;
    }


    return {

      ...base,

      focus,

      duration,

      moves:
        base.moves.map(
          (move) => ({
            ...move
          })
        )

    };

  }



  function getRecoveryFocusLabel(
    focus
  ) {

    const labels = {

      "full-body":
        "Full Body",

      "upper-body":
        "Upper Body",

      "lower-body":
        "Lower Body",

      "hips-back":
        "Hips / Back"

    };


    return (
      labels[focus] ||
      "Recovery / Movement"
    );

  }



  function renderRecoveryMoveList(
    moves
  ) {

    return moves
      .map(
        (move, index) => `
          <div class="trainingwise-recovery-move">

            <span class="trainingwise-recovery-number">
              ${index + 1}
            </span>

            <div>
              <strong>
                ${move.name}
              </strong>

              <p>
                ${formatSessionTime(
                  move.seconds
                )}
              </p>
            </div>

          </div>
        `
      )
      .join("");

  }



  function renderRecoverySetup() {

    clearTimer();


    output.innerHTML = `
      <p class="trainingwise-label">
        SELF-GUIDED WORKOUT
      </p>

      <h2>
        Recovery / Movement
      </h2>

      <p>
        What needs attention today?
      </p>


      <div class="trainingwise-setup-block">

        <span class="trainingwise-label">
          RECOVERY FOCUS
        </span>

        <div class="trainingwise-choice-grid">

          <button
            type="button"
            data-recovery-focus="full-body"
            class="active"
          >
            Full Body
          </button>

          <button
            type="button"
            data-recovery-focus="upper-body"
          >
            Upper Body
          </button>

          <button
            type="button"
            data-recovery-focus="lower-body"
          >
            Lower Body
          </button>

          <button
            type="button"
            data-recovery-focus="hips-back"
          >
            Hips / Back
          </button>

        </div>

      </div>


      <div class="trainingwise-setup-block">

        <span class="trainingwise-label">
          HOW LONG?
        </span>

        <div class="trainingwise-choice-grid">

          <button
            type="button"
            data-recovery-duration="10"
            class="active"
          >
            10 min
          </button>

          <button
            type="button"
            data-recovery-duration="20"
          >
            20 min
          </button>

          <button
            type="button"
            data-recovery-duration="30"
          >
            30 min
          </button>

          <button
            type="button"
            data-recovery-duration="custom"
          >
            Custom
          </button>

        </div>

      </div>


      <div
        id="recoveryCustomTimeWrap"
        class="trainingwise-setup-block hidden"
      >

        <span class="trainingwise-label">
          CUSTOM TIME
        </span>

        <input
          id="recoveryCustomTime"
          type="number"
          min="5"
          max="90"
          step="5"
          value="15"
          inputmode="numeric"
          aria-label="Custom recovery time in minutes"
        />

      </div>


      <button
        id="generateRecoveryWorkoutBtn"
        class="trainingwise-btn trainingwise-generate-btn"
        type="button"
      >
        Continue →
      </button>


      <div
        id="generatedWorkoutPreview"
        class="trainingwise-workout-preview hidden"
      ></div>
    `;


    wireRecoverySetup();

  }



  function wireRecoverySetup() {

    let selectedFocus =
      "full-body";

    let selectedDuration =
      10;


    document
      .querySelectorAll(
        "[data-recovery-focus]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              selectedFocus =
                button.dataset
                  .recoveryFocus;


              document
                .querySelectorAll(
                  "[data-recovery-focus]"
                )
                .forEach(
                  (item) => {

                    item.classList.toggle(
                      "active",
                      item === button
                    );

                  }
                );

            }
          );

        }
      );


    document
      .querySelectorAll(
        "[data-recovery-duration]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              const value =
                button.dataset
                  .recoveryDuration;


              selectedDuration =
                value === "custom"
                  ? "custom"
                  : Number(value);


              document
                .querySelectorAll(
                  "[data-recovery-duration]"
                )
                .forEach(
                  (item) => {

                    item.classList.toggle(
                      "active",
                      item === button
                    );

                  }
                );


              document
                .getElementById(
                  "recoveryCustomTimeWrap"
                )
                ?.classList.toggle(
                  "hidden",
                  value !== "custom"
                );

            }
          );

        }
      );


    document
      .getElementById(
        "generateRecoveryWorkoutBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          let duration =
            selectedDuration;


          if (
            selectedDuration ===
            "custom"
          ) {

            duration =
              Number(
                document
                  .getElementById(
                    "recoveryCustomTime"
                  )
                  ?.value
              );


            if (
              !Number.isFinite(duration) ||
              duration < 5 ||
              duration > 90
            ) {
              return;
            }

          }


          const workout =
            getRecoveryWorkout(
              selectedFocus,
              duration
            );


          const preview =
            document.getElementById(
              "generatedWorkoutPreview"
            );


          if (
            !preview ||
            !workout
          ) {
            return;
          }


          preview.classList.remove(
            "hidden"
          );


          preview.innerHTML = `
            <p class="trainingwise-label">
              RECOVERY / MOVEMENT
            </p>

            <h3>
              ${workout.title}
            </h3>

            <p>
              ${getRecoveryFocusLabel(
                selectedFocus
              )}
              ·
              ${duration} minutes
            </p>


            <div class="trainingwise-workout-section">

              <strong>
                Movement Sequence
              </strong>

              <p>
                Move comfortably.
                Recovery work should
                feel controlled,
                not forced.
              </p>

              <div class="trainingwise-recovery-list">

                ${renderRecoveryMoveList(
                  workout.moves
                )}

              </div>

            </div>


            <button
              id="startRecoveryWorkoutBtn"
              class="trainingwise-btn"
              type="button"
            >
              Start Recovery →
            </button>
          `;


          document
            .getElementById(
              "startRecoveryWorkoutBtn"
            )
            ?.addEventListener(
              "click",
              () => {

                renderRecoveryExecution(
                  workout
                );

              }
            );

        }
      );

  }



  function renderSelfGuidedSetup(
    mode
  ) {

    clearTimer();


    if (
      mode === "strength"
    ) {

      renderStrengthSetup();

      return;

    }


    if (
      mode === "recovery"
    ) {

      renderRecoverySetup();

      return;

    }


    const title =
      getSelfGuidedTitle(
        mode
      );


    output.innerHTML = `
      <p class="trainingwise-label">
        SELF-GUIDED WORKOUT
      </p>

      <h2>
        ${title}
      </h2>

      <p>
        Choose the amount of time
        and the level that fits
        today's session.
      </p>


      <div class="trainingwise-setup-block">

        <span class="trainingwise-label">
          DURATION
        </span>

        <div class="trainingwise-choice-grid">

          <button
            type="button"
            data-workout-duration="15"
          >
            15 min
          </button>

          <button
            type="button"
            data-workout-duration="30"
            class="active"
          >
            30 min
          </button>

          <button
            type="button"
            data-workout-duration="45"
          >
            45 min
          </button>

        </div>

      </div>


      <div class="trainingwise-setup-block">

        <span class="trainingwise-label">
          LEVEL
        </span>

        <div class="trainingwise-choice-grid">

          <button
            type="button"
            data-workout-level="beginner"
          >
            Beginner
          </button>

          <button
            type="button"
            data-workout-level="intermediate"
            class="active"
          >
            Intermediate
          </button>

          <button
            type="button"
            data-workout-level="advanced"
          >
            Advanced
          </button>

        </div>

      </div>


      <button
        id="generateWorkoutBtn"
        class="trainingwise-btn trainingwise-generate-btn"
        type="button"
      >
        Generate Workout →
      </button>


      <div
        id="generatedWorkoutPreview"
        class="trainingwise-workout-preview hidden"
      ></div>
    `;


    wireSelfGuidedSetup(
      mode
    );

  }



  function wireSelfGuidedSetup(
    mode
  ) {

    let selectedDuration =
      30;

    let selectedLevel =
      "intermediate";


    document
      .querySelectorAll(
        "[data-workout-duration]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              selectedDuration =
                Number(
                  button.dataset
                    .workoutDuration
                );


              document
                .querySelectorAll(
                  "[data-workout-duration]"
                )
                .forEach(
                  (item) => {

                    item.classList.toggle(
                      "active",
                      item === button
                    );

                  }
                );

            }
          );

        }
      );


    document
      .querySelectorAll(
        "[data-workout-level]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              selectedLevel =
                button.dataset
                  .workoutLevel;


              document
                .querySelectorAll(
                  "[data-workout-level]"
                )
                .forEach(
                  (item) => {

                    item.classList.toggle(
                      "active",
                      item === button
                    );

                  }
                );

            }
          );

        }
      );


    document
      .getElementById(
        "generateWorkoutBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          const preview =
            document.getElementById(
              "generatedWorkoutPreview"
            );


          if (!preview) {
            return;
          }


          preview.classList.remove(
            "hidden"
          );


          if (
            mode ===
            "conditioning"
          ) {

            const workout =
              getConditioningWorkout(
                selectedLevel,
                selectedDuration
              );


            if (!workout) {

              preview.innerHTML =
                "<p>Workout not available.</p>";

              return;

            }


            preview.innerHTML = `
              <p class="trainingwise-label">
                CONDITIONING WORKOUT
              </p>

              <h3>
                ${workout.title}
              </h3>

              <p>
                ${selectedDuration} minutes
                ·
                ${
                  selectedLevel
                    .charAt(0)
                    .toUpperCase() +
                  selectedLevel.slice(1)
                }
              </p>


              <div class="trainingwise-workout-section">

                <strong>
                  Warm-Up
                </strong>

                <ul>
                  ${renderWorkoutList(
                    workout.warmup
                  )}
                </ul>

              </div>


              <div class="trainingwise-workout-section">

                <strong>
                  Main Work ·
                  ${workout.mainMinutes} min
                </strong>

                <p>
                  Cycle through the movements
                  with controlled form and
                  sustainable effort.
                </p>

                <ul>
                  ${renderWorkoutList(
                    workout.main
                  )}
                </ul>

              </div>


              <div class="trainingwise-workout-section">

                <strong>
                  Cool Down
                </strong>

                <ul>
                  ${renderWorkoutList(
                    workout.cooldown
                  )}
                </ul>

              </div>


              <button
                id="startSelfGuidedWorkoutBtn"
                class="trainingwise-btn"
                type="button"
              >
                Start Workout →
              </button>
            `;


            document
              .getElementById(
                "startSelfGuidedWorkoutBtn"
              )
              ?.addEventListener(
                "click",
                () => {

                  renderSelfGuidedExecution(
                    mode,
                    workout,
                    selectedDuration,
                    selectedLevel
                  );

                }
              );


            return;

          }


          preview.innerHTML = `
            <p class="trainingwise-label">
              WORKOUT SETUP
            </p>

            <h3>
              ${getSelfGuidedTitle(
                mode
              )}
            </h3>

            <p>
              ${selectedDuration} minutes
              ·
              ${
                selectedLevel
                  .charAt(0)
                  .toUpperCase() +
                selectedLevel.slice(1)
              }
            </p>

            <p>
              Curated programming
              for this lane comes next.
            </p>
          `;

        }
      );

  }



  function renderRecoveryExecution(
    workout
  ) {

    clearTimer();


    selfGuidedState = {

      mode:
        "recovery",

      workoutTitle:
        workout.title,

      recoveryFocus:
        workout.focus,

      plannedMinutes:
        workout.duration,

      totalSeconds:
        workout.duration * 60,

      remaining:
        workout.duration * 60,

      recoveryMoves:
        workout.moves,

      currentMove:
        0,

      moveRemaining:
        workout.moves?.[0]?.seconds || 0,

      running:
        false,

      completed:
        false

    };


    output.innerHTML = `
      <p class="trainingwise-label">
        RECOVERY / MOVEMENT
      </p>

      <h2>
        ${workout.title}
      </h2>

      <p>
        ${getRecoveryFocusLabel(
          workout.focus
        )}
        ·
        ${workout.duration} min
      </p>


      <div class="trainingwise-timer phase-rest">

        <div class="trainingwise-timer-round">
          Session Time
        </div>

        <div
          id="selfGuidedPhase"
          class="trainingwise-timer-phase"
        >
          READY
        </div>

        <div
          id="selfGuidedClock"
          class="trainingwise-clock"
        >
          ${formatSessionTime(
            selfGuidedState.remaining
          )}
        </div>

      </div>


      <div
        id="recoveryCurrentMove"
        class="trainingwise-recovery-current"
      ></div>


      <div class="trainingwise-recovery-nav">

        <button
          id="recoveryPreviousBtn"
          type="button"
        >
          ← Previous
        </button>

        <button
          id="recoveryNextBtn"
          type="button"
        >
          Next →
        </button>

      </div>


      <div class="trainingwise-controls">

        <button
          id="selfGuidedStartBtn"
          type="button"
        >
          Start
        </button>

        <button
          id="selfGuidedPauseBtn"
          type="button"
          disabled
        >
          Pause
        </button>

        <button
          id="selfGuidedEndBtn"
          type="button"
        >
          End
        </button>

      </div>


      <button
        id="selfGuidedCompleteBtn"
        class="trainingwise-btn"
        type="button"
        disabled
      >
        Complete Recovery
      </button>


      <p
        id="selfGuidedMessage"
        class="trainingwise-session-message"
      >
        Start when ready.
      </p>
    `;


    updateRecoveryMove();


    wireSelfGuidedExecution(
      workout
    );


    document
      .getElementById(
        "recoveryPreviousBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          changeRecoveryMove(
            -1
          );

        }
      );


    document
      .getElementById(
        "recoveryNextBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          changeRecoveryMove(
            1
          );

        }
      );

  }



  function updateRecoveryMove() {

    if (
      !selfGuidedState ||
      selfGuidedState.mode !==
        "recovery"
    ) {
      return;
    }


    const move =
      selfGuidedState
        .recoveryMoves[
          selfGuidedState
            .currentMove
        ];


    const box =
      document.getElementById(
        "recoveryCurrentMove"
      );


    if (
      !move ||
      !box
    ) {
      return;
    }


    box.innerHTML = `
      <p class="trainingwise-label">
        MOVEMENT ${
          selfGuidedState.currentMove +
          1
        } / ${
          selfGuidedState
            .recoveryMoves
            .length
        }
      </p>

      <h3>
        ${move.name}
      </h3>

      <div
        id="recoveryMoveClock"
        class="trainingwise-recovery-move-time"
      >
        ${formatSessionTime(
          selfGuidedState.moveRemaining
        )}
      </div>
    `;


    const previous =
      document.getElementById(
        "recoveryPreviousBtn"
      );


    const next =
      document.getElementById(
        "recoveryNextBtn"
      );


    if (previous) {

      previous.disabled =
        selfGuidedState
          .currentMove ===
        0;

    }


    if (next) {

      next.disabled =
        selfGuidedState
          .currentMove >=
        selfGuidedState
          .recoveryMoves
          .length - 1;

    }

  }



  function changeRecoveryMove(
    direction
  ) {

    if (
      !selfGuidedState ||
      selfGuidedState.mode !==
        "recovery"
    ) {
      return;
    }


    const next =
      selfGuidedState.currentMove +
      direction;


    if (
      next < 0 ||
      next >=
        selfGuidedState
          .recoveryMoves
          .length
    ) {
      return;
    }


    selfGuidedState.currentMove =
      next;


    selfGuidedState.moveRemaining =
      selfGuidedState
        .recoveryMoves[
          next
        ]
        ?.seconds ||
      0;


    updateRecoveryMove();

  }



  function renderSelfGuidedExecution(
    mode,
    workout,
    duration,
    level
  ) {

    clearTimer();


    selfGuidedState = {

      mode,

      workoutTitle:
        workout.title,

      plannedMinutes:
        duration,

      level,

      strengthFocus:
        workout.focus ||
        null,

      exercises:
        Array.isArray(
          workout.main
        )
          ? workout.main
              .filter(
                (item) =>
                  typeof item ===
                  "object"
              )
              .map(
                (item) => ({
                  name:
                    item.name,
                  sets:
                    item.sets,
                  reps:
                    item.reps
                })
              )
          : [],

      totalSeconds:
        duration * 60,

      remaining:
        duration * 60,

      running:
        false,

      completed:
        false

    };


    output.innerHTML = `
      <p class="trainingwise-label">
        SELF-GUIDED WORKOUT
      </p>

      <h2>
        ${workout.title}
      </h2>

      <p>
        ${getSelfGuidedTitle(mode)}
        ·
        ${duration} min
        ${
          level
            ? `· ${
                level
                  .charAt(0)
                  .toUpperCase() +
                level.slice(1)
              }`
            : ""
        }
      </p>


      <div
        class="trainingwise-timer phase-work"
      >

        <div class="trainingwise-timer-round">
          Session Time
        </div>

        <div
          id="selfGuidedPhase"
          class="trainingwise-timer-phase"
        >
          READY
        </div>

        <div
          id="selfGuidedClock"
          class="trainingwise-clock"
        >
          ${formatSessionTime(
            selfGuidedState.remaining
          )}
        </div>

      </div>


      <div class="trainingwise-workout-section">

        <strong>
          Warm-Up
        </strong>

        <ul>
          ${renderWorkoutList(
            workout.warmup
          )}
        </ul>

      </div>


      <div class="trainingwise-workout-section">

        <strong>
          ${
            mode === "strength"
              ? "Strength Work"
              : `Main Work · ${workout.mainMinutes} min`
          }
        </strong>

        ${
          mode === "strength"
            ? `
              <div class="trainingwise-strength-execution">

                ${renderStrengthBestSetTracker(
                  workout
                )}

              </div>
            `
            : `
              <ul>
                ${renderWorkoutList(
                  workout.main
                )}
              </ul>
            `
        }

      </div>


      <div class="trainingwise-workout-section">

        <strong>
          Cool Down
        </strong>

        <ul>
          ${renderWorkoutList(
            workout.cooldown
          )}
        </ul>

      </div>


      <div class="trainingwise-controls">

        <button
          id="selfGuidedStartBtn"
          type="button"
        >
          Start
        </button>

        <button
          id="selfGuidedPauseBtn"
          type="button"
          disabled
        >
          Pause
        </button>

        <button
          id="selfGuidedEndBtn"
          type="button"
        >
          End Workout
        </button>

      </div>


      <button
        id="selfGuidedCompleteBtn"
        class="trainingwise-btn"
        type="button"
        disabled
      >
        Complete Workout
      </button>


      <p
        id="selfGuidedMessage"
        class="trainingwise-session-message"
      >
        Start when ready.
      </p>
    `;


    wireSelfGuidedExecution(
      workout
    );


  }



  function getTrainingWiseLogs() {

    try {

      return JSON.parse(
        localStorage.getItem(
          "fuelai-log-v1"
        ) || "[]"
      );

    }

    catch {

      return [];

    }

  }



  function getLastStrengthBestSet(
    exerciseName
  ) {

    const logs =
      getTrainingWiseLogs();


    const strengthLogs =
      logs
        .filter(
          (entry) =>
            entry.type ===
              "training" &&
            entry.source ===
              "trainingwise" &&
            entry.trainingType ===
              "self-guided" &&
            entry.workoutType ===
              "strength" &&
            Array.isArray(
              entry.bestSets
            )
        )
        .reverse();


    for (
      const entry of strengthLogs
    ) {

      const match =
        entry.bestSets.find(
          (item) =>
            item.exercise ===
            exerciseName
        );


      if (match) {

        return {
          ...match,
          createdAt:
            entry.createdAt ||
            null
        };

      }

    }


    return null;

  }



  function renderLastBestSet(
    exerciseName
  ) {

    const last =
      getLastStrengthBestSet(
        exerciseName
      );


    if (!last) {

      return `
        <div class="trainingwise-last-best">

          <span class="trainingwise-label">
            LAST SESSION
          </span>

          <p>
            No previous best set recorded.
          </p>

        </div>
      `;

    }


    const weightText =
      Number(last.weight) > 0
        ? ` · ${last.weight} lb`
        : "";


    return `
      <div class="trainingwise-last-best">

        <span class="trainingwise-label">
          LAST SESSION
        </span>

        <p>
          Best Set:
          <strong>
            ${last.reps} reps${weightText}
          </strong>
        </p>

      </div>
    `;

  }



  function renderStrengthBestSetTracker(
    workout
  ) {

    return workout.main
      .map(
        (exercise, index) => {

          return `
            <div
              class="trainingwise-strength-exercise"
              data-best-set-exercise="${index}"
            >

              <strong>
                ${exercise.name}
              </strong>

              <p class="trainingwise-strength-prescription">
                Prescription:
                ${exercise.sets}
                sets
                ·
                ${exercise.reps}
                reps
              </p>


              ${renderLastBestSet(
                exercise.name
              )}


              <div class="trainingwise-today-best">

                <span class="trainingwise-label">
                  TODAY — BEST SET
                </span>

                <div class="trainingwise-strength-fields">

                  <label>
                    Reps

                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      placeholder="${exercise.reps}"
                      data-best-set-reps="${index}"
                    />
                  </label>


                  <label>
                    Weight (lb)

                    <input
                      type="number"
                      min="0"
                      max="2000"
                      step="0.5"
                      placeholder="0"
                      data-best-set-weight="${index}"
                    />
                  </label>

                </div>

                <p class="trainingwise-best-set-note">
                  Leave weight at 0 for
                  bodyweight-only work.
                </p>

              </div>

            </div>
          `;

        }
      )
      .join("");

  }



  function readStrengthBestSets() {

    if (
      !selfGuidedState ||
      selfGuidedState.mode !==
      "strength"
    ) {

      return [];

    }


    return selfGuidedState.exercises
      .map(
        (exercise, index) => {

          const reps =
            Number(
              document
                .querySelector(
                  `[data-best-set-reps="${index}"]`
                )
                ?.value
            );


          const weight =
            Number(
              document
                .querySelector(
                  `[data-best-set-weight="${index}"]`
                )
                ?.value
            );


          if (
            !Number.isFinite(reps) ||
            reps <= 0
          ) {

            return null;

          }


          return {

            exercise:
              exercise.name,

            reps:
              Math.round(
                reps
              ),

            weight:
              Number.isFinite(weight) &&
              weight >= 0
                ? weight
                : 0

          };

        }
      )
      .filter(Boolean);

  }



  function advanceRecoveryMove() {

    if (
      !selfGuidedState ||
      selfGuidedState.mode !==
      "recovery"
    ) {
      return;
    }


    const lastIndex =
      selfGuidedState
        .recoveryMoves
        .length - 1;


    if (
      selfGuidedState.currentMove >=
      lastIndex
    ) {

      selfGuidedState.moveRemaining =
        0;

      updateRecoveryMove();

      return;

    }


    selfGuidedState.currentMove +=
      1;


    selfGuidedState.moveRemaining =
      selfGuidedState
        .recoveryMoves[
          selfGuidedState.currentMove
        ]
        ?.seconds ||
      0;


    updateRecoveryMove();

  }



  function tickRecoveryMove() {

    if (
      !selfGuidedState ||
      selfGuidedState.mode !==
      "recovery" ||
      !selfGuidedState.running
    ) {
      return;
    }


    selfGuidedState.moveRemaining -=
      1;


    if (
      selfGuidedState.moveRemaining <=
      0
    ) {

      selfGuidedState.moveRemaining =
        0;

      advanceRecoveryMove();

      return;

    }


    const moveClock =
      document.getElementById(
        "recoveryMoveClock"
      );


    if (moveClock) {

      moveClock.textContent =
        formatSessionTime(
          selfGuidedState.moveRemaining
        );

    }

  }



  function updateSelfGuidedDisplay() {

    if (
      !selfGuidedState
    ) {
      return;
    }


    const clock =
      document.getElementById(
        "selfGuidedClock"
      );


    if (clock) {

      clock.textContent =
        formatSessionTime(
          selfGuidedState.remaining
        );

    }

  }



  function tickSelfGuided() {

    if (
      !selfGuidedState ||
      !selfGuidedState.running
    ) {
      return;
    }


    selfGuidedState.remaining -=
      1;


    if (
      selfGuidedState.mode ===
      "recovery"
    ) {

      tickRecoveryMove();

    }


    if (
      selfGuidedState.remaining <=
      0
    ) {

      selfGuidedState.remaining =
        0;

      updateSelfGuidedDisplay();

      finishSelfGuidedWorkout();

      return;

    }


    updateSelfGuidedDisplay();

  }



  function startSelfGuidedTimer() {

    if (
      !selfGuidedState ||
      selfGuidedState.completed ||
      selfGuidedState.running
    ) {
      return;
    }


    selfGuidedState.running =
      true;


    const timer =
      document.querySelector(
        ".trainingwise-timer"
      );

    const phase =
      document.getElementById(
        "selfGuidedPhase"
      );

    const startBtn =
      document.getElementById(
        "selfGuidedStartBtn"
      );

    const pauseBtn =
      document.getElementById(
        "selfGuidedPauseBtn"
      );


    timer?.classList.remove(
      "phase-paused",
      "phase-complete"
    );

    timer?.classList.add(
      "phase-work"
    );


    if (phase) {

      phase.textContent =
        "IN SESSION";

    }


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


    const completeBtn =
      document.getElementById(
        "selfGuidedCompleteBtn"
      );


    if (completeBtn) {

      completeBtn.disabled =
        false;

    }


    timerId =
      setInterval(
        tickSelfGuided,
        1000
      );

  }



  function pauseSelfGuidedTimer() {

    if (
      !selfGuidedState ||
      !selfGuidedState.running
    ) {
      return;
    }


    selfGuidedState.running =
      false;

    clearTimer();


    const timer =
      document.querySelector(
        ".trainingwise-timer"
      );

    const phase =
      document.getElementById(
        "selfGuidedPhase"
      );

    const startBtn =
      document.getElementById(
        "selfGuidedStartBtn"
      );

    const pauseBtn =
      document.getElementById(
        "selfGuidedPauseBtn"
      );


    timer?.classList.remove(
      "phase-work"
    );

    timer?.classList.add(
      "phase-paused"
    );


    if (phase) {

      phase.textContent =
        "PAUSED";

    }


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



  function resetSelfGuidedWorkout(
    workout
  ) {

    clearTimer();


    if (
      !selfGuidedState ||
      !workout
    ) {
      return;
    }


    renderSelfGuidedExecution(
      selfGuidedState.mode,
      workout,
      selfGuidedState.plannedMinutes,
      selfGuidedState.level
    );

  }



  function finishSelfGuidedWorkout() {

    clearTimer();


    if (
      !selfGuidedState ||
      selfGuidedState.completed
    ) {
      return;
    }


    selfGuidedState.running =
      false;


    if (
      selfGuidedState.mode ===
      "strength"
    ) {

      selfGuidedState.bestSets =
        readStrengthBestSets();

    }


    selfGuidedState.completed =
      true;


    const timer =
      document.querySelector(
        ".trainingwise-timer"
      );

    const phase =
      document.getElementById(
        "selfGuidedPhase"
      );

    const message =
      document.getElementById(
        "selfGuidedMessage"
      );


    timer?.classList.remove(
      "phase-work",
      "phase-paused"
    );

    timer?.classList.add(
      "phase-complete"
    );


    if (phase) {

      phase.textContent =
        "COMPLETE";

    }


    if (message) {

      message.textContent =
        "Workout complete.";

    }


    document
      .getElementById(
        "selfGuidedStartBtn"
      )
      ?.setAttribute(
        "disabled",
        ""
      );


    document
      .getElementById(
        "selfGuidedPauseBtn"
      )
      ?.setAttribute(
        "disabled",
        ""
      );


    document
      .getElementById(
        "selfGuidedCompleteBtn"
      )
      ?.setAttribute(
        "disabled",
        ""
      );


    window.FuelAILog
      ?.addFuelLog?.({

        type:
          "training",

        sessions:
          1,

        source:
          "trainingwise",

        trainingType:
          "self-guided",

        workoutType:
          selfGuidedState.mode,

        workoutTitle:
          selfGuidedState.workoutTitle,

        level:
          selfGuidedState.level,

        strengthFocus:
          selfGuidedState
            .strengthFocus,

        recoveryFocus:
          selfGuidedState
            .recoveryFocus ||
          null,

        recoveryMoves:
          selfGuidedState.mode ===
          "recovery"
            ? (
                selfGuidedState
                  .recoveryMoves ||
                []
              )
            : null,

        exercises:
          selfGuidedState
            .exercises,

        bestSets:
          selfGuidedState.mode ===
          "strength"
            ? (
                selfGuidedState.bestSets ||
                []
              )
            : null,

        plannedDurationMinutes:
          selfGuidedState.plannedMinutes,

        actualDurationSeconds:
          selfGuidedState.totalSeconds -
          selfGuidedState.remaining,

        completed:
          true

      });

  }



  function wireSelfGuidedExecution(
    workout
  ) {

    document
      .getElementById(
        "selfGuidedStartBtn"
      )
      ?.addEventListener(
        "click",
        startSelfGuidedTimer
      );


    document
      .getElementById(
        "selfGuidedPauseBtn"
      )
      ?.addEventListener(
        "click",
        pauseSelfGuidedTimer
      );


    document
      .getElementById(
        "selfGuidedEndBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          resetSelfGuidedWorkout(
            workout
          );

        }
      );


    document
      .getElementById(
        "selfGuidedCompleteBtn"
      )
      ?.addEventListener(
        "click",
        finishSelfGuidedWorkout
      );

  }



  /* =========================
     ROUTING
  ========================= */

  function openMode(
    mode
  ) {

    if (
      !output ||
      !modeLabels[mode]
    ) {
      return;
    }


    output.classList.remove(
      "hidden"
    );


    if (
      mode ===
      "interval"
    ) {

      renderInterval();

    }

    else if (
      mode ===
      "emom"
    ) {

      renderEmom();

    }

    else if (
      mode === "conditioning" ||
      mode === "strength" ||
      mode === "recovery"
    ) {

      renderSelfGuidedSetup(
        mode
      );

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
