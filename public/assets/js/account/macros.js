const macroTargets =
  document.getElementById("macroTargets");

const macroProgress =
  document.getElementById("macroProgress");

const macroStyleOutput =
  document.getElementById("macroStyleOutput");

const setup =
  JSON.parse(
    localStorage.getItem("fuelai-setup") || "{}"
  );

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

  if (setup.goal === "cutwise") {
    calories = weight * 11;
  }

  if (setup.goal === "gainwise") {
    calories = weight * 16;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(weight * 0.9),
    carbs: Math.round(weight * 1.5),
    fats: Math.round(weight * 0.35)
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
    calories: summary.caloriesToday || 0,
    protein: summary.proteinToday || 0,
    carbs: summary.carbsToday || 0,
    fats: summary.fatsToday || 0
  };
}

const macroStyles = {
  fuelwise: `
FuelWise

Balanced nutrition for energy and consistency.

Approx Macro Split: 40 / 30 / 30
  `,

  cutwise: `
CutWise

Higher protein and controlled portions.

Approx Macro Split: 35 / 40 / 25
  `,

  gainwise: `
GainWise

Recovery-focused meals with added carbs.

Approx Macro Split: 45 / 30 / 25
  `
};

if (macroStyleOutput) {
  macroStyleOutput.textContent =
    macroStyles[setup.goal] ||
    macroStyles.fuelwise;
}

const targets =
  getMacroTargets();

const progress =
  getMacroProgress();

  const macroBreakdownCard =
  document.getElementById(
    "macroBreakdownCard"
  );

if (
  progress.calories > 0 ||
  progress.protein > 0 ||
  progress.carbs > 0 ||
  progress.fats > 0
) {

  macroBreakdownCard
    ?.classList.remove("hidden");

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