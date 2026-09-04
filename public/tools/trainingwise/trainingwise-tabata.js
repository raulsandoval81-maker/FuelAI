(() => {
  "use strict";

  const output =
    document.getElementById(
      "trainingwiseOutput"
    );

  if (!output) return;


  let timerId =
    null;

  let state =
    null;

  let tabataStartCountdownId =
    null;


  const quickMovements = [
    "Air Squats",
    "Push-Ups",
    "Reverse Lunges",
    "Mountain Climbers",
    "Plank",
    "Glute Bridge",
    "High Knees",
    "Bear Crawl"
  ];


  function clearTimer() {

    if (timerId !== null) {

      clearInterval(timerId);

      timerId = null;

    }

  }


  function speak(text) {

    if (
      !text ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    utterance.rate =
      1;

    window.speechSynthesis.speak(
      utterance
    );

  }


  function speakSequence(
    parts,
    pauseMs = 450
  ) {

    if (
      !Array.isArray(parts) ||
      !parts.length ||
      !("speechSynthesis" in window)
    ) {
      return;
    }


    window.speechSynthesis.cancel();


    parts.forEach(
      (part, index) => {

        const utterance =
          new SpeechSynthesisUtterance(
            part
          );

        utterance.rate =
          1;


        window.setTimeout(
          () => {

            window.speechSynthesis.speak(
              utterance
            );

          },
          index * pauseMs
        );

      }
    );

  }



  function cleanMovements(
    value
  ) {

    return String(
      value || ""
    )
      .split(",")
      .map(
        item =>
          item.trim()
      )
      .filter(Boolean)
      .slice(0, 16);

  }


  function getMovement(
    index
  ) {

    if (
      !state ||
      state.workoutMode ===
      "timer"
    ) {
      return "";
    }

    const movements =
      state.movements || [];

    if (!movements.length) {
      return "";
    }

    return movements[
      index %
      movements.length
    ];

  }


  function formatTime(
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


  function getTotalSeconds() {

    if (!state) {
      return 0;
    }

    /*
      Standard Tabata block:
      8 x (20 work + 10 rest)
      = 240 sec / 4 min
    */

    const blockSeconds =
      state.intervalsPerBlock *
      (
        state.workSeconds +
        state.restSeconds
      );

    const betweenBlocks =
      Math.max(
        0,
        state.blocks - 1
      ) *
      state.blockRestSeconds;

    return (
      (
        state.blocks *
        blockSeconds
      ) +
      betweenBlocks
    );

  }


  function patternNote(
    count
  ) {

    if (count === 1) {
      return "1 move repeats across all 8 work intervals.";
    }

    if (count === 2) {
      return "2 moves alternate across the 8 work intervals.";
    }

    if (count === 4) {
      return "4 moves repeat twice across the 8 work intervals.";
    }

    return "8 moves rotate once across the 8 work intervals.";

  }


  function renderTabata() {

    clearTimer();

    state = {

      workSeconds:
        20,

      restSeconds:
        10,

      intervalsPerBlock:
        8,

      currentInterval:
        1,

      blocks:
        8,

      currentBlock:
        1,

      blockRestSeconds:
        60,

      phase:
        "work",

      remaining:
        20,

      running:
        false,

      hasStarted:
        false,

      preparing:
        false,

      completed:
        false,

      inBlockRest:
        false,

      workoutMode:
        "fuelai",

      movementCount:
        2,

      movements:
        quickMovements.slice(
          0,
          2
        )

    };


    output.classList.remove(
      "hidden"
    );


    output.innerHTML = `
      <p class="trainingwise-label">
        TABATA
      </p>

      <h2>
        20 / 10 Tabata
      </h2>

      <p>
        Eight work intervals per block.
        Choose the movement pattern
        and number of blocks.
      </p>

      <div class="trainingwise-preset">
        20 sec work ·
        10 sec recovery ·
        8 intervals = 4 minutes
      </div>


      <div class="trainingwise-round-picker">

        <span class="trainingwise-label">
          MOVEMENT PATTERN
        </span>

        <div class="trainingwise-round-options">

          <button
            type="button"
            data-tabata-moves="1"
          >
            1 Move
          </button>

          <button
            type="button"
            data-tabata-moves="2"
            class="active"
          >
            2 Moves
          </button>

          <button
            type="button"
            data-tabata-moves="4"
          >
            4 Moves
          </button>

          <button
            type="button"
            data-tabata-moves="8"
          >
            8 Moves
          </button>

        </div>

        <small id="tabataPatternNote">
          2 moves alternate across the
          8 work intervals.
        </small>

      </div>


      <div class="trainingwise-content-picker">

        <span class="trainingwise-label">
          WORKOUT
        </span>

        <div class="trainingwise-content-options">

          <button
            type="button"
            data-tabata-content="timer"
          >
            Timer Only
          </button>

          <button
            type="button"
            data-tabata-content="fuelai"
            class="active"
          >
            FuelAI Workout
          </button>

          <button
            type="button"
            data-tabata-content="custom"
          >
            Build My Own
          </button>

        </div>

        <div
          id="tabataCustomBuilder"
          class="trainingwise-custom-builder hidden"
        >

          <label for="tabataCustomMovements">
            Movements
          </label>

          <textarea
            id="tabataCustomMovements"
            rows="3"
            placeholder="Example: Squats, Push-Ups, Lunges, Plank"
          ></textarea>

          <small>
            Separate movements with commas.
            Use up to 16.
          </small>

        </div>

      </div>


      <div class="trainingwise-round-picker">

        <span class="trainingwise-label">
          BLOCKS
        </span>

        <div class="trainingwise-round-options">

          <button
            type="button"
            data-tabata-blocks="1"
          >
            1
          </button>

          <button
            type="button"
            data-tabata-blocks="2"
          >
            2
          </button>

          <button
            type="button"
            data-tabata-blocks="4"
          >
            4
          </button>

          <button
            type="button"
            data-tabata-blocks="8"
            class="active"
          >
            8
          </button>

        </div>

        <small id="tabataDuration">
          Total: 39:00
        </small>

      </div>


      <div class="trainingwise-round-picker">

        <span class="trainingwise-label">
          REST BETWEEN BLOCKS
        </span>

        <div class="trainingwise-round-options">

          <button
            type="button"
            data-tabata-block-rest="30"
          >
            30 sec
          </button>

          <button
            type="button"
            data-tabata-block-rest="60"
            class="active"
          >
            60 sec
          </button>

          <button
            type="button"
            data-tabata-block-rest="90"
          >
            90 sec
          </button>

          <button
            type="button"
            data-tabata-block-rest="120"
          >
            120 sec
          </button>

        </div>

      </div>


      <div
        class="trainingwise-timer phase-work"
      >

        <div
          id="tabataRound"
          class="trainingwise-timer-round"
        >
          Block 1 / 1 ·
          Interval 1 / 8
        </div>

        <div
          id="tabataPhase"
          class="trainingwise-timer-phase"
        >
          WORK
        </div>

        <div
          id="tabataMovement"
          class="trainingwise-movement-callout"
        >
          Air Squats
        </div>

        <div
          id="tabataClock"
          class="trainingwise-clock"
        >
          20
        </div>

      </div>


      <div
        class="trainingwise-board-controls"
        data-board-mode="tabata"
      >

        <button
          type="button"
          id="tabataBoardStartBtn"
          class="trainingwise-board-action"
          aria-label="Start Tabata"
        >
          ▶
        </button>

        <button
          type="button"
          id="tabataBoardPauseBtn"
          class="trainingwise-board-action"
          aria-label="Pause Tabata"
          disabled
        >
          ⏸
        </button>

        <button
          type="button"
          class="trainingwise-board-exit"
          id="tabataBoardExitBtn"
          aria-label="Exit Big Clock"
        >
          ×
        </button>

      </div>


      <div class="trainingwise-view-controls">

        <button
          id="tabataFullClockBtn"
          type="button"
          class="trainingwise-full-clock-toggle"
          aria-pressed="false"
          aria-label="Open Big Clock"
        >
          ⛶
        </button>

      </div>


      <div class="trainingwise-controls">

        <button
          id="tabataStartBtn"
          type="button"
        >
          Start
        </button>

        <button
          id="tabataPauseBtn"
          type="button"
          disabled
        >
          Pause
        </button>

        <button
          id="tabataStopBtn"
          type="button"
        >
          End Session
        </button>

      </div>


      <p
        id="tabataMessage"
        class="trainingwise-session-message"
      >
        Start when ready.
      </p>
    `;


    wireControls();

    updateDisplay();

  }


  function updateDisplay() {

    if (!state) return;


    const round =
      document.getElementById(
        "tabataRound"
      );

    const phase =
      document.getElementById(
        "tabataPhase"
      );

    const clock =
      document.getElementById(
        "tabataClock"
      );

    const movement =
      document.getElementById(
        "tabataMovement"
      );

    const duration =
      document.getElementById(
        "tabataDuration"
      );

    const timer =
      output.querySelector(
        ".trainingwise-timer"
      );


    if (round) {

      round.textContent =
        state.inBlockRest
          ? (
            `Block ${state.currentBlock} / ${state.blocks} · ` +
            "Block Recovery"
          )
          : (
            `Block ${state.currentBlock} / ${state.blocks} · ` +
            `Interval ${state.currentInterval} / 8`
          );

    }


    if (phase) {

      phase.textContent =
        state.inBlockRest
          ? "BLOCK REST"
          : state.phase.toUpperCase();

    }


    if (clock) {

      clock.textContent =
        String(
          Math.max(
            0,
            state.remaining
          )
        ).padStart(
          2,
          "0"
        );

    }


    if (movement) {

      movement.textContent =
        (
          state.phase ===
          "work" &&
          !state.inBlockRest
        )
          ? getMovement(
            (
              (
                state.currentBlock -
                1
              ) *
              8
            ) +
            state.currentInterval -
            1
          )
          : "";

    }


    if (duration) {

      duration.textContent =
        `Total: ${formatTime(
          getTotalSeconds()
        )}`;

    }


    updateTabataBoardControls();


    if (timer) {

      if (
        timer.classList.contains(
          "phase-paused"
        )
      ) {
        return;
      }


      timer.classList.remove(
        "phase-work",
        "phase-rest"
      );

      timer.classList.add(
        (
          state.phase ===
          "work" &&
          !state.inBlockRest
        )
          ? "phase-work"
          : "phase-rest"
      );

    }

  }


  function updateTabataBoardControls() {

    const boardStart =
      document.getElementById(
        "tabataBoardStartBtn"
      );

    const boardPause =
      document.getElementById(
        "tabataBoardPauseBtn"
      );


    if (boardStart) {

      boardStart.disabled =
        !state ||
        state.running ||
        state.completed;

      boardStart.textContent =
        state?.hasStarted
          ? "▶"
          : "▶";

      boardStart.setAttribute(
        "aria-label",
        state?.hasStarted
          ? "Resume Tabata"
          : "Start Tabata"
      );

    }


    if (boardPause) {

      boardPause.disabled =
        !state ||
        !state.running ||
        state.completed;

    }

  }



  function speakTabataWorkCue() {

    if (!state) return;


    const movement =
      getMovement(
        (
          (
            state.currentBlock -
            1
          ) *
          state.intervalsPerBlock
        ) +
        state.currentInterval -
        1
      );


    if (movement) {

      speakSequence(
        [
          movement,
          "Work."
        ],
        650
      );

      return;

    }


    speak(
      "Work."
    );

  }



  function cancelTabataStartCountdown() {

    if (
      tabataStartCountdownId !==
      null
    ) {

      clearTimeout(
        tabataStartCountdownId
      );

      tabataStartCountdownId =
        null;

    }


    if (state) {
      state.preparing = false;
    }

  }



  function runTabataStartCountdown(
    onComplete
  ) {

    if (
      !state ||
      state.hasStarted ||
      state.preparing
    ) {
      return;
    }


    state.preparing =
      true;


    const normalStart =
      document.getElementById(
        "tabataStartBtn"
      );

    const normalPause =
      document.getElementById(
        "tabataPauseBtn"
      );

    const boardStart =
      document.getElementById(
        "tabataBoardStartBtn"
      );

    const boardPause =
      document.getElementById(
        "tabataBoardPauseBtn"
      );


    if (normalStart) {
      normalStart.disabled = true;
    }

    if (normalPause) {
      normalPause.disabled = true;
    }

    if (boardStart) {
      boardStart.disabled = true;
    }

    if (boardPause) {
      boardPause.disabled = true;
    }


    const phase =
      document.getElementById(
        "tabataPhase"
      );

    const clock =
      document.getElementById(
        "tabataClock"
      );

    const message =
      document.getElementById(
        "tabataMessage"
      );


    if (phase) {
      phase.textContent =
        "GET READY";
    }

    if (message) {
      message.textContent =
        "Get ready.";
    }


    const sequence =
      [5, 4, 3, 2, 1];

    let index =
      0;


    const step = () => {

      if (
        !state ||
        !state.preparing
      ) {
        return;
      }


      if (
        index <
        sequence.length
      ) {

        const value =
          sequence[index];


        if (clock) {
          clock.textContent =
            String(value);
        }


        speak(
          String(value)
        );


        index +=
          1;


        tabataStartCountdownId =
          setTimeout(
            step,
            1000
          );

        return;

      }


      tabataStartCountdownId =
        null;

      state.preparing =
        false;

      state.hasStarted =
        true;

      state.remaining =
        state.workSeconds;


      updateDisplay();


      if (
        typeof onComplete ===
        "function"
      ) {
        onComplete();
      }

    };


    step();

  }



  function completeSession() {

    clearTimer();

    state.running =
      false;

    state.completed =
      true;

    state.remaining =
      0;

    updateDisplay();


    document.getElementById(
      "tabataMessage"
    ).textContent =
      "Tabata complete.";


    document.getElementById(
      "tabataStartBtn"
    ).disabled =
      true;


    document.getElementById(
      "tabataPauseBtn"
    ).disabled =
      true;


    speak(
      "Tabata complete."
    );


    window.FuelAILog
      ?.addFuelLog?.({

        type:
          "training",

        sessions: [
          {

            source:
              "trainingwise",

            mode:
              "tabata",

            protocol:
              "20/10",

            intervalsPerBlock:
              8,

            blocks:
              state.blocks,

            movementCount:
              state.movementCount,

            movements:
              state.movements,

            completed:
              true,

            completedAt:
              new Date()
                .toISOString()

          }
        ]

      });

  }


  function advancePhase() {

    if (!state) return;


    if (
      state.inBlockRest
    ) {

      state.inBlockRest =
        false;

      state.currentBlock +=
        1;

      state.currentInterval =
        1;

      state.phase =
        "work";

      state.remaining =
        state.workSeconds;

      speakTabataWorkCue();

      updateDisplay();

      return;

    }


    if (
      state.phase ===
      "work"
    ) {

      state.phase =
        "rest";

      state.remaining =
        state.restSeconds;

      speak(
        "Breathe."
      );

      updateDisplay();

      return;

    }


    if (
      state.currentInterval <
      state.intervalsPerBlock
    ) {

      state.currentInterval +=
        1;

      state.phase =
        "work";

      state.remaining =
        state.workSeconds;

      speakTabataWorkCue();

      updateDisplay();

      return;

    }


    if (
      state.currentBlock <
      state.blocks
    ) {

      state.inBlockRest =
        true;

      state.phase =
        "rest";

      state.remaining =
        state.blockRestSeconds;

      speak(
        "Reset."
      );

      updateDisplay();

      return;

    }


    completeSession();

  }


  function tick() {

    if (
      !state ||
      !state.running
    ) {
      return;
    }


    state.remaining -=
      1;

    const timer =
      output.querySelector(
        ".trainingwise-timer"
      );


    const workEnding =
      state.phase === "work" &&
      !state.inBlockRest &&
      state.remaining >= 1 &&
      state.remaining <= 5;


    const recoveryEnding =
      (
        state.phase === "rest" ||
        state.inBlockRest
      ) &&
      state.remaining >= 1 &&
      state.remaining <= 5;


    timer?.classList.toggle(
      "phase-ending",
      workEnding
    );


    timer?.classList.toggle(
      "phase-recovery-ending",
      recoveryEnding
    );


    if (
      state.phase === "work" &&
      !state.inBlockRest &&
      state.remaining === 5
    ) {

      if (
        state.currentInterval ===
        state.intervalsPerBlock
      ) {

        speak(
          "Finish."
        );

      }
      else {

        speakSequence(
          [
            "Feel.",
            "The burn."
          ],
          650
        );

      }

    }


    if (
      state.phase === "rest" &&
      !state.inBlockRest &&
      state.remaining >= 1 &&
      state.remaining <= 3
    ) {

      speak(
        String(
          state.remaining
        )
      );

    }


    /*
     * TABATA FINAL 5
     *
     * Keep the language short.
     * No Interval "Short time" cue here.
     */
    if (
      state.phase === "work" &&
      !state.inBlockRest &&
      state.remaining === 5
    ) {

      speak(
        state.currentInterval ===
          state.intervalsPerBlock
          ? "Finish."
          : "Feel the burn."
      );

    }


    if (
      state.phase === "rest" &&
      !state.inBlockRest &&
      state.remaining === 3
    ) {

      speak(
        "Ready."
      );

    }



    if (
      !state.inBlockRest &&
      state.phase ===
      "work" &&
      state.remaining ===
      10
    ) {

      speak(
        ""
      );

    }


    if (
      state.remaining <=
      0
    ) {

      advancePhase();

      return;

    }


    updateDisplay();

  }


  function startImmediate(
    announceWork = false
  ) {

    if (
      !state ||
      state.completed ||
      state.running
    ) {
      return;
    }


    state.running =
      true;


    output
      .querySelector(
        ".trainingwise-timer"
      )
      ?.classList.remove(
        "phase-paused"
      );

    state.preparing =
      false;


    const normalStart =
      document.getElementById(
        "tabataStartBtn"
      );

    const normalPause =
      document.getElementById(
        "tabataPauseBtn"
      );


    if (normalStart) {
      normalStart.disabled = true;
    }

    if (normalPause) {
      normalPause.disabled = false;
    }


    document.getElementById(
      "tabataMessage"
    ).textContent =
      "Tabata running.";


    if (announceWork) {
      speakTabataWorkCue();
    }


    clearTimer();


    timerId =
      setInterval(
        tick,
        1000
      );


    updateDisplay();


    if (
      typeof updateTabataBoardControls ===
      "function"
    ) {

      updateTabataBoardControls();

    }

  }



  function start() {

    if (
      !state ||
      state.completed ||
      state.running ||
      state.preparing
    ) {
      return;
    }


    /*
     * FIRST START ONLY:
     * 5-4-3-2-1 -> GO
     */
    if (
      !state.hasStarted
    ) {

      runTabataStartCountdown(
        () => {
          startImmediate(true);
        }
      );

      return;

    }


    /*
     * RESUME:
     * Continue immediately from
     * the paused clock.
     * NO countdown.
     */
    startImmediate(false);

  }



  function pause() {

    if (
      !state ||
      !state.running
    ) {
      return;
    }


    state.running =
      false;


    clearTimer();


    const timer =
      output.querySelector(
        ".trainingwise-timer"
      );

    const phase =
      document.getElementById(
        "tabataPhase"
      );


    timer?.classList.remove(
      "phase-work",
      "phase-rest",
      "phase-recovery-ending",
      "phase-ending"
    );


    timer?.classList.add(
      "phase-paused"
    );


    if (phase) {

      phase.textContent =
        "PAUSED";

    }


    document.getElementById(
      "tabataStartBtn"
    ).disabled =
      false;


    document.getElementById(
      "tabataStartBtn"
    ).textContent =
      "Resume";


    document.getElementById(
      "tabataPauseBtn"
    ).disabled =
      true;


    document.getElementById(
      "tabataMessage"
    ).textContent =
      "Paused.";


    window.speechSynthesis
      ?.cancel?.();

  }


  function stop() {

    cancelTabataStartCountdown();

    clearTimer();

    if (isTabataFullClock()) {
      exitTabataFullClock();
    }


    window.speechSynthesis
      ?.cancel?.();


    renderTabata();


    document.getElementById(
      "tabataMessage"
    ).textContent =
      "Session reset.";

  }


  function setActive(
    button,
    selector
  ) {

    button
      .closest(
        ".trainingwise-round-options, .trainingwise-content-options"
      )
      ?.querySelectorAll(
        selector
      )
      .forEach(
        item =>
          item.classList.remove(
            "active"
          )
      );


    button.classList.add(
      "active"
    );

  }


  function isTabataFullClock() {

    return window
      .TrainingWiseStageController
      ?.isActive?.() ||
      false;

  }


  function updateTabataFullClockButton() {

    const button =
      document.getElementById(
        "tabataFullClockBtn"
      );

    if (!button) return;


    const active =
      isTabataFullClock();


    button.textContent =
      active
        ? "↙"
        : "⛶";


    button.setAttribute(
      "aria-pressed",
      active
        ? "true"
        : "false"
    );


    button.setAttribute(
      "aria-label",
      active
        ? "Close Big Clock"
        : "Open Big Clock"
    );

  }


  async function enterTabataFullClock() {

    if (!output) return;

    await window
      .TrainingWiseStageController
      ?.enter?.();

    updateTabataFullClockButton();

  }


  async function exitTabataFullClock() {

    if (!output) return;

    await window
      .TrainingWiseStageController
      ?.exit?.();

    updateTabataFullClockButton();

  }


  function toggleTabataFullClock() {

    if (
      isTabataFullClock()
    ) {

      exitTabataFullClock();

    }
    else {

      enterTabataFullClock();

    }

  }



  function wireControls() {


    document
      .getElementById(
        "tabataBoardStartBtn"
      )
      ?.addEventListener(
        "click",
        start
      );


    document
      .getElementById(
        "tabataBoardPauseBtn"
      )
      ?.addEventListener(
        "click",
        pause
      );


    document
      .getElementById(
        "tabataBoardExitBtn"
      )
      ?.addEventListener(
        "click",
        exitTabataFullClock
      );


    document
      .getElementById(
        "tabataFullClockBtn"
      )
      ?.addEventListener(
        "click",
        toggleTabataFullClock
      );


    document
      .getElementById(
        "tabataStartBtn"
      )
      ?.addEventListener(
        "click",
        start
      );


    document
      .getElementById(
        "tabataPauseBtn"
      )
      ?.addEventListener(
        "click",
        pause
      );


    document
      .getElementById(
        "tabataStopBtn"
      )
      ?.addEventListener(
        "click",
        stop
      );


    output
      .querySelectorAll(
        "[data-tabata-moves]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              if (
                state?.running
              ) {
                return;
              }


              setActive(
                button,
                "[data-tabata-moves]"
              );


              state.movementCount =
                Number(
                  button.dataset
                    .tabataMoves
                );


              if (
                state.workoutMode ===
                "fuelai"
              ) {

                state.movements =
                  quickMovements.slice(
                    0,
                    state.movementCount
                  );

              }


              document.getElementById(
                "tabataPatternNote"
              ).textContent =
                patternNote(
                  state.movementCount
                );


              updateDisplay();

            }
          );

        }
      );


    output
      .querySelectorAll(
        "[data-tabata-blocks]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              if (
                state?.running
              ) {
                return;
              }


              setActive(
                button,
                "[data-tabata-blocks]"
              );


              state.blocks =
                Number(
                  button.dataset
                    .tabataBlocks
                );


              state.currentBlock =
                1;


              updateDisplay();

            }
          );

        }
      );


    output
      .querySelectorAll(
        "[data-tabata-block-rest]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              if (
                state?.running
              ) {
                return;
              }


              setActive(
                button,
                "[data-tabata-block-rest]"
              );


              state.blockRestSeconds =
                Number(
                  button.dataset
                    .tabataBlockRest
                );


              updateDisplay();

            }
          );

        }
      );


    output
      .querySelectorAll(
        "[data-tabata-content]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              if (
                state?.running
              ) {
                return;
              }


              setActive(
                button,
                "[data-tabata-content]"
              );


              state.workoutMode =
                button.dataset
                  .tabataContent;


              const builder =
                document.getElementById(
                  "tabataCustomBuilder"
                );


              builder
                ?.classList.toggle(
                  "hidden",
                  state.workoutMode !==
                  "custom"
                );


              if (
                state.workoutMode ===
                "timer"
              ) {

                state.movements =
                  [];

              }


              if (
                state.workoutMode ===
                "fuelai"
              ) {

                state.movements =
                  quickMovements.slice(
                    0,
                    state.movementCount
                  );

              }


              if (
                state.workoutMode ===
                "custom"
              ) {

                state.movements =
                  cleanMovements(
                    document.getElementById(
                      "tabataCustomMovements"
                    )?.value
                  );

              }


              updateDisplay();

            }
          );

        }
      );


    document
      .getElementById(
        "tabataCustomMovements"
      )
      ?.addEventListener(
        "input",
        event => {

          if (
            !state ||
            state.workoutMode !==
            "custom" ||
            state.running
          ) {
            return;
          }


          state.movements =
            cleanMovements(
              event.target.value
            );


          updateDisplay();

        }
      );

  }


  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          '[data-training-mode="tabata"]'
        );


      if (!button) {
        return;
      }


      event.preventDefault();

      event.stopImmediatePropagation();


      renderTabata();


      output.scrollIntoView({
        behavior:
          "smooth",
        block:
          "start"
      });

    },
    true
  );

  document.addEventListener(
    "trainingwisestagechange",
    updateTabataFullClockButton
  );



})();
