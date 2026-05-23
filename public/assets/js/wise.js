const setup =
  JSON.parse(localStorage.getItem("fuelai-setup") || "{}");

const guide =
  setup.guide || "wiseguy";

  const flavor =
  setup.wiseFlavor || "sweetspot";

const flavorOdds = {
  sweetspot: 0.15,
  toughguy: 0.30,
  mafia: 0.35,
  internet: 0.40
};
const useFlavor =
  Math.random() <
  (flavorOdds[flavor] || 0.15);

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

const characterFace =
  document.getElementById("characterFace");

if (wiseChatInput && characterFace) {

  wiseChatInput.addEventListener(
    "focus",
    () => {

      characterFace.classList.add(
        "is-listening"
      );

    }
  );

  wiseChatInput.addEventListener(
    "blur",
    () => {

      characterFace.classList.remove(
        "is-listening"
      );

    }
  );

}

const wiseChatReply =
  document.getElementById("wiseChatReply");

const wiseChatLabel =
  document.getElementById("wiseChatLabel");

const goalTargetOutput =
  document.getElementById("goalTargetOutput");

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


function getGoalTargets() {

  const weight =
    Number(setup.weight || 0);

  if (!weight) {
    return {
      calories: "Set weight in setup",
      protein: "Set weight in setup"
    };
  }

  let lowCal = weight * 13;
  let highCal = weight * 15;

  if (setup.goal === "cutwise") {

    lowCal = weight * 10;
    highCal = weight * 12;

  }

  if (setup.goal === "gainwise") {

    lowCal = weight * 15;
    highCal = weight * 17;

  }

  const lowProtein =
    Math.round(weight * 0.7);

  const highProtein =
    Math.round(weight * 1.0);

  return {
    calories:
      `${Math.round(lowCal)}–${Math.round(highCal)} calories`,

    protein:
      `${lowProtein}–${highProtein}g protein`
  };

}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
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
if (goalTargetOutput) {

  const targets =
    getGoalTargets();

  goalTargetOutput.innerHTML = `
    Calories:
    ${targets.calories}

    <br><br>

   🥩  Protein:
    ${targets.protein}
  `;

}
todayOutput.innerHTML = `
 🔥 Calories logged:
  ${summary.caloriesToday || 0}

 <br><br>

 🥩 Protein logged:
  ${summary.proteinToday || 0}g

 <br><br>

 💧 Water logged:
  ${summary.waterToday || 0} oz

 <br><br>

 🏋️ Training:
  ${summary.trainingToday ? "Logged" : "Not logged"}

 <br><br>

 ⚖️ Daily Weight Log:
 ${
   summary.today?.latestWeight
     ? `${summary.today.latestWeight} lbs`
     : "Not logged"
 }

 <br><br>

 📅 90-day days tracked:
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
characterFace?.classList.remove(
  "state-alert",
  "state-calm",
  "state-focused"
);

if (summary.waterToday < 32) {

  characterFace?.classList.add(
    "state-alert"
  );

}

else if (summary.trainingToday) {

  characterFace?.classList.add(
    "state-focused"
  );

}

else {

  characterFace?.classList.add(
    "state-calm"
  );

}
  wiseAdvice.textContent =
    getAdvice(summary);
}
function getFlavorLine(lines) {

  if (!useFlavor) {
    return lines.sweetspot;
  }

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

function getAdvice(summary) {
  const goal =
    setup.goal || "fuelwise";

  if (summary.todayCount === 0) {
    if (goal === "cutwise") {
      return getFlavorLine({
        sweetspot:
          "Start simple today. Water first, then keep meals steady and controlled.",
        toughguy:
          "Start with the basics. Water, movement, controlled choices.",
        mafia:
          "Water first. Then we keep the food moves nice and clean.",
        internet:
          "Tiny reset. Water first, chaos later."
      });
    }

    if (goal === "gainwise") {
      return getFlavorLine({
        sweetspot:
          "Start simple today. Water, food, and training all matter for recovery.",
        toughguy:
          "Fuel the work. Water, food, training. Start there.",
        mafia:
          "Feed the machine today. Water and real food first.",
        internet:
          "Water + food + movement. Growth needs supplies."
      });
    }

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
        "Stay steady. Keep portions lighter and avoid panic choices.",
      toughguy:
        "Control the easy stuff. Portions, water, consistency.",
      mafia:
        "No panic moves. Keep it lighter and steady.",
      internet:
        "No food spirals today. Keep the next choice clean."
    });
  }

  if (goal === "gainwise") {
    return getFlavorLine({
      sweetspot:
        "Fuel matters today. Make sure recovery matches the work.",
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

  if (
  lastQuestion &&
  lower.includes("what about")
) {

  return getFlavorLine({

    sweetspot:
      "That could work too. The bigger goal is choosing something balanced you can stay consistent with.",

    toughguy:
      "Still solid. Don’t get stuck over-optimizing food choices.",

    mafia:
      "Yeah, that works too. Dinner doesn’t need a committee meeting.",

    internet:
      "Honestly still fine. Your meal doesn’t need patch notes."
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
  lower.includes("chicken") ||
  lower.includes("fish") ||
  lower.includes("salmon") ||
  lower.includes("pork") ||
  lower.includes("protein")
) {

  return getFlavorLine({

    sweetspot:
      "All of those can work. Chicken is simple and reliable, fish is lighter with healthy fats, and lean pork is fine too. Pick the option you’ll enjoy and stay consistent with.",

    toughguy:
      "Protein is protein. Pick the cleaner option you’ll actually eat consistently.",

    mafia:
      "Chicken keeps it simple. Fish is clean. Pork’s fine if the portion isn’t wild. Don’t overcomplicate dinner.",

    internet:
      "Honestly all three can work. Just don’t turn dinner into a full identity crisis."
  });

}





  if (
     lower.includes("snack") ||
  lower.includes("between meal") ||
  lower.includes("hungry") ||
  lower.includes("quick bite")
) 
   {
  return getFlavorLine({
sweetspot:
  "Try something simple: Greek yogurt and berries, apple with peanut butter, turkey roll-ups, eggs and toast, or a shake and banana.",
    toughguy:
      "Snack smart: protein first, then fruit or carbs. Greek yogurt, eggs, turkey roll-ups, or a shake and banana. Simple.",
    mafia:
      "Keep the snack useful. Protein plus something steady: yogurt and berries, turkey roll-ups, eggs, or a shake with a banana.",
    internet:
      "Snack formula: protein + something useful. Yogurt berries, apple peanut butter, eggs toast, shake banana. Easy win."
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

  if (
  lower.includes("alien") ||
  lower.includes("spaceship")
) {

  return getFlavorLine({
    sweetspot:
      "Probably hard to explore galaxies while dehydrated.",

    toughguy:
      "Even astronauts need water.",

    mafia:
      "Space is cold. Bring snacks.",

    internet:
      "Intergalactic hydration matters."
  });

}

if (
  lower.includes("batman") ||
  lower.includes("superhero")
) {

  return getFlavorLine({
    sweetspot:
      "Batman definitely meal preps.",

    toughguy:
      "Recovery is the real superpower.",

    mafia:
      "No way Batman skips protein.",

    internet:
      "Bruce Wayne definitely tracks macros."
  });

}

if (
  lower.includes("zombie")
) {

  return getFlavorLine({
    sweetspot:
      "Surviving zombies probably requires decent recovery meals.",

    toughguy:
      "Cardio suddenly matters a lot more.",

    mafia:
      "We’re grabbing water before the apocalypse starts.",

    internet:
      "Honestly? Zombies would hate hydrated people."
  });

}

if (
  lower.includes("alien") ||
  lower.includes("spaceship") ||
  lower.includes("zombie") ||
  lower.includes("batman") ||
  lower.includes("superhero") ||
  lower.includes("skibidi") ||
  lower.includes("rizz")
) {

  return getFlavorLine({
    sweetspot:
      "That feels slightly outside the nutrition department.",

    toughguy:
      "I respect the creativity. Still drink water.",

    mafia:
      "Listen… I’m trying to help you survive lunch first.",

    internet:
      "That question has powerful side-quest energy."
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
    characterFace?.classList.add(
  "is-thinking"
);

    const summary =
      window.FuelAILog.getFuelSummary();

wiseChatReply.textContent =
  "Thinking...";

setTimeout(() => {

  wiseChatReply.textContent =
    generateWiseReply(question, summary);

  characterFace?.classList.remove(
    "is-thinking"
  );

}, 900 + Math.random() * 700);

  lastQuestion = question;
  wiseChatInput.value = "";
  });
}
/* =========================
   CHARACTER FACE
========================= */
const currentGuide =
  setup.wiseFlavor || "sweetspot";

const currentAvatar =
  setup.gender || setup.genderType || "male";

const guideConfig =
  window.GUIDES?.[currentGuide] ||
  window.GUIDES?.sweetspot;

if (guideConfig) {

  document.documentElement.style.setProperty(
    "--guide-color",
    guideConfig.color
  );

}

const guideImage =
  document.getElementById("guideImage");

if (guideImage && guideConfig) {

guideImage.src =
  currentAvatar === "female"
    ? (guideConfig.female || guideConfig.male)
    : (guideConfig.male || guideConfig.female);
}
renderWise();