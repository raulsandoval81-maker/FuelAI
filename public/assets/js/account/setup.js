const saveSetupBtn =
  document.getElementById(
    "saveSetupBtn"
  );

const heightInput =
  document.getElementById(
    "heightInput"
  );

const weightInput =
  document.getElementById(
    "weightInput"
  );

const targetWeightInput =
  document.getElementById(
    "targetWeightInput"
  );

const ageRange =
  document.getElementById(
    "ageRange"
  );

const genderType =
  document.getElementById(
    "genderType"
  );

const activityLevel =
  document.getElementById(
    "activityLevel"
  );

const goalSelect =
  document.getElementById(
    "goalSelect"
  );

const lifestyleType =
  document.getElementById(
    "lifestyleType"
  );

const combatStyle =
  document.getElementById(
    "combatStyle"
  );

const rangeOutput =
  document.getElementById(
    "rangeOutput"
  );

const nicknameInput =
  document.getElementById(
    "nicknameInput"
  );

const foodStyle =
  document.getElementById(
    "foodStyle"
  );

const foodAvoid =
  document.getElementById(
    "foodAvoid"
  );

const resetSetupBtn =
  document.getElementById(
    "resetSetupBtn"
  );


const WEEKLY_FOCUS_BY_GOAL = {

  fuelwise:
    "Steady Energy Week",

  cutwise:
    "Simple Cut Week",

  gainwise:
    "Build and Recover Week"

};


function getSavedSetup() {

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


function renderSetupButtons() {

  const hasSetup =
    Boolean(
      localStorage.getItem(
        "fuelai-setup"
      )
    );


  if (
    resetSetupBtn
  ) {

    resetSetupBtn.style.display =
      hasSetup
        ? "block"
        : "none";

  }


  if (
    saveSetupBtn
  ) {

    saveSetupBtn.textContent =
      hasSetup
        ? "Save Changes →"
        : "Start FuelAI →";

  }

}


function getActivityText() {

  const labels = {

    "1-2":
      "1–2 days per week",

    "2-3":
      "2–3 days per week",

    "4-5":
      "4–5 days per week",

    "6plus":
      "6+ days per week",

    "6-plus":
      "6+ days per week"

  };


  return (
    labels[
      activityLevel?.value
    ] ||
    "Not selected"
  );

}


function getLifestyleText() {

  const labels = {

    "general-health":
      "General Health",

    "fitness-enthusiast":
      "Fitness Enthusiast",

    "combat-athlete":
      "Combat Athlete"

  };


  return (
    labels[
      lifestyleType?.value
    ] ||
    "General Health"
  );

}


function getCombatStyleText() {

  if (
    !combatStyle ||
    lifestyleType?.value !==
      "combat-athlete"
  ) {

    return "Not applicable";

  }


  const labels = {

    grappling:
      "Grappling Sports",

    striking:
      "Striking Sports",

    mma:
      "MMA / Mixed Combat"

  };


  return (
    labels[
      combatStyle.value
    ] ||
    "Not selected"
  );

}


function getGoalText() {

  const labels = {

    fuelwise:
      "Maintain / Balance",

    cutwise:
      "Lean Out",

    gainwise:
      "Build / Recover"

  };


  return (
    labels[
      goalSelect?.value
    ] ||
    "Maintain / Balance"
  );

}


function updateGuidance() {

  if (
    !rangeOutput
  ) {
    return;
  }


  const height =
    heightInput
      ?.value
      .trim();

  const weight =
    Number.parseFloat(
      weightInput?.value
    );

  const targetWeight =
    Number.parseFloat(
      targetWeightInput?.value
    );


  if (
    !height ||
    !Number.isFinite(weight) ||
    weight <= 0
  ) {

    rangeOutput.textContent =
      "Enter height and weight";

    return;
  }


  const targetText =
    Number.isFinite(targetWeight) &&
    targetWeight > 0
      ? `${targetWeight} lbs`
      : "Not set";


  rangeOutput.innerHTML = `
    Current weight:<br>
    ${weight} lbs

    <br><br>

    Target weight:<br>
    ${targetText}

    <br><br>

    Activity:<br>
    ${getActivityText()}

    <br><br>

    Profile:<br>
    ${getLifestyleText()}

    ${
      lifestyleType?.value ===
      "combat-athlete"
        ? `
          <br><br>

          Combat style:<br>
          ${getCombatStyleText()}
        `
        : ""
    }

    <br><br>

    Direction:<br>
    ${getGoalText()}
  `;

}
function syncCombatStyleVisibility() {

  if (
    !combatStyle
  ) {
    return;
  }


  const isCombat =
    lifestyleType?.value ===
    "combat-athlete";


  combatStyle.classList.toggle(
    "hidden",
    !isCombat
  );


  if (
    !isCombat
  ) {

    combatStyle.value =
      "";

  }

}


function loadSavedSetup() {

  const saved =
    getSavedSetup();


  if (
    nicknameInput
  ) {
    nicknameInput.value =
      saved.nickname ||
      "";
  }


  if (
    heightInput
  ) {
    heightInput.value =
      saved.height ||
      "";
  }


  if (
    weightInput
  ) {
    weightInput.value =
      saved.weight ||
      "";
  }


  if (
    targetWeightInput
  ) {
    targetWeightInput.value =
      saved.targetWeight ||
      "";
  }


  if (
    ageRange
  ) {
    ageRange.value =
      saved.ageRange ||
      "13-18";
  }


  if (
    genderType
  ) {
    genderType.value =
      saved.gender ||
      "";
  }


  if (
    activityLevel
  ) {
    activityLevel.value =
      saved.activityLevel ||
      "2-3";
  }


  if (
    goalSelect
  ) {
    goalSelect.value =
      saved.goal ||
      "fuelwise";
  }


  if (
    lifestyleType
  ) {
    lifestyleType.value =
      saved.lifestyleType ||
      "general-health";
  }


  if (
    combatStyle
  ) {
    combatStyle.value =
      saved.combatStyle ||
      "";
  }


  if (
    foodStyle
  ) {
    foodStyle.value =
      saved.foodStyle ||
      "none";
  }


  if (
    foodAvoid
  ) {
    foodAvoid.value =
      saved.foodAvoid ||
      "";
  }


  syncCombatStyleVisibility();

}


function saveSetup() {

  const previous =
    getSavedSetup();


  const goal =
    goalSelect?.value ||
    "fuelwise";


  const weeklyFocus =
    WEEKLY_FOCUS_BY_GOAL[
      goal
    ] ||
    "Steady Energy Week";


  const setup = {

    ...previous,

    nickname:
      nicknameInput
        ?.value
        .trim() ||
      "",

    height:
      heightInput
        ?.value
        .trim() ||
      "",

    weight:
      weightInput
        ?.value
        .trim() ||
      "",

    targetWeight:
      targetWeightInput
        ?.value
        .trim() ||
      "",

    ageRange:
      ageRange?.value ||
      "13-18",

    gender:
      genderType?.value ||
      "",

    activityLevel:
      activityLevel?.value ||
      "2-3",

    goal,

    lifestyleType:
      lifestyleType?.value ||
      "general-health",

    combatStyle:
      lifestyleType?.value ===
        "combat-athlete"
        ? (
            combatStyle?.value ||
            ""
          )
        : "",

    foodStyle:
      foodStyle?.value ||
      "none",

    foodAvoid:
      foodAvoid
        ?.value
        .trim() ||
      "",

    guide:
      genderType?.value ===
        "female"
        ? "wisegal"
        : "wiseguy",

    monthlyPlan:
      goal,

    weeklyFocus

  };


  localStorage.setItem(
    "fuelai-setup",
    JSON.stringify(
      setup
    )
  );


  renderSetupButtons();


  window.location.href =
    "/tools/trackwise/";

}


function resetSetup() {

  localStorage.removeItem(
    "fuelai-setup"
  );


  if (
    nicknameInput
  ) {
    nicknameInput.value =
      "";
  }


  if (
    heightInput
  ) {
    heightInput.value =
      "";
  }


  if (
    weightInput
  ) {
    weightInput.value =
      "";
  }


  if (
    targetWeightInput
  ) {
    targetWeightInput.value =
      "";
  }


  if (
    ageRange
  ) {
    ageRange.value =
      "13-18";
  }


  if (
    genderType
  ) {
    genderType.value =
      "";
  }


  if (
    activityLevel
  ) {
    activityLevel.value =
      "2-3";
  }


  if (
    goalSelect
  ) {
    goalSelect.value =
      "fuelwise";
  }


  if (
    lifestyleType
  ) {
    lifestyleType.value =
      "general-health";
  }


  if (
    combatStyle
  ) {
    combatStyle.value =
      "";
  }


  if (
    foodStyle
  ) {
    foodStyle.value =
      "none";
  }


  if (
    foodAvoid
  ) {
    foodAvoid.value =
      "";
  }


  syncCombatStyleVisibility();

  renderSetupButtons();

  updateGuidance();


  if (
    rangeOutput
  ) {

    rangeOutput.textContent =
      "Setup reset. Enter height and weight.";

  }

}


saveSetupBtn
  ?.addEventListener(
    "click",
    saveSetup
  );


resetSetupBtn
  ?.addEventListener(
    "click",
    resetSetup
  );


heightInput
  ?.addEventListener(
    "input",
    updateGuidance
  );


weightInput
  ?.addEventListener(
    "input",
    updateGuidance
  );


targetWeightInput
  ?.addEventListener(
    "input",
    updateGuidance
  );


ageRange
  ?.addEventListener(
    "change",
    updateGuidance
  );


genderType
  ?.addEventListener(
    "change",
    updateGuidance
  );


activityLevel
  ?.addEventListener(
    "change",
    updateGuidance
  );


goalSelect
  ?.addEventListener(
    "change",
    updateGuidance
  );


lifestyleType
  ?.addEventListener(
    "change",
    () => {

      syncCombatStyleVisibility();

      updateGuidance();

    }
  );


combatStyle
  ?.addEventListener(
    "change",
    updateGuidance
  );


foodStyle
  ?.addEventListener(
    "change",
    updateGuidance
  );


foodAvoid
  ?.addEventListener(
    "input",
    updateGuidance
  );


loadSavedSetup();

renderSetupButtons();

updateGuidance();