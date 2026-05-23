const macroTargets =
  document.getElementById("macroTargets");

const macroProgress =
  document.getElementById("macroProgress");

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

  const protein =
    Math.round(weight * 0.9);

  const carbs =
    Math.round(weight * 1.5);

  const fats =
    Math.round(weight * 0.35);

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fats
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

const targets =
  getMacroTargets();

const progress =
  getMacroProgress();

if (macroTargets) {

  macroTargets.innerHTML = `
    🔥 Calories:
    ${targets.calories}

    <br><br>

    🥩 Protein:
    ${targets.protein}g

    <br><br>

    🍞 Carbs:
    ${targets.carbs}g

    <br><br>

    🥑 Fats:
    ${targets.fats}g
  `;

}

if (macroProgress) {

  macroProgress.innerHTML = `
    🔥 Calories:
    ${progress.calories}

    <br><br>

    🥩 Protein:
    ${progress.protein}g

    <br><br>

    🍞 Carbs:
    ${progress.carbs}g

    <br><br>

    🥑 Fats:
    ${progress.fats}g
  `;

}