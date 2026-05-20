const setup =
  JSON.parse(localStorage.getItem("fuelai-setup") || "{}");

const guide =
  setup.guide || "wiseguy";

const wiseTitle =
  document.getElementById("wiseTitle");

const wiseSub =
  document.getElementById("wiseSub");

const planOutput =
  document.getElementById("planOutput");

const todayOutput =
  document.getElementById("todayOutput");

const wiseAdvice =
  document.getElementById("wiseAdvice");

const addWaterBtn =
  document.getElementById("addWaterBtn");

const addTrainingBtn =
  document.getElementById("addTrainingBtn");

function getGuideName() {
  return guide === "wisegal" ? "WiseGalAI" : "WiseGuyAI";
}

function getPlanName(goal) {
  if (goal === "cutwise") return "CutWise — Cut";
  if (goal === "gainwise") return "GainWise — Gain";
  return "FuelWise — Maintain";
}

function renderWise() {
  const summary = window.FuelAILog.getFuelSummary();

  wiseTitle.textContent = getGuideName();

  wiseSub.textContent =
    "Your daily food, water, and training check-in.";

  planOutput.innerHTML = `
    ${getPlanName(setup.goal)}
    <br><br>
    Activity: ${setup.activityLevel || "not set"}
  `;

  todayOutput.innerHTML = `
    Calories logged: ${summary.caloriesToday || 0}
    <br><br>
    Water logged: ${summary.waterToday || 0} cups
    <br><br>
    Training: ${summary.trainingToday ? "Logged" : "Not logged"}
  `;

  wiseAdvice.textContent = getAdvice(summary);
}

function getAdvice(summary) {
  const goal = setup.goal || "fuelwise";

  if (summary.todayCount === 0) {
    return `${getGuideName()} says: Start simple today. Log water, scan a meal, or mark training if you move.`;
  }

  if (summary.waterToday < 4) {
    return `${getGuideName()} says: Hydration looks low today. Add water before worrying about perfect food.`;
  }

  if (goal === "cutwise") {
    return `${getGuideName()} says: Stay steady. Keep meals lighter, drink water, and avoid panic choices.`;
  }

  if (goal === "gainwise") {
    return `${getGuideName()} says: Fuel matters today. If you trained, make sure you are not under-eating.`;
  }

  return `${getGuideName()} says: Keep it balanced. Nothing needs to be perfect — just stay aware.`;
}

addWaterBtn.addEventListener("click", () => {
  window.FuelAILog.addFuelLog({
    type: "water",
    water: 1
  });

  renderWise();
});

addTrainingBtn.addEventListener("click", () => {
  window.FuelAILog.addFuelLog({
    type: "training",
    intensity: "moderate"
  });

  renderWise();
});

renderWise();