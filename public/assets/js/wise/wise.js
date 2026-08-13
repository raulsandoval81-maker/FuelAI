"use strict";


/* =========================
   SETUP
========================= */

function getWiseSetup() {
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


const setup =
  getWiseSetup();

const flavor =
  setup.wiseFlavor ||
  setup.coachStyle ||
  "sweetspot";

const flavorOdds = {
  sweetspot: 0.15,
  toughguy: 0.30,
  mafia: 0.35,
  internet: 0.40
};

let lastQuestion = "";



/* =========================
   DOM
========================= */

const wiseTitle =
  document.getElementById(
    "wiseTitle"
  );

const wiseSub =
  document.getElementById(
    "wiseSub"
  );

const planOutput =
  document.getElementById(
    "planOutput"
  );

const todayOutput =
  document.getElementById(
    "todayOutput"
  );

const wiseAdvice =
  document.getElementById(
    "wiseAdvice"
  );

const goalTargetOutput =
  document.getElementById(
    "goalTargetOutput"
  );

const addWaterBtn =
  document.getElementById(
    "addWaterBtn"
  );

const addTrainingBtn =
  document.getElementById(
    "addTrainingBtn"
  );

const addWeightBtn =
  document.getElementById(
    "addWeightBtn"
  );

const wiseChatInput =
  document.getElementById(
    "wiseChatInput"
  );

const wiseChatReply =
  document.getElementById(
    "wiseChatReply"
  );

const wiseChatLabel =
  document.getElementById(
    "wiseChatLabel"
  );

const sendWiseChatBtn =
  document.getElementById(
    "sendWiseChatBtn"
  );

const characterFace =
  document.getElementById(
    "characterFace"
  );

const guideImage =
  document.getElementById(
    "guideImage"
  );



/* =========================
   LOG SYNC
========================= */

if (
  window.FuelAILog
    ?.syncDailyLogs
) {
  window.FuelAILog
    .syncDailyLogs();
}



/* =========================
   CHARACTER INTERACTION
========================= */

if (
  wiseChatInput &&
  characterFace
) {
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



/* =========================
   BASIC HELPERS
========================= */

function getCoachName() {
  return "Coach Wright";
}


function getPlanName(goal) {

  if (
    goal === "cutwise"
  ) {
    return "CutWise — Lean Out";
  }

  if (
    goal === "gainwise"
  ) {
    return "GainWise — Build / Recover";
  }

  return "FuelWise — Maintain / Balance";
}


function getActivityLabel() {

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
      setup.activityLevel
    ] ||
    "Not set"
  );
}


function getGreeting() {

  const hour =
    new Date().getHours();

  if (
    hour < 12
  ) {
    return "Good morning";
  }

  if (
    hour < 18
  ) {
    return "Good afternoon";
  }

  return "Good evening";
}



/* =========================
   GOAL TARGETS
========================= */

function getGoalTargets() {

  const weight =
    Number(
      setup.weight ||
      0
    );


  if (
    !weight
  ) {
    return {
      calories:
        "Set weight in setup",

      protein:
        "Set weight in setup"
    };
  }


  let lowCal =
    weight * 13;

  let highCal =
    weight * 15;


  if (
    setup.goal ===
    "cutwise"
  ) {
    lowCal =
      weight * 10;

    highCal =
      weight * 12;
  }


  if (
    setup.goal ===
    "gainwise"
  ) {
    lowCal =
      weight * 15;

    highCal =
      weight * 17;
  }


  const lowProtein =
    Math.round(
      weight * 0.7
    );

  const highProtein =
    Math.round(
      weight * 1.0
    );


  return {
    calories:
      `${Math.round(lowCal)}–${Math.round(highCal)} calories`,

    protein:
      `${lowProtein}–${highProtein}g protein`
  };
}



/* =========================
   LOG HELPERS
========================= */

function getTodayLogs() {

  if (
    !window.FuelAILog
      ?.getTodayLogs
  ) {
    return [];
  }

  return (
    window.FuelAILog
      .getTodayLogs()
  );
}


function hasTrainingToday() {

  return getTodayLogs()
    .some(
      (entry) =>
        entry.type ===
        "training"
    );
}


function hasWeightToday() {

  return getTodayLogs()
    .some(
      (entry) =>
        entry.type ===
        "weight"
    );
}



/* =========================
   FLAVOR
========================= */

function shouldUseFlavor() {

  const odds =
    flavorOdds[
      flavor
    ] ??
    flavorOdds.sweetspot;

  return (
    Math.random() <
    odds
  );
}


function getFlavorLine(
  lines
) {

  if (
    !shouldUseFlavor()
  ) {
    return (
      lines.sweetspot
    );
  }


  if (
    flavor ===
    "toughguy"
  ) {
    return (
      lines.toughguy ||
      lines.sweetspot
    );
  }


  if (
    flavor ===
    "mafia"
  ) {
    return (
      lines.mafia ||
      lines.sweetspot
    );
  }


  if (
    flavor ===
    "internet"
  ) {
    return (
      lines.internet ||
      lines.sweetspot
    );
  }


  return (
    lines.sweetspot
  );
}



/* =========================
   DAILY ADVICE
========================= */

function getAdvice(
  summary
) {

  const goal =
    setup.goal ||
    "fuelwise";


  if (
    summary.todayCount ===
    0
  ) {

    if (
      goal ===
      "cutwise"
    ) {
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


    if (
      goal ===
      "gainwise"
    ) {
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


  if (
    Number(
      summary.waterToday ||
      0
    ) <
    32
  ) {
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


  if (
    goal ===
    "cutwise"
  ) {
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


  if (
    goal ===
    "gainwise"
  ) {
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
      "You’re doing alright. Keep the basics moving."
  });
}



/* =========================
   RENDER
========================= */

function renderWise() {

  if (
    !window.FuelAILog
      ?.getFuelSummary
  ) {

    if (
      wiseAdvice
    ) {
      wiseAdvice.textContent =
        "Log system not loaded.";
    }

    return;
  }


  const summary =
    window.FuelAILog
      .getFuelSummary();


  if (
    wiseTitle
  ) {
    wiseTitle.textContent =
      getCoachName();
  }


  if (
    wiseSub
  ) {
    wiseSub.textContent =
      `${getGreeting()}. Let’s look at your food, hydration, training, and recovery.`;
  }


  if (
    planOutput
  ) {
    planOutput.innerHTML = `
      ${getPlanName(
        setup.goal
      )}

      <br><br>

      Activity:
      ${getActivityLabel()}
    `;
  }


  if (
    goalTargetOutput
  ) {

    const targets =
      getGoalTargets();

    goalTargetOutput.innerHTML = `
      Calories:
      ${targets.calories}

      <br><br>

      🥩 Protein:
      ${targets.protein}
    `;
  }


  /*
   * Optional legacy hook.
   * Safe if older Wise HTML still
   * contains todayOutput.
   */

  if (
    todayOutput
  ) {

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
      ${
        summary.trainingToday
          ? "Logged"
          : "Not logged"
      }

      <br><br>

      ⚖️ Daily Weight Log:
      ${
        summary.today?.latestWeight
          ? "Logged"
          : "Not logged"
      }
    `;
  }


  if (
    addTrainingBtn
  ) {
    addTrainingBtn
      .classList
      .toggle(
        "hidden",
        hasTrainingToday()
      );
  }


  if (
    addWeightBtn
  ) {
    addWeightBtn
      .classList
      .toggle(
        "hidden",
        hasWeightToday()
      );
  }


  if (
    wiseChatLabel
  ) {
    wiseChatLabel.textContent =
      "Coach Wright";
  }


  characterFace
    ?.classList
    .remove(
      "state-alert",
      "state-calm",
      "state-focused"
    );


  if (
    Number(
      summary.waterToday ||
      0
    ) <
    32
  ) {

    characterFace
      ?.classList
      .add(
        "state-alert"
      );

  } else if (
    summary.trainingToday
  ) {

    characterFace
      ?.classList
      .add(
        "state-focused"
      );

  } else {

    characterFace
      ?.classList
      .add(
        "state-calm"
      );

  }


  if (
    wiseAdvice
  ) {
    wiseAdvice.textContent =
      getAdvice(
        summary
      );
  }
}



/* =========================
   CHAT
========================= */

function generateWiseReply(
  question,
  summary
) {

  const lower =
    question
      .toLowerCase()
      .trim();


  /*
   * FOLLOW-UP CONTEXT
   */

  if (
    lastQuestion &&
    (
      lower.startsWith(
        "what about"
      ) ||
      lower === "and that?" ||
      lower === "how about that?"
    )
  ) {

    return getFlavorLine({
      sweetspot:
        "That could work too. The bigger goal is choosing something useful you can stay consistent with.",

      toughguy:
        "Still solid. Don’t get stuck over-optimizing the choice.",

      mafia:
        "Yeah, that works too. This doesn’t need a committee meeting.",

      internet:
        "Still fine. The decision doesn’t need patch notes."
    });

  }


  /*
   * CASUAL
   */

  if (
    lower.includes(
      "what you doing"
    ) ||
    lower.includes(
      "what you doin"
    ) ||
    lower.includes(
      "what are you doing"
    )
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


  /*
   * WATER
   */

  if (
    lower.includes(
      "water"
    ) ||
    lower.includes(
      "hydration"
    )
  ) {

    if (
      Number(
        summary.waterToday ||
        0
      ) <
      32
    ) {

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


  /*
   * CUT
   */

  if (
    lower.includes(
      "cut"
    ) ||
    lower.includes(
      "lose"
    ) ||
    lower.includes(
      "lean out"
    )
  ) {

    return getFlavorLine({
      sweetspot:
        "Stay steady. Consistency matters more than panic restriction.",

      toughguy:
        "Don’t crash diet. Stay disciplined with the basics.",

      mafia:
        "No panic cuts. We play the long game.",

      internet:
        "Do not spiral. Just tighten the next choice."
    });

  }


  /*
   * GAIN
   */

  if (
    lower.includes(
      "gain"
    ) ||
    lower.includes(
      "muscle"
    ) ||
    lower.includes(
      "bulk"
    )
  ) {

    return getFlavorLine({
      sweetspot:
        "Fuel and recovery matter. Make sure intake supports the training you’re doing.",

      toughguy:
        "If you train hard, you need to fuel the work.",

      mafia:
        "You want growth? Feed the machine.",

      internet:
        "Muscles need supplies too. Unfortunately, science."
    });

  }


  /*
   * PROTEIN SOURCES
   */

  if (
    lower.includes(
      "chicken"
    ) ||
    lower.includes(
      "fish"
    ) ||
    lower.includes(
      "salmon"
    ) ||
    lower.includes(
      "pork"
    ) ||
    lower.includes(
      "protein"
    )
  ) {

    return getFlavorLine({
      sweetspot:
        "All of those can work. Chicken is simple and reliable, fish can add healthy fats, and lean pork can work too. Pick something you enjoy and can stay consistent with.",

      toughguy:
        "Pick a solid protein source you’ll actually eat consistently.",

      mafia:
        "Chicken keeps it simple. Fish is solid. Lean pork works too. Don’t overcomplicate dinner.",

      internet:
        "All three can work. Dinner does not need an identity crisis."
    });

  }


  /*
   * SNACKS
   */

  if (
    lower.includes(
      "snack"
    ) ||
    lower.includes(
      "between meal"
    ) ||
    lower.includes(
      "hungry"
    ) ||
    lower.includes(
      "quick bite"
    )
  ) {

    return getFlavorLine({
      sweetspot:
        "Try something simple: Greek yogurt and berries, apple with peanut butter, turkey roll-ups, eggs and toast, or a shake and banana.",

      toughguy:
        "Snack smart: protein first, then fruit or carbs. Yogurt, eggs, turkey, or a shake and banana.",

      mafia:
        "Keep the snack useful. Protein plus something steady: yogurt and berries, turkey, eggs, or a shake with a banana.",

      internet:
        "Snack formula: protein + something useful. Easy win."
    });

  }


  /*
   * GENERAL FOOD
   */

  if (
    lower.includes(
      "eat"
    ) ||
    lower.includes(
      "food"
    ) ||
    lower.includes(
      "meal"
    )
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


  /*
   * SCALE / WEIGHT
   */

  if (
    lower.includes(
      "weight"
    ) ||
    lower.includes(
      "scale"
    )
  ) {

    return getFlavorLine({
      sweetspot:
        "Treat body weight as a trend, not a daily judgment.",

      toughguy:
        "One scale check does not define the work.",

      mafia:
        "One weird scale day isn’t the whole story.",

      internet:
        "The scale is noisy. Trends matter."
    });

  }


  /*
   * SIDE QUESTS
   */

  if (
    lower.includes(
      "alien"
    ) ||
    lower.includes(
      "spaceship"
    )
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
    lower.includes(
      "batman"
    ) ||
    lower.includes(
      "superhero"
    )
  ) {

    return getFlavorLine({
      sweetspot:
        "Batman definitely has a recovery plan.",

      toughguy:
        "Recovery is the real superpower.",

      mafia:
        "No way Batman skips protein.",

      internet:
        "Bruce Wayne definitely tracks something."
    });

  }


  if (
    lower.includes(
      "zombie"
    )
  ) {

    return getFlavorLine({
      sweetspot:
        "Surviving zombies probably requires decent recovery meals.",

      toughguy:
        "Cardio suddenly matters a lot more.",

      mafia:
        "We’re grabbing water before the apocalypse starts.",

      internet:
        "Zombie survival still needs hydration."
    });

  }


  if (
    lower.includes(
      "skibidi"
    ) ||
    lower.includes(
      "rizz"
    )
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


  /*
   * DEFAULT
   */

  return getFlavorLine({
    sweetspot:
      "Stay aware, stay consistent, and keep the next decision simple.",

    toughguy:
      "Keep it simple. Do the basics.",

    mafia:
      "Nice and steady. We keep moving.",

    internet:
      "You’re probably overthinking it. Pick the next useful move."
  });
}



/* =========================
   QUICK LOG ACTIONS
========================= */

addWaterBtn
  ?.addEventListener(
    "click",
    () => {

      if (
        !window.FuelAILog
          ?.addFuelLog
      ) {
        return;
      }


      window.FuelAILog
        .addFuelLog({
          type:
            "water",

          water:
            8,

          source:
            "wise"
        });


      renderWise();

    }
  );


addTrainingBtn
  ?.addEventListener(
    "click",
    () => {

      if (
        !window.FuelAILog
          ?.addFuelLog
      ) {
        return;
      }


      window.FuelAILog
        .addFuelLog({
          type:
            "training",

          sessions:
            1,

          caloriesBurned:
            0,

          source:
            "wise"
        });


      renderWise();

    }
  );


addWeightBtn
  ?.addEventListener(
    "click",
    () => {

      if (
        !window.FuelAILog
          ?.addFuelLog
      ) {
        return;
      }


      const current =
        prompt(
          "Enter current weight"
        );


      if (
        !current
      ) {
        return;
      }


      const weight =
        Number(
          current
        );


      if (
        !Number.isFinite(
          weight
        ) ||
        weight <= 0
      ) {
        return;
      }


      window.FuelAILog
        .addFuelLog({
          type:
            "weight",

          weight,

          source:
            "wise"
        });


      renderWise();

    }
  );



/* =========================
   CHAT ACTION
========================= */

sendWiseChatBtn
  ?.addEventListener(
    "click",
    () => {

      const question =
        wiseChatInput
          ?.value
          .trim();


      if (
        !question ||
        !window.FuelAILog
          ?.getFuelSummary
      ) {
        return;
      }


      const summary =
        window.FuelAILog
          .getFuelSummary();


      characterFace
        ?.classList
        .add(
          "is-thinking"
        );


      if (
        wiseChatReply
      ) {
        wiseChatReply.textContent =
          "Thinking...";
      }


      const previousQuestion =
        lastQuestion;

      lastQuestion =
        question;


      setTimeout(
        () => {

          /*
           * generateWiseReply uses
           * lastQuestion for follow-ups.
           * Temporarily restore the
           * previous question as context.
           */

          const currentQuestion =
            lastQuestion;

          lastQuestion =
            previousQuestion;


          const reply =
            generateWiseReply(
              question,
              summary
            );


          lastQuestion =
            currentQuestion;


          if (
            wiseChatReply
          ) {
            wiseChatReply.textContent =
              reply;
          }


          characterFace
            ?.classList
            .remove(
              "is-thinking"
            );

        },

        900 +
        Math.random() *
        700
      );


      if (
        wiseChatInput
      ) {
        wiseChatInput.value =
          "";
      }

    }
  );



/* =========================
   CHARACTER
========================= */

const currentCoachStyle =
  setup.wiseFlavor ||
  setup.coachStyle ||
  "sweetspot";

const currentAvatar =
  setup.gender ||
  setup.genderType ||
  "male";


const coachStyleConfig =
  window.GUIDES?.[
    currentCoachStyle
  ] ||
  window.GUIDES
    ?.sweetspot;


if (
  coachStyleConfig
) {

  document
    .documentElement
    .style
    .setProperty(
      "--guide-color",
      coachStyleConfig.color
    );

}


if (
  guideImage &&
  coachStyleConfig
) {

  const imagePath =
    currentAvatar ===
    "female"
      ? (
          coachStyleConfig.female ||
          coachStyleConfig.male
        )
      : (
          coachStyleConfig.male ||
          coachStyleConfig.female
        );


  if (
    imagePath
  ) {

    guideImage.onload =
      () => {

        guideImage
          .classList
          .add(
            "loaded"
          );

      };


    guideImage.onerror =
      () => {

        console.error(
          "Guide image failed:",
          imagePath
        );

      };


    guideImage.src =
      imagePath;

  }

}



/* =========================
   START
========================= */

renderWise();