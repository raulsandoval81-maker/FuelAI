const macroTargets =
  document.getElementById("macroTargets");

const macroProgress =
  document.getElementById("macroProgress");

const macroSuggestion =
  document.getElementById("macroSuggestion");

const macroStyleNote =
  document.getElementById("macroStyleNote");

const macroBreakdown =
  document.getElementById("macroBreakdown");

const macroBreakdownCard =
  document.getElementById("macroBreakdownCard");

  const macroPlan =
  document.getElementById("macroPlan");

const setup =
  JSON.parse(
    localStorage.getItem("fuelai-setup") || "{}"
  );

  const displayGoal = {
  fuelwise: "FuelWise — Maintain",
  cutwise: "CutWise — Cut",
  gainwise: "GainWise — Gain"
};

if (macroPlan) {
  macroPlan.textContent =
    displayGoal[setup.goal] ||
    "FuelWise — Maintain";
}

function getMacroTargets() {
  const weight =
    Number(setup.weight || 0);

  if (!weight) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    };
  }

  let calories =
    weight * 14;

  let proteinMultiplier =
    0.9;

  let carbMultiplier =
    1.5;

  let fatMultiplier =
    0.35;

  if (setup.goal === "cutwise") {
    calories =
      weight * 11;

    proteinMultiplier =
      1.0;

    carbMultiplier =
      1.0;

    fatMultiplier =
      0.3;
  }

  if (setup.goal === "gainwise") {
    calories =
      weight * 16;

    proteinMultiplier =
      1.0;

    carbMultiplier =
      2.0;

    fatMultiplier =
      0.35;
  }

  return {
    calories:
      Math.round(calories),

    protein:
      Math.round(weight * proteinMultiplier),

    carbs:
      Math.round(weight * carbMultiplier),

    fats:
      Math.round(weight * fatMultiplier)
  };
}

function getMacroProgress() {
  if (!window.FuelAILog) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    };
  }

  const summary =
    window.FuelAILog.getFuelSummary();

  return {
    calories:
      summary.caloriesToday || 0,

    protein:
      summary.proteinToday || 0,

    carbs:
      summary.carbsToday || 0,

    fats:
      summary.fatsToday || 0
  };
}

const macroStyles = {

  fuelwise: {
    split: "35 / 40 / 25",
    note:
      "Protein / Carbs / Fat. Balanced eating for maintenance and consistency."
  },

  cutwise: {
    split: "40 / 35 / 25",
    note:
      "Protein / Carbs / Fat. Higher protein with controlled carbs for cutting."
  },

  gainwise: {
    split: "40 / 40 / 20",
    note:
      "Protein / Carbs / Fat. Higher protein and carbs for muscle growth and recovery."
  }

};
const currentStyle =
  macroStyles[setup.goal] ||
  macroStyles.fuelwise;

if (macroSuggestion) {
  macroSuggestion.textContent =
    currentStyle.split;
}

if (macroStyleNote) {
  macroStyleNote.textContent =
    currentStyle.note;
}

const targets =
  getMacroTargets();

const progress =
  getMacroProgress();

const hasMacroProgress =
  progress.calories > 0 ||
  progress.protein > 0 ||
  progress.carbs > 0 ||
  progress.fats > 0;

if (macroBreakdownCard) {
  macroBreakdownCard.classList.toggle(
    "hidden",
    !hasMacroProgress
  );
}

if (macroTargets) {
  macroTargets.innerHTML = `
    🔥 Calories: ${targets.calories}

    <br><br>

    🥩 Protein: ${targets.protein}g

    <br><br>

    🍞 Carbs: ${targets.carbs}g

    <br><br>

    🥑 Fats: ${targets.fats}g
  `;
}

if (macroProgress) {
  macroProgress.innerHTML = `
    🔥 Calories: ${progress.calories}

    <br><br>

    🥩 Protein: ${progress.protein}g

    <br><br>

    🍞 Carbs: ${progress.carbs}g

    <br><br>

    🥑 Fats: ${progress.fats}g
  `;
}

if (macroBreakdown) {
  macroBreakdown.innerHTML = `
    Current logged totals:<br><br>

    🔥 ${progress.calories} calories<br><br>

    🥩 ${progress.protein}g protein<br><br>

    🍞 ${progress.carbs}g carbs<br><br>

    🥑 ${progress.fats}g fats
  `;
}