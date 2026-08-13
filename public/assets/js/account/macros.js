"use strict";


/* =========================
   DOM
========================= */

const macroSuggestion =
  document.getElementById(
    "macroSuggestion"
  );

const macroStyleNote =
  document.getElementById(
    "macroStyleNote"
  );

const macroBreakdown =
  document.getElementById(
    "macroBreakdown"
  );

const macroBreakdownCard =
  document.getElementById(
    "macroBreakdownCard"
  );

const macroPlan =
  document.getElementById(
    "macroPlan"
  );

const macroTargetProgress =
  document.getElementById(
    "macroTargetProgress"
  );



/* =========================
   SETUP
========================= */

function getSetup() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "fuelai-setup"
      ) || "{}"
    );

  } catch {

    return {};

  }

}


const setup =
  getSetup();



/* =========================
   HELPERS
========================= */

function parseMacroNumber(
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


  return Number.isFinite(
    number
  )
    ? number
    : 0;

}


function percent(
  current,
  target
) {

  if (
    !target
  ) {
    return 0;
  }


  return Math.min(
    100,
    Math.round(
      (
        current /
        target
      ) *
      100
    )
  );

}



/* =========================
   GOAL LABELS
========================= */

const displayGoal = {

  fuelwise:
    "FuelWise — Maintain / Balance",

  cutwise:
    "CutWise — Lean Out",

  gainwise:
    "GainWise — Build / Recover"

};


if (
  macroPlan
) {

  macroPlan.textContent =
    displayGoal[
      setup.goal
    ] ||
    displayGoal.fuelwise;

}



/* =========================
   MACRO STYLES
========================= */

const macroStyles = {

  fuelwise: {
    split:
      "35 / 40 / 25",

    protein:
      35,

    carbs:
      40,

    fats:
      25,

    note:
      "Protein / Carbs / Fat. Balanced nutrition for maintenance, recovery, and consistency."
  },


  cutwise: {
    split:
      "40 / 35 / 25",

    protein:
      40,

    carbs:
      35,

    fats:
      25,

    note:
      "Protein / Carbs / Fat. Higher protein with controlled carbohydrate intake for a gradual cut."
  },


  gainwise: {
    split:
      "40 / 40 / 20",

    protein:
      40,

    carbs:
      40,

    fats:
      20,

    note:
      "Protein / Carbs / Fat. Higher protein and carbohydrate intake to support training and recovery."
  }

};


const currentStyle =
  macroStyles[
    setup.goal
  ] ||
  macroStyles.fuelwise;


if (
  macroSuggestion
) {

  macroSuggestion.textContent =
    currentStyle.split;

}


if (
  macroStyleNote
) {

  macroStyleNote.textContent =
    currentStyle.note;

}



/* =========================
   SUMMARY
========================= */

function getFuelSummary() {

  if (
    !window.FuelAILog ||
    typeof window.FuelAILog
      .getFuelSummary !==
      "function"
  ) {

    return {};

  }


  return (
    window.FuelAILog
      .getFuelSummary() ||
    {}
  );

}



/* =========================
   TARGETS
========================= */

function getMacroTargets() {

  const summary =
    getFuelSummary();


  /*
   * FuelAILog is the source
   * of truth for calories.
   */

  let calories =
    parseMacroNumber(
      summary.caloriesTarget
    );


  /*
   * Legacy fallback if the
   * logging engine is unavailable.
   */

  if (
    !calories
  ) {

    const weight =
      parseMacroNumber(
        setup.weight
      );


    if (
      !weight
    ) {

      return {
        calories:
          0,

        protein:
          0,

        carbs:
          0,

        fats:
          0
      };

    }


    calories =
      Math.round(
        weight * 14
      );


    if (
      setup.goal ===
      "cutwise"
    ) {

      calories =
        Math.round(
          weight * 11
        );

    }


    if (
      setup.goal ===
      "gainwise"
    ) {

      calories =
        Math.round(
          weight * 16
        );

    }

  }


  /*
   * Use FuelAILog protein target
   * when available so Macros,
   * TrackWise, and Coach Wright
   * stay aligned.
   */

  let protein =
    parseMacroNumber(
      summary.proteinTarget
    );


  if (
    !protein
  ) {

    const weight =
      parseMacroNumber(
        setup.weight
      );


    protein =
      weight
        ? Math.round(
            weight * 0.8
          )
        : 0;

  }


  /*
   * Allocate remaining calories
   * between carbs and fat.
   */

  const proteinCalories =
    protein * 4;


  const remainingCalories =
    Math.max(
      0,
      calories -
      proteinCalories
    );


  const carbFatTotal =
    currentStyle.carbs +
    currentStyle.fats;


  const carbRatio =
    carbFatTotal
      ? (
          currentStyle.carbs /
          carbFatTotal
        )
      : 0;


  const fatRatio =
    carbFatTotal
      ? (
          currentStyle.fats /
          carbFatTotal
        )
      : 0;


  const carbs =
    Math.round(
      (
        remainingCalories *
        carbRatio
      ) /
      4
    );


  const fats =
    Math.round(
      (
        remainingCalories *
        fatRatio
      ) /
      9
    );


  return {
    calories:
      Math.round(
        calories
      ),

    protein:
      Math.round(
        protein
      ),

    carbs,

    fats
  };

}



/* =========================
   PROGRESS
========================= */

function getMacroProgress() {

  const summary =
    getFuelSummary();


  return {

    calories:
      parseMacroNumber(
        summary.caloriesToday
      ),

    protein:
      parseMacroNumber(
        summary.proteinToday
      ),

    carbs:
      parseMacroNumber(
        summary.carbsToday
      ),

    fats:
      parseMacroNumber(
        summary.fatsToday
      )

  };

}



/* =========================
   RENDER
========================= */

function renderMacros() {

  const targets =
    getMacroTargets();


  const progress =
    getMacroProgress();


  const hasMacroProgress =
    progress.calories > 0 ||
    progress.protein > 0 ||
    progress.carbs > 0 ||
    progress.fats > 0;


  if (
    macroBreakdownCard
  ) {

    macroBreakdownCard
      .classList
      .toggle(
        "hidden",
        !hasMacroProgress
      );

  }


  if (
    macroBreakdown
  ) {

    macroBreakdown.innerHTML = `
      Current logged totals:

      <br><br>

      <div class="macro-row">
        <span>
          🔥 Calories
        </span>

        <strong>
          ${percent(
            progress.calories,
            targets.calories
          )}%
        </strong>
      </div>

      <div class="macro-row">
        <span>
          🥩 Protein
        </span>

        <strong>
          ${percent(
            progress.protein,
            targets.protein
          )}%
        </strong>
      </div>

      <div class="macro-row">
        <span>
          🍞 Carbs
        </span>

        <strong>
          ${percent(
            progress.carbs,
            targets.carbs
          )}%
        </strong>
      </div>

      <div class="macro-row">
        <span>
          🥑 Fats
        </span>

        <strong>
          ${percent(
            progress.fats,
            targets.fats
          )}%
        </strong>
      </div>
    `;

  }


  if (
    macroTargetProgress
  ) {

    if (
      !targets.calories
    ) {

      macroTargetProgress.innerHTML = `
        Add your current weight in Setup
        to calculate daily macro targets.
      `;

      return;

    }


    macroTargetProgress.innerHTML = `
      <div class="macro-row">
        <span>
          🔥 Calories
        </span>

        <strong>
          ${progress.calories}
          /
          ${targets.calories}
        </strong>
      </div>

      <div class="macro-row">
        <span>
          🥩 Protein
        </span>

        <strong>
          ${progress.protein}g
          /
          ${targets.protein}g
        </strong>
      </div>

      <div class="macro-row">
        <span>
          🍞 Carbs
        </span>

        <strong>
          ${progress.carbs}g
          /
          ${targets.carbs}g
        </strong>
      </div>

      <div class="macro-row">
        <span>
          🥑 Fats
        </span>

        <strong>
          ${progress.fats}g
          /
          ${targets.fats}g
        </strong>
      </div>
    `;

  }

}



/* =========================
   START
========================= */

renderMacros();