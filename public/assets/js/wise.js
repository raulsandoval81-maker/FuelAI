const setup =
  JSON.parse(localStorage.getItem("fuelai-setup") || "{}");

const guide =
  setup.guide || "wiseguy";

const flavor =
  setup.wiseFlavor || "sweetspot";

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

  const wiseChatLabel =
  document.getElementById("wiseChatLabel");

if (window.FuelAILog) {
  window.FuelAILog.syncDailyLogs();
}

function getGuideName() {
  return guide === "wisegal"
    ? "WiseGal"
    : "WiseGuy";
}


function getPlanName(goal) {
  if (goal === "cutwise") return "CutWise — Cut";
  if (goal === "gainwise") return "GainWise — Gain";
  return "FuelWise — Maintain";
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

function getFlavorLine(lines) {

  if (flavor === "toughguy") {
    return lines.toughguy;
  }

  if (flavor === "mafia") {
    return lines.mafia;
  }

  if (flavor === "internet") {
    return lines.internet;
  }

  return lines.sweetspot;

}

function hasTrainingToday() {
  return window.FuelAILog
    .getTodayLogs()
    .some((entry) => entry.type === "training");
}

function hasWeightToday() {
  return window.FuelAILog
    .getTodayLogs()
    .some((entry) => entry.type === "weight");
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


Daily Weight Log:
${
  summary.today?.latestWeight
    ? `${summary.today.latestWeight} lbs`
    : "Not logged"
}
    <br><br>

    90-day days tracked:
    ${summary.totalDays || 0}
  `;

  if (addTrainingBtn) {
    addTrainingBtn.classList.toggle(
      "hidden",
      hasTrainingToday()
    );
  }

  if (addWeightBtn) {
    addWeightBtn.classList.toggle(
      "hidden",
      hasWeightToday()
    );
  }

  if (wiseChatLabel) {
  wiseChatLabel.textContent =
    guide === "wisegal"
      ? "WiseGalAI"
      : "WiseGuyAI";
  }

  wiseAdvice.textContent =
    getAdvice(summary);
}

function getAdvice(summary) {
  const goal =
    setup.goal || "fuelwise";

  if (summary.todayCount === 0) {
    return getFlavorLine({
      sweetspot:
        "Start simple today. Log water, scan a meal, or mark training if you move.",
      toughguy:
        "Small actions count. Water, food, movement. Start there.",
      mafia:
        "Let’s keep it simple today. Water first. Chaos later.",
      internet:
        "Tiny reset. Water + food + movement. We move."
    });
  }

  if (summary.waterToday < 32) {
    return getFlavorLine({
      sweetspot:
        "Hydration could use some attention today. Add water before overthinking food.",
      toughguy:
        "You’re probably more dehydrated than tired. Drink water first.",
      mafia:
        "Listen… the body’s asking for water. Let’s handle that first.",
      internet:
        "Low-key dehydrated. Water first."
    });
  }

  if (goal === "cutwise") {
    return getFlavorLine({
      sweetspot:
        "Stay steady. Keep meals lighter and avoid panic choices.",
      toughguy:
        "Consistency beats crash dieting every time.",
      mafia:
        "No panic moves. Nice and steady.",
      internet:
        "No food spirals today. Keep it clean."
    });
  }

  if (goal === "gainwise") {
    return getFlavorLine({
      sweetspot:
        "Fuel matters today. Make sure recovery matches training.",
      toughguy:
        "Training hard without fueling hard makes no sense.",
      mafia:
        "You want growth? Feed the machine.",
      internet:
        "Muscles need snacks too."
    });
  }

  return getFlavorLine({
    sweetspot:
      "Keep it balanced. Nothing needs to be perfect.",
    toughguy:
      "Stay consistent. That’s the whole game.",
    mafia:
      "Nice and steady. We keep moving.",
    internet:
      "Honestly? You’re doing alright."
  });
}

function generateWiseReply(question, summary) {
  const lower =
    question.toLowerCase();

  if (
    lower.includes("what you doing") ||
    lower.includes("what you doin") ||
    lower.includes("what are you doing")
  ) {
    return getFlavorLine({
      sweetspot:
        "Trying to help you eat a little better and overthink a little less.",
      toughguy:
        "Keeping you honest. Food, water, training. Simple.",
      mafia:
        "Making sure you don’t turn one meal into a whole crisis.",
      internet:
        "Trying to keep the food chaos under control."
    });
  }

  if (lower.includes("water")) {
    if (summary.waterToday < 32) {
      return getFlavorLine({
        sweetspot:
          "Hydration could use some attention today. Add water first before overthinking food.",
        toughguy:
          "Water first. You can’t outthink dehydration.",
        mafia:
          "Listen… handle the water first. Easy win.",
        internet:
          "Low-key, water fixes more than people admit."
      });
    }

    return getFlavorLine({
      sweetspot:
        "Hydration looks pretty solid today.",
      toughguy:
        "Hydration is handled. Keep it that way.",
      mafia:
        "Water’s looking alright. We like that.",
      internet:
        "Hydration check passed."
    });
  }

  if (
    lower.includes("cut") ||
    lower.includes("lose")
  ) {
    return getFlavorLine({
      sweetspot:
        "Stay steady. Consistency matters more than panic restriction.",
      toughguy:
        "Don’t crash diet. Stay disciplined.",
      mafia:
        "No panic cuts. We play the long game.",
      internet:
        "Do not spiral. Just tighten the next choice."
    });
  }

  if (
    lower.includes("gain") ||
    lower.includes("muscle")
  ) {
    return getFlavorLine({
      sweetspot:
        "Fuel and recovery matter. Make sure intake supports training.",
      toughguy:
        "If you train hard, you need to eat like it.",
      mafia:
        "You want growth? Feed the machine.",
      internet:
        "Muscles need snacks too. Unfortunately, science."
    });
  }

  if (
    lower.includes("eat") ||
    lower.includes("food")
  ) {
    return getFlavorLine({
      sweetspot:
        "Keep meals practical and balanced. Nothing needs to be perfect.",
      toughguy:
        "Pick a solid meal and move on.",
      mafia:
        "Simple plate. No drama.",
      internet:
        "You don’t need a perfect meal. You need a decent one."
    });
  }

  if (
    lower.includes("weight") ||
    lower.includes("scale")
  ) {
    return getFlavorLine({
      sweetspot:
        "Treat weight as a trend, not a daily judgment.",
      toughguy:
        "One scale check does not define the work.",
      mafia:
        "One weird scale day ain’t the whole story.",
      internet:
        "The scale is noisy. Trends matter."
    });
  }

  return getFlavorLine({
    sweetspot:
      "Stay aware, stay consistent, and avoid overthinking today.",
    toughguy:
      "Keep it simple. Do the basics.",
    mafia:
      "Nice and steady. We keep moving.",
    internet:
      "Breathe. You’re probably overthinking it."
  });
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

if (addWeightBtn) {
  addWeightBtn.addEventListener("click", () => {
    const current =
      prompt("Enter current weight");

    if (!current) return;

    window.FuelAILog.addFuelLog({
      type: "weight",
      weight: Number(current),
      source: "manual"
    });

    renderWise();
  });
}

if (sendWiseChatBtn) {
  sendWiseChatBtn.addEventListener("click", () => {
    const question =
      wiseChatInput.value.trim();

    if (!question) return;

    const summary =
      window.FuelAILog.getFuelSummary();

    wiseChatReply.textContent =
      generateWiseReply(question, summary);

    wiseChatInput.value = "";
  });
}

renderWise();