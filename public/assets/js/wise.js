const setup =
  JSON.parse(localStorage.getItem("fuelai-setup") || "{}");

const guide =
  setup.guide || "wiseguy";

const wiseFlavor =
  setup.wiseFlavor || "medium";

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

const addWeightBtn =
  document.getElementById("addWeightBtn");

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

/* =========================
   WISE FLAVOR SYSTEM
========================= */

function spice(levels) {
  return levels[wiseFlavor] || levels.medium;
}

function getFlavorIntro() {
  return spice({
    rare:
      "",

    medium:
      "",

    welldone:
      "Ayyy… "
  });
}

function getFlavorCloser() {
  return spice({
    rare:
      "",

    medium:
      " Honestly.",

    welldone:
      " You’re alright."
  });
}

/* =========================
   MAIN RENDER
========================= */

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

    Weekly Weight:
    ${summary.today?.latestWeight
      ? `${summary.today.latestWeight} lbs`
      : "Not logged"}

    <br><br>

    90-day days tracked:
    ${summary.totalDays || 0}
  `;

  wiseAdvice.textContent =
    getAdvice(summary);
}

/* =========================
   DAILY ADVICE
========================= */

function getAdvice(summary) {

  const goal =
    setup.goal || "fuelwise";

  if (summary.todayCount === 0) {

    return spice({
      rare:
        `${getGuideName()} says: Start simple today. Log water, scan a meal, or mark training if you move.`,

      medium:
        `${getGuideName()} says: Start simple today. Log water, scan a meal, or mark training if you move. No need to overdo it.`,

      welldone:
        `${getGuideName()} says: Ayyy… start simple today. Little water, little food scan, little movement. Don’t make this complicated.`
    });
  }

  if (summary.waterToday < 32) {

    return spice({
      rare:
        `${getGuideName()} says: Hydration could use some attention today. Add water before overthinking food.`,

      medium:
        `${getGuideName()} says: Hydration could use some attention today. Add water before overthinking food. Easy fix.`,

      welldone:
        `${getGuideName()} says: Ayyy… drink some water before we start spiraling about macros over here.`
    });
  }

  if (goal === "cutwise") {

    return spice({
      rare:
        `${getGuideName()} says: Stay steady. Keep meals lighter and avoid panic choices.`,

      medium:
        `${getGuideName()} says: Stay steady. Keep meals lighter and avoid panic choices. One meal doesn’t ruin anything.`,

      welldone:
        `${getGuideName()} says: Relax. One heavy meal ain’t the end of civilization. Just clean the next one up a little.`
    });
  }

  if (goal === "gainwise") {

    return spice({
      rare:
        `${getGuideName()} says: Fuel matters today. If you trained, make sure intake supports recovery.`,

      medium:
        `${getGuideName()} says: Fuel matters today. If you trained, don’t under-eat and wonder why recovery feels rough.`,

      welldone:
        `${getGuideName()} says: You trained? Then eat like somebody who trained. Don’t scare the calories away now.`
    });
  }

  return spice({
    rare:
      `${getGuideName()} says: Keep it balanced. Stay aware and consistent.`,

    medium:
      `${getGuideName()} says: Keep it balanced. Nothing needs to be perfect — just stay aware.`,

    welldone:
      `${getGuideName()} says: You’re good. Keep it balanced and stop overthinking every bite of food.`
  });
}

/* =========================
   CHAT REPLIES
========================= */

function generateWiseReply(question, summary) {

  const lower =
    question.toLowerCase();

  if (lower.includes("water")) {

    if (summary.waterToday < 32) {

      return spice({
        rare:
          `${getGuideName()} says: Hydration could use some attention today.`,

        medium:
          `${getGuideName()} says: Hydration could use some attention today. Add water first before overthinking food.`,

        welldone:
          `${getGuideName()} says: Ayyy… water first. Everybody always wants to skip the easy fix.`
      });
    }

    return spice({
      rare:
        `${getGuideName()} says: Hydration looks solid today.`,

      medium:
        `${getGuideName()} says: Hydration looks pretty solid today.`,

      welldone:
        `${getGuideName()} says: Hydration’s lookin’ pretty solid today honestly.`
    });
  }

  if (
    lower.includes("cut") ||
    lower.includes("lose")
  ) {

    return spice({
      rare:
        `${getGuideName()} says: Stay steady. Consistency matters.`,

      medium:
        `${getGuideName()} says: Stay steady. Consistency matters more than panic restriction.`,

      welldone:
        `${getGuideName()} says: Don’t go full maniac trying to cut overnight. Steady wins here.`
    });
  }

  if (
    lower.includes("gain") ||
    lower.includes("muscle")
  ) {

    return spice({
      rare:
        `${getGuideName()} says: Fuel and recovery matter.`,

      medium:
        `${getGuideName()} says: Fuel and recovery matter. Make sure intake supports training.`,

      welldone:
        `${getGuideName()} says: If you wanna grow, ya gotta eat a little. We can’t build muscle outta thin air.`
    });
  }

  if (
    lower.includes("eat") ||
    lower.includes("food")
  ) {

    return spice({
      rare:
        `${getGuideName()} says: Keep meals balanced and practical.`,

      medium:
        `${getGuideName()} says: Keep meals practical and balanced. Nothing needs to be perfect.`,

      welldone:
        `${getGuideName()} says: Relax. You don’t need the perfect meal. Just don’t go completely off the rails.`
    });
  }

  if (
    lower.includes("weight") ||
    lower.includes("scale")
  ) {

    return spice({
      rare:
        `${getGuideName()} says: Treat weight as a long-term trend.`,

      medium:
        `${getGuideName()} says: Treat weight as a weekly trend, not a daily judgment.`,

      welldone:
        `${getGuideName()} says: One weird scale day ain’t a tragedy. Human bodies do weird stuff sometimes.`
    });
  }

  return spice({
    rare:
      `${getGuideName()} says: Stay aware and consistent today.`,

    medium:
      `${getGuideName()} says: Stay aware, stay consistent, and avoid overthinking today.`,

    welldone:
      `${getGuideName()} says: Ayyy… breathe a little. You’re probably overthinking this right now.`
  });
}

/* =========================
   QUICK ACTIONS
========================= */

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

if (addWeightBtn) {
  addWeightBtn.addEventListener("click", () => {

    const current =
      prompt("Enter current weight");

    if (!current) {
      return;
    }

    window.FuelAILog.addFuelLog({
      type: "weight",
      weight: Number(current),
      source: "manual"
    });

    renderWise();
  });
}

/* =========================
   CHAT
========================= */

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

    wiseChatInput.value = "";
  });
}

renderWise();