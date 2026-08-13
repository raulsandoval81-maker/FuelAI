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
          Total: 16 minutes
        </small>

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
          intervalState.currentSessionRound
        } / ${
          intervalState.sessionRounds
        } · Interval ${
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
          : intervalState.phase ===
            "round-rest"
              ? "ROUND REST"
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
          intervalState.sessionRounds,

        intervalsPerRound:
          intervalState.rounds,

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
              intervalState.sessionRounds -
              1
            )
          ),

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
      intervalState.inRoundRest
    ) {

      intervalState.inRoundRest =
        false;

      intervalState.currentSessionRound +=
        1;

      intervalState.currentRound =
        1;

      intervalState.phase =
        "work";

      intervalState.remaining =
        intervalState.workSeconds;

      updateIntervalDisplay();

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


      const minutes =
        Math.floor(
          totalSeconds / 60
        );


      const seconds =
        totalSeconds % 60;


      duration.textContent =
        seconds
          ? `Total: ${minutes}:${String(
              seconds
            ).padStart(
              2,
              "0"
            )}`
          : `Total: ${minutes} minutes`;

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


  function renderEmom() {

    clearTimer();


    emomState = {

      totalMinutes:
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
        Complete your work, then use the
        remaining time to recover.
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
          Total: 20 minutes
        </small>

      </div>

      <div
        class="trainingwise-timer phase-work"
      >

        <div
          id="emomRound"
          class="trainingwise-timer-round"
        >
          Minute 1 / 10
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


    if (round) {

      round.textContent =
        `Round ${
          emomState.currentSessionRound
        } / ${
          emomState.sessionRounds
        } · Minute ${
          emomState.currentMinute
        } / ${
          emomState.totalMinutes
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
        formatTime(
          emomState.remaining
        );

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


    timer?.classList.remove(
      "phase-work",
      "phase-rest",
      "phase-paused"
    );


    timer?.classList.add(
      "phase-complete"
    );


    const phase =
      document.getElementById(
        "emomPhase"
      );


    if (phase) {

      phase.textContent =
        "COMPLETE";

    }


    const message =
      document.getElementById(
        "emomMessage"
      );


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
          emomState.totalMinutes,

        durationSeconds:
          (
            emomState.totalMinutes *
            60 *
            emomState.sessionRounds
          ) +
          (
            emomState.roundRestSeconds *
            Math.max(
              0,
              emomState.sessionRounds -
              1
            )
          ),

        completed:
          true

      });

  }


  function advanceEmom() {

    if (
      !emomState
    ) {
      return;
    }


    if (
      emomState.inRoundRest
    ) {

      emomState.inRoundRest =
        false;

      emomState.inRoundRest =
        true;

      emomState.remaining =
        emomState.roundRestSeconds;

      updateEmomDisplay();

      return;

    }


    if (
      emomState.currentMinute >=
      emomState.totalMinutes
    ) {

      if (
        emomState.currentSessionRound >=
        emomState.sessionRounds
      ) {

        finishEmom();

        return;

      }


      emomState.currentSessionRound +=
        1;

      emomState.currentMinute =
        1;

      emomState.remaining =
        60;

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


    const timer =
      document.querySelector(
        ".trainingwise-timer"
      );


    timer?.classList.remove(
      "phase-paused",
      "phase-complete"
    );


    timer?.classList.add(
      emomState.inRoundRest
        ? "phase-rest"
        : "phase-work"
    );


    const phase =
      document.getElementById(
        "emomPhase"
      );


    if (phase) {

      phase.textContent =
        "GO";

    }


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


    timer?.classList.remove(
      "phase-work"
    );


    timer?.classList.add(
      "phase-paused"
    );


    const phase =
      document.getElementById(
        "emomPhase"
      );


    if (phase) {

      phase.textContent =
        "PAUSED";

    }


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
        "Resume";

      startBtn.disabled =
        false;

    }


    if (pauseBtn) {

      pauseBtn.disabled =
        true;

    }

  }


  function stopEmom() {

    clearTimer();


    if (
      emomState
    ) {

      emomState.running =
        false;

    }


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
          emomState.totalMinutes *
          60
        ) +
        (
          Math.max(
            0,
            selected - 1
          ) *
          emomState.roundRestSeconds
        );


      const minutes =
        Math.floor(
          totalSeconds / 60
        );


      const seconds =
        totalSeconds % 60;


      duration.textContent =
        seconds
          ? `Total: ${minutes}:${String(
              seconds
            ).padStart(
              2,
              "0"
            )}`
          : `Total: ${minutes} minutes`;

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



  function renderSelfGuidedSetup(
    mode
  ) {

    clearTimer();


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

        <div
          class="trainingwise-choice-grid"
          data-choice-group="duration"
        >

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

        <div
          class="trainingwise-choice-grid"
          data-choice-group="level"
        >

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
