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

const wiseChatInput =
  document.getElementById("wiseChatInput");

const sendWiseChatBtn =
  document.getElementById("sendWiseChatBtn");

const wiseChatReply =
  document.getElementById("wiseChatReply");

if (window.FuelAILog) {
  window.FuelAILog.syncDailyLogs();
}

function getGuideName() {
  return guide === "wisegal"
    ? "WiseGalAI"
    : "WiseGuyAI";
}

function getPlanName(goal) {
  if (goal === "cutwise") {
    return "CutWise — Cut";
  }

  if (goal === "gainwise") {
    return "GainWise — Gain";
  }

  return "FuelWise — Maintain";
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function renderWise() {

  if (!window.FuelAILog) {

    wiseAdvice.textContent =
      "Log system not loaded.";

    return;
  }

  const summary =
    window.FuelAILog.getFuelSummary();

  wiseTitle.textContent =
    getGuideName();

  wiseSub.textContent =
    `${getGreeting()}. Your daily food, water, and training check-in.`;

  planOutput.innerHTML = `
    ${getPlanName(setup.goal)}

    <br><br>

    Activity:
    ${setup.activityLevel || "not set"}
  `;

  todayOutput.innerHTML = `
    Calories logged:
    ${summary.caloriesToday || 0}

    <br><br>

    Water logged:
    ${summary.waterToday || 0} oz

    <br><br>

    Training:
    ${summary.trainingToday ? "Logged" : "Not logged"}

    <br><br>

    90-day days tracked:
    ${summary.totalDays || 0}
  `;

  wiseAdvice.textContent =
    getAdvice(summary);
}

function getAdvice(summary) {

  const goal =
    setup.goal || "fuelwise";

  if (summary.todayCount === 0) {

    return `${getGuideName()} says: Start simple today. Log water, scan a meal, or mark training if you move.`;
  }

  if (summary.waterToday < 32) {

    return `${getGuideName()} says: Hydration could use some attention today. Add water before overthinking food.`;
  }

  if (goal === "cutwise") {

    return `${getGuideName()} says: Stay steady. Keep meals lighter, drink water, and avoid panic choices.`;
  }

  if (goal === "gainwise") {

    return `${getGuideName()} says: Fuel matters today. If you trained, make sure you are not under-eating.`;
  }

  return `${getGuideName()} says: Keep it balanced. Nothing needs to be perfect — just stay aware.`;
}

function generateWiseReply(question, summary) {

  const lower =
    question.toLowerCase();

  if (lower.includes("water")) {

    if (summary.waterToday < 32) {

      return `${getGuideName()} says: Hydration could use some attention today. Add water first before overthinking food.`;
    }

    return `${getGuideName()} says: Hydration looks pretty solid today.`;
  }

  if (
    lower.includes("cut") ||
    lower.includes("lose")
  ) {

    return `${getGuideName()} says: Stay steady. Consistency matters more than panic restriction.`;
  }

  if (
    lower.includes("gain") ||
    lower.includes("muscle")
  ) {

    return `${getGuideName()} says: Fuel and recovery matter. Make sure intake supports training.`;
  }

  if (
    lower.includes("eat") ||
    lower.includes("food")
  ) {

    return `${getGuideName()} says: Keep meals practical and balanced. Nothing needs to be perfect.`;
  }

  return `${getGuideName()} says: Stay aware, stay consistent, and avoid overthinking today.`;
}

if (addWaterBtn) {

  addWaterBtn.addEventListener("click", () => {

    window.FuelAILog.addFuelLog({
      type: "water",
      water: 8
    });

    renderWise();

  });

}

if (addTrainingBtn) {

  addTrainingBtn.addEventListener("click", () => {

    window.FuelAILog.addFuelLog({
      type: "training",
      sessions: 1,
      caloriesBurned: 0,
      source: "manual"
    });

    renderWise();

  });

}

if (sendWiseChatBtn) {

  sendWiseChatBtn.addEventListener("click", () => {

    const question =
      wiseChatInput.value.trim();

    if (!question) {
      return;
    }

    const summary =
      window.FuelAILog.getFuelSummary();

    wiseChatReply.textContent =
      generateWiseReply(question, summary);

  });

}

renderWise();