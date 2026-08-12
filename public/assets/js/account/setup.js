const saveSetupBtn =
  document.getElementById("saveSetupBtn");

const heightInput =
  document.getElementById("heightInput");

const weightInput =
  document.getElementById("weightInput");

const targetWeightInput =
  document.getElementById("targetWeightInput");

const ageRange =
  document.getElementById("ageRange");

const genderType =
  document.getElementById("genderType");

const activityLevel =
  document.getElementById("activityLevel");

const goalSelect =
  document.getElementById("goalSelect");

const membershipType =
  document.getElementById("membershipType");

const lifestyleType =
  document.getElementById("lifestyleType");

const combatStyle =
  document.getElementById("combatStyle");

const rangeOutput =
  document.getElementById("rangeOutput");

const nicknameInput =
  document.getElementById("nicknameInput");

const foodStyle =
  document.getElementById("foodStyle");

const foodAvoid =
  document.getElementById("foodAvoid");

const resetSetupBtn =
  document.getElementById("resetSetupBtn");

const WEEKLY_FOCUS_BY_GOAL = {
  fuelwise:
    "Steady Energy Week",

  cutwise:
    "Simple Cut Week",

  gainwise:
    "Build and Recover Week"
};

function normalizeMembership(value) {

  if (value === "basic") {
    return "standard";
  }

  return value || "free";
}

function renderSetupButtons() {

  const hasSetup =
    !!localStorage.getItem("fuelai-setup");

  if (resetSetupBtn) {
    resetSetupBtn.style.display =
      hasSetup ? "block" : "none";
  }

  if (saveSetupBtn) {
    saveSetupBtn.textContent =
      "Approve Setup";
  }
}

function getActivityText() {

  const labels = {
    low:
      "Not selected",

    "0-1":
      "0–1 days per week",

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
    labels[activityLevel?.value] ||
    labels.low
  );
}

function getLifestyleText() {

  if (!lifestyleType) {
    return "General Health";
  }

  const labels = {
    "general-health":
      "General Health",

    "general-fitness":
      "General Fitness",

    "sports-athlete":
      "Sports Athlete",

    "combat-athlete":
      "Combat Athlete"
  };

  return (
    labels[lifestyleType.value] ||
    "General Health"
  );
}

function getCombatStyleText() {

  if (
    !combatStyle ||
    combatStyle.classList.contains("hidden")
  ) {
    return "Not selected";
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
    labels[combatStyle.value] ||
    "Not selected"
  );
}

function getMembershipText() {

  const labels = {
    free:
      "Free",

    standard:
      "Standard",

    plus:
      "Plus"
  };

  return (
    labels[
      normalizeMembership(membershipType?.value)
    ] ||
    "Free"
  );
}

function updateGuidance() {

  const height =
    heightInput?.value.trim();

  const weight =
    parseInt(
      weightInput?.value,
      10
    );

  if (!height || !weight) {

    rangeOutput.textContent =
      "Enter height and weight";

    return;
  }

  const low =
    weight - 10;

  const high =
    weight + 10;

  let direction =
    "Maintain";

  if (goalSelect?.value === "cutwise") {
    direction = "Gradual Cut";
  }

  if (goalSelect?.value === "gainwise") {
    direction = "Gradual Gain";
  }

  rangeOutput.innerHTML = `

    General range:<br>
    ${low}–${high} lbs

    <br><br>

    Current weight:<br>
    ${weight} lbs

    <br><br>

    Training:<br>
    ${getActivityText()}

    <br><br>

    Lifestyle:<br>
    ${getLifestyleText()}

    <br><br>

    Membership:<br>
    ${getMembershipText()}

    <br><br>

    Combat style:<br>
    ${getCombatStyleText()}

    <br><br>

    Direction:<br>
    ${direction}

  `;
}

function loadSavedSetup() {

  const saved =
    JSON.parse(
      localStorage.getItem("fuelai-setup") ||
      "{}"
    );

  nicknameInput.value =
    saved.nickname || "";

  heightInput.value =
    saved.height || "";

  weightInput.value =
    saved.weight || "";

  targetWeightInput.value =
    saved.targetWeight || "";

  ageRange.value =
    saved.ageRange || "13-18";

  genderType.value =
    saved.gender || "";

  activityLevel.value =
    saved.activityLevel || "2-3";

  goalSelect.value =
    saved.goal || "fuelwise";

  if (lifestyleType) {
    lifestyleType.value =
      saved.lifestyleType ||
      "general-health";
  }

  if (membershipType) {
    membershipType.value =
      normalizeMembership(
        saved.membership
      );
  }

  if (combatStyle) {

    combatStyle.value =
      saved.combatStyle || "";

    if (
      lifestyleType?.value ===
      "combat-athlete"
    ) {
      combatStyle.classList.remove("hidden");
    } else {
      combatStyle.classList.add("hidden");
    }
  }

  if (foodStyle) {
    foodStyle.value =
      saved.foodStyle || "none";
  }

  if (foodAvoid) {
    foodAvoid.value =
      saved.foodAvoid || "";
  }
}

function saveSetup() {

  const goal =
    goalSelect?.value ||
    "fuelwise";

  const weeklyFocus =
    WEEKLY_FOCUS_BY_GOAL[goal] ||
    "Steady Energy Week";

  const setup = {
    nickname:
      nicknameInput.value.trim(),

    height:
      heightInput.value.trim(),

    weight:
      weightInput.value.trim(),

    targetWeight:
      targetWeightInput.value.trim(),

    ageRange:
      ageRange.value,

    gender:
      genderType.value,

    activityLevel:
      activityLevel.value,

    goal,

    lifestyleType:
      lifestyleType?.value ||
      "general-health",

    membership:
      normalizeMembership(
        membershipType?.value
      ),

    combatStyle:
      combatStyle?.value ||
      "",

    foodStyle:
      foodStyle?.value ||
      "none",

    foodAvoid:
      foodAvoid?.value.trim() ||
      "",

    guide:
      genderType.value === "female"
        ? "wisegal"
        : "wiseguy",

    monthlyPlan:
      goal,

    weeklyFocus
  };

  localStorage.setItem(
    "fuelai-setup",
    JSON.stringify(setup)
  );

  renderSetupButtons();

  window.location.href =
    "/hub/";
}

function resetSetup() {

  localStorage.removeItem("fuelai-setup");

  renderSetupButtons();

  nicknameInput.value = "";
  heightInput.value = "";
  weightInput.value = "";
  targetWeightInput.value = "";

  ageRange.value =
    "13-18";

  genderType.value =
    "";

  activityLevel.value =
    "low";

  goalSelect.value =
    "fuelwise";

  if (lifestyleType) {
    lifestyleType.value =
      "general-health";
  }

  if (membershipType) {
    membershipType.value =
      "free";
  }

  if (combatStyle) {
    combatStyle.value =
      "";

    combatStyle.classList.add("hidden");
  }

  if (foodStyle) {
    foodStyle.value =
      "none";
  }

  if (foodAvoid) {
    foodAvoid.value =
      "";
  }

  updateGuidance();

  rangeOutput.textContent =
    "Setup reset. Enter height and weight.";
}

saveSetupBtn?.addEventListener(
  "click",
  saveSetup
);

resetSetupBtn?.addEventListener(
  "click",
  resetSetup
);

heightInput?.addEventListener(
  "input",
  updateGuidance
);

weightInput?.addEventListener(
  "input",
  updateGuidance
);

targetWeightInput?.addEventListener(
  "input",
  updateGuidance
);

ageRange?.addEventListener(
  "change",
  updateGuidance
);

genderType?.addEventListener(
  "change",
  updateGuidance
);

activityLevel?.addEventListener(
  "change",
  updateGuidance
);

goalSelect?.addEventListener(
  "change",
  updateGuidance
);

membershipType?.addEventListener(
  "change",
  updateGuidance
);

lifestyleType?.addEventListener(
  "change",
  () => {

    if (
      lifestyleType.value ===
      "combat-athlete"
    ) {
      combatStyle?.classList.remove("hidden");
    } else {
      combatStyle?.classList.add("hidden");

      if (combatStyle) {
        combatStyle.value = "";
      }
    }

    updateGuidance();
  }
);

combatStyle?.addEventListener(
  "change",
  updateGuidance
);

loadSavedSetup();
renderSetupButtons();
updateGuidance();