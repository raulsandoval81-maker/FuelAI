const saveSetupBtn = document.getElementById("saveSetupBtn");

const heightInput = document.getElementById("heightInput");
const weightInput = document.getElementById("weightInput");
const targetWeightInput = document.getElementById("targetWeightInput");
const ageRange = document.getElementById("ageRange");
const genderType = document.getElementById("genderType");
const activityLevel = document.getElementById("activityLevel");
const goalSelect = document.getElementById("goalSelect");
const sportType = document.getElementById("sportType");
const rangeOutput = document.getElementById("rangeOutput");
const nicknameInput = document.getElementById("nicknameInput");
const foodStyle = document.getElementById("foodStyle");

const foodAvoid = document.getElementById("foodAvoid");
const resetSetupBtn = document.getElementById("resetSetupBtn");


function renderSetupButtons() {

  const hasSetup =
    !!localStorage.getItem(
      "fuelai-setup"
    );

  if (resetSetupBtn) {

    resetSetupBtn.style.display =
      hasSetup
        ? "block"
        : "none";
  }

  if (saveSetupBtn) {

    saveSetupBtn.textContent =
      "Approve Setup";
  }

}

const WEEKLY_FOCUS_BY_GOAL = {
  fuelwise: "Steady Energy Week",
  cutwise: "Simple Cut Week",
  gainwise: "Build and Recover Week"
};



function getActivityText() {

  const labels = {

    low:
      "Not selected",

    "0-1":
      "0–1 days per week",

    "2-3":
      "2–3 days per week",

    "4-5":
      "4–5 days per week",

    "6plus":
      "6+ days per week"
  };

  return (
    labels[activityLevel.value] ||
    labels.low
  );
}

function getSportText() {

  if (!sportType) {
    return "General Fitness / Lifestyle";
  }

  const labels = {
    general:
      "General Fitness / Lifestyle",

    wrestling:
      "Wrestling",

    mma:
      "MMA",

    boxing:
      "Boxing",

    basketball:
      "Basketball",

    football:
      "Football",

    running:
      "Running"
  };

  return (
    labels[sportType.value] ||
    labels.general
  );
}

function updateGuidance() {

  const height =
    heightInput.value.trim();

  const weight =
    parseInt(weightInput.value, 10);

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

  if (
    goalSelect.value === "cutwise"
  ) {
    direction =
      "Gradual Cut";
  }

  if (
    goalSelect.value === "gainwise"
  ) {
    direction =
      "Gradual Gain";
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

    Sport / activity:<br>
    ${getSportText()}

    <br><br>

    Direction:<br>
    ${direction}

  `;
}

function loadSavedSetup() {

  const saved =
    JSON.parse(
      localStorage.getItem("fuelai-setup") || "{}"
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

  if (sportType) {
    sportType.value =
      saved.sportType || "general";
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



if (saveSetupBtn) {

  saveSetupBtn.addEventListener(
    "click",
    () => {


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


        sportType:
  sportType?.value ||
  "general",

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
        "/hub.html";
    }
  );
}
if (resetSetupBtn) {
  resetSetupBtn.addEventListener("click", () => {
    localStorage.removeItem("fuelai-setup");
    renderSetupButtons();

    nicknameInput.value = "";
    heightInput.value = "";
    weightInput.value = "";
    targetWeightInput.value = "";
    ageRange.value = "13-18";
    genderType.value = "";
    activityLevel.value = "low";
    goalSelect.value = "fuelwise";

    if (sportType) {
      sportType.value = "general";
    }


    if (foodStyle) {
      foodStyle.value = "none";
    }

    if (foodAvoid) {
      foodAvoid.value = "";
    }

    updateGuidance();

    rangeOutput.textContent =
      "Setup reset. Enter height and weight.";
  });
}
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

sportType?.addEventListener(
  "change",
  updateGuidance
);

loadSavedSetup();
renderSetupButtons();
