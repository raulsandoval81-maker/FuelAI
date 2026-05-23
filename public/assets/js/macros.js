const macroTargets =
  document.getElementById("macroTargets");

const macroProgress =
  document.getElementById("macroProgress");

const setup =
  JSON.parse(
    localStorage.getItem("fuelai-setup") || "{}"
  );

const scans =
  JSON.parse(
    localStorage.getItem("fuelai-history") || "[]"
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

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fats = 0;

  scans.forEach(scan => {

    calories +=
      Number(scan.calories || 0);

    protein +=
      Number(scan.protein || 0);

    carbs +=
      Number(scan.carbs || 0);

    fats +=
      Number(scan.fats || 0);

  });

  return {
    calories,
    protein,
    carbs,
    fats
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