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

const macroTargetProgress =
  document.getElementById("macroTargetProgress");

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
    calories: Math.round(calories),
    protein: Math.round(weight * proteinMultiplier),
    carbs: Math.round(weight * carbMultiplier),
    fats: Math.round(weight * fatMultiplier)
  };
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

  let split = {
    protein: 35,
    carbs: 40,
    fats: 25
  };

  if (setup.goal === "cutwise") {
    calories =
      weight * 11;

    split = {
      protein: 40,
      carbs: 35,
      fats: 25
    };
  }

  if (setup.goal === "gainwise") {
    calories =
      weight * 16;

    split = {
      protein: 40,
      carbs: 40,
      fats: 20
    };
  }

  return {
    calories:
      Math.round(calories),

    protein:
      Math.round(
        (calories * (split.protein / 100)) / 4
      ),

    carbs:
      Math.round(
        (calories * (split.carbs / 100)) / 4
      ),

    fats:
      Math.round(
        (calories * (split.fats / 100)) / 9
      )
  };
}

function percent(current, target) {
  if (!target) return 0;

  return Math.min(
    100,
    Math.round((current / target) * 100)
  );
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

if (macroBreakdown) {
  macroBreakdown.innerHTML = `
    Current logged totals:<br><br>

    <div class="macro-row">
      <span>🔥 Calories</span>
      <strong>${percent(progress.calories, targets.calories)}%</strong>
    </div>

    <div class="macro-row">
      <span>🥩 Protein</span>
      <strong>${percent(progress.protein, targets.protein)}%</strong>
    </div>

    <div class="macro-row">
      <span>🍞 Carbs</span>
      <strong>${percent(progress.carbs, targets.carbs)}%</strong>
    </div>

    <div class="macro-row">
      <span>🥑 Fats</span>
      <strong>${percent(progress.fats, targets.fats)}%</strong>
    </div>
  `;
}

if (macroTargetProgress) {
  macroTargetProgress.innerHTML = `
    <div class="macro-row">
      <span>🔥 Calories</span>
      <strong>${progress.calories} / ${targets.calories}</strong>
    </div>

    <div class="macro-row">
      <span>🥩 Protein</span>
      <strong>${progress.protein}g / ${targets.protein}g</strong>
    </div>

    <div class="macro-row">
      <span>🍞 Carbs</span>
      <strong>${progress.carbs}g / ${targets.carbs}g</strong>
    </div>

    <div class="macro-row">
      <span>🥑 Fats</span>
      <strong>${progress.fats}g / ${targets.fats}g</strong>
    </div>
  `;
}