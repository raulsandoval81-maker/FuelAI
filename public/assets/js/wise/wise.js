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


const profile =
  setup.lifestyleType ||
  "general-health";


const combatStyle =
  setup.combatStyle ||
  "";


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


let lastQuestion =
  "";



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
   PROFILE HELPERS
========================= */

function getProfileLabel() {

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
      profile
    ] ||
    "General Health"
  );

}


function isFitnessProfile() {

  return (
    profile ===
      "fitness-enthusiast" ||
    profile ===
      "combat-athlete"
  );

}


function isCombatProfile() {

  return (
    profile ===
    "combat-athlete"
  );

}


function getCombatStyleLabel() {

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
      combatStyle
    ] ||
    "Combat Training"
  );

}



/* =========================
   BASIC HELPERS
========================= */

function getCoachName() {
  return "Coach Wise";
}


function getPlanName(
  goal
) {

  if (
    goal ===
    "cutwise"
  ) {
    return (
      "CutWise — Lean Out"
    );
  }


  if (
    goal ===
    "gainwise"
  ) {
    return (
      "GainWise — Build / Recover"
    );
  }


  return (
    "FuelWise — Maintain / Balance"
  );

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
    new Date()
      .getHours();


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


function getProfileIntro() {

  if (
    isCombatProfile()
  ) {

    return (
      `${getGreeting()}. Let’s look at your fuel, hydration, training, recovery, and combat workload.`
    );

  }


  if (
    isFitnessProfile()
  ) {

    return (
      `${getGreeting()}. Let’s look at your training, food, hydration, and recovery.`
    );

  }


  return (
    `${getGreeting()}. Let’s look at your food, hydration, recovery, and daily habits.`
  );

}



/* =========================
   GOAL TARGETS
========================= */

function getGoalTargets() {

  const summary =
    window.FuelAILog
      ?.getFuelSummary?.() ||
    {};


  if (
    summary.caloriesTarget ||
    summary.proteinTarget
  ) {

    return {

      calories:
        summary.caloriesTarget
          ? `${summary.caloriesTarget} calories`
          : "Not set",

      protein:
        summary.proteinTarget
          ? `${summary.proteinTarget}g protein`
          : "Not set"

    };

  }


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


  let calories =
    weight * 14;


  if (
    setup.goal ===
    "cutwise"
  ) {
    calories =
      weight * 11;
  }


  if (
    setup.goal ===
    "gainwise"
  ) {
    calories =
      weight * 16;
  }


  return {

    calories:
      `${Math.round(
        calories
      )} calories`,

    protein:
      `${Math.round(
        weight * 0.8
      )}g protein`

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


  return (
    lines[
      flavor
    ] ||
    lines.sweetspot
  );

}



/* =========================
   PROFILE DAILY ADVICE
========================= */

function getGeneralAdvice(
  summary
) {

  if (
    summary.todayCount ===
    0
  ) {

    return getFlavorLine({

      sweetspot:
        "Start simple today. Log a meal, drink some water, or complete your check-in.",

      toughguy:
        "Do the basics first. Food, water, consistency.",

      mafia:
        "Keep it simple today. Handle one useful thing at a time.",

      internet:
        "Tiny move first. No need to optimize the entire day."

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
        "Hydration is still light today. Add some water and keep the next decision simple.",

      toughguy:
        "Water is an easy box to check. Handle it.",

      mafia:
        "Let’s get some water in before we complicate anything else.",

      internet:
        "Hydration is the easy win right now."

    });

  }


  return getFlavorLine({

    sweetspot:
      "Keep the day balanced. Consistency matters more than perfection.",

    toughguy:
      "Stay consistent with the basics.",

    mafia:
      "Nice and steady. Keep moving.",

    internet:
      "The basics are moving. Keep them moving."

  });

}


function getFitnessAdvice(
  summary
) {

  if (
    summary.todayCount ===
    0
  ) {

    return getFlavorLine({

      sweetspot:
        "Start with recovery basics, then decide what today’s training actually needs.",

      toughguy:
        "Check recovery before chasing another hard session.",

      mafia:
        "Before we pile on more work, let’s see what the body has given us today.",

      internet:
        "Training plan first. Hero mode later."

    });

  }


  if (
    summary.sleepHours > 0 &&
    summary.sleepHours < 6
  ) {

    return getFlavorLine({

      sweetspot:
        "Sleep was light. Keep today’s training and recovery decisions measured.",

      toughguy:
        "Bad sleep is data. Adjust instead of pretending it isn’t there.",

      mafia:
        "Rough sleep changes the day. No need to force a perfect workout.",

      internet:
        "Sleep score says maybe don’t audition for beast mode today."

    });

  }


  if (
    summary.trainingToday
  ) {

    return getFlavorLine({

      sweetspot:
        "Training is logged. Shift attention toward fluids, food, and recovery.",

      toughguy:
        "Work is done. Now recover like the session mattered.",

      mafia:
        "Training is handled. Now take care of the recovery side.",

      internet:
        "Workout complete. Recovery DLC unlocked."

    });

  }


  return getFlavorLine({

    sweetspot:
      "Check how recovered you feel, then choose a training effort that fits the day.",

    toughguy:
      "Train with purpose, not just because the calendar says so.",

    mafia:
      "Make today’s training useful. More isn’t automatically better.",

    internet:
      "Useful training beats random suffering."

  });

}


function getCombatAdvice(
  summary
) {

  if (
    summary.todayCount ===
    0
  ) {

    return getFlavorLine({

      sweetspot:
        `Start with the basics for ${getCombatStyleLabel()}: hydration, fuel, recovery, and a clear training plan.`,

      toughguy:
        "Combat training punishes sloppy basics. Handle hydration and recovery first.",

      mafia:
        "Fight training gets complicated fast. Keep the fundamentals clean.",

      internet:
        "Combat athlete mode: hydrate first, chaos second."

    });

  }


  if (
    summary.sleepHours > 0 &&
    summary.sleepHours < 6
  ) {

    return getFlavorLine({

      sweetspot:
        "Recovery is light today. Factor that into the quality and intensity of combat training.",

      toughguy:
        "Poor recovery plus hard combat work is not automatically toughness.",

      mafia:
        "Bad sleep changes the room today. Train smart.",

      internet:
        "Your nervous system did not subscribe to unlimited rounds."

    });

  }


  if (
    setup.goal ===
    "cutwise"
  ) {

    return getFlavorLine({

      sweetspot:
        "Keep weight management gradual and separate it from panic decisions around training.",

      toughguy:
        "Don’t turn making weight into random restriction.",

      mafia:
        "No panic weight moves. Stay with the plan.",

      internet:
        "Scale drama does not get to rewrite the whole day."

    });

  }


  if (
    summary.trainingToday
  ) {

    return getFlavorLine({

      sweetspot:
        "Combat training is logged. Recovery, fluids, and enough food now matter for the next session.",

      toughguy:
        "Rounds are done. Recovery is part of training too.",

      mafia:
        "Work is handled. Now make sure tomorrow doesn’t pay for today.",

      internet:
        "Training complete. Recover before requesting another boss fight."

    });

  }


  return getFlavorLine({

    sweetspot:
      `For ${getCombatStyleLabel()}, keep today's training decision connected to recovery, fuel, and your larger plan.`,

    toughguy:
      "Train hard when hard training makes sense. Train smart when it doesn’t.",

    mafia:
      "Make the session useful. We’re not collecting suffering for points.",

    internet:
      "Combat athletes still have recovery bars."

  });

}


function getAdvice(
  summary
) {

  if (
    isCombatProfile()
  ) {
    return getCombatAdvice(
      summary
    );
  }


  if (
    isFitnessProfile()
  ) {
    return getFitnessAdvice(
      summary
    );
  }


  return getGeneralAdvice(
    summary
  );

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
      getProfileIntro();

  }


  if (
    planOutput
  ) {

    const planName =
      getPlanName(
        setup.goal
      );

    const planParts =
      planName.split("—");

    const planLabel =
      planParts[0]?.trim() ||
      planName;

    const planDirection =
      planParts.slice(1)
        .join("—")
        .trim();

    planOutput.innerHTML = `
      <ul class="direction-details">

        <li>
          <strong>${planLabel}:</strong>
          ${planDirection}
        </li>

        <li>
          <strong>Profile:</strong>
          ${getProfileLabel()}
        </li>

        <li>
          <strong>Activity:</strong>
          ${getActivityLabel()}
        </li>

        ${
          isCombatProfile()
            ? `
              <li>
                <strong>Combat:</strong>
                ${getCombatStyleLabel()}
              </li>
            `
            : ""
        }

      </ul>
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

      😴 Sleep:
      ${
        summary.sleepHours
          ? `${summary.sleepHours} hrs`
          : "Not logged"
      }

      <br><br>

      ⚖️ Weight:
      ${
        summary.today?.latestWeight
          ? `${summary.today.latestWeight} lbs`
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
      "Coach Wise";

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

  }

  else if (
    summary.trainingToday
  ) {

    characterFace
      ?.classList
      .add(
        "state-focused"
      );

  }

  else {

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
   CHAT HELPERS
========================= */

function getProfileDefaultReply() {

  if (
    isCombatProfile()
  ) {

    return getFlavorLine({

      sweetspot:
        `Keep the next decision connected to ${getCombatStyleLabel()}, recovery, fuel, and the bigger training plan.`,

      toughguy:
        "Keep the combat work purposeful. Basics first.",

      mafia:
        "Stay with the plan. We don’t need random fight-camp decisions.",

      internet:
        "Combat mode still runs on boring basics."

    });

  }


  if (
    isFitnessProfile()
  ) {

    return getFlavorLine({

      sweetspot:
        "Connect the next decision to training quality, recovery, and consistency.",

      toughguy:
        "Train with purpose and recover with purpose.",

      mafia:
        "Useful work. Useful recovery. Keep moving.",

      internet:
        "Fitness progress loves boring consistency."

    });

  }


  return getFlavorLine({

    sweetspot:
      "Stay aware, stay consistent, and keep the next decision simple.",

    toughguy:
      "Keep it simple. Do the basics.",

    mafia:
      "Nice and steady. We keep moving.",

    internet:
      "Pick the next useful move."

  });

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
   * FOLLOW-UP
   */

  if (
    lastQuestion &&
    (
      lower.startsWith(
        "what about"
      ) ||
      lower ===
        "and that?" ||
      lower ===
        "how about that?"
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
   * RECOVERY / TIRED
   */

  if (
    lower.includes(
      "tired"
    ) ||
    lower.includes(
      "exhausted"
    ) ||
    lower.includes(
      "recovery"
    ) ||
    lower.includes(
      "sore"
    )
  ) {

    if (
      isCombatProfile()
    ) {

      return getFlavorLine({

        sweetspot:
          "Factor recovery into the quality and intensity of your next combat session. Harder is not always better.",

        toughguy:
          "Being beat up is information. Use it.",

        mafia:
          "If the body is cooked, don’t pretend another war fixes it.",

        internet:
          "Your recovery bar is part of the game too."

      });

    }


    if (
      isFitnessProfile()
    ) {

      return getFlavorLine({

        sweetspot:
          "Check sleep, food, hydration, and recent training before deciding how hard the next session should be.",

        toughguy:
          "Recovery is training too.",

        mafia:
          "Don’t confuse being tired with needing more punishment.",

        internet:
          "Sometimes the gains are hiding in recovery."

      });

    }


    return (
      "Keep the basics steady today: food, fluids, sleep, and a manageable amount of activity."
    );

  }


  /*
   * TRAINING
   */

  if (
    lower.includes(
      "train"
    ) ||
    lower.includes(
      "training"
    ) ||
    lower.includes(
      "workout"
    ) ||
    lower.includes(
      "practice"
    )
  ) {

    if (
      isCombatProfile()
    ) {

      return getFlavorLine({

        sweetspot:
          `For ${getCombatStyleLabel()}, choose training quality based on recovery and the purpose of the session.`,

        toughguy:
          "Don’t collect hard rounds just to say you did them.",

        mafia:
          "Know what today’s session is supposed to accomplish.",

        internet:
          "Random suffering is not a training plan."

      });

    }


    if (
      isFitnessProfile()
    ) {

      return getFlavorLine({

        sweetspot:
          "Match the workout to your recovery and the training goal for today.",

        toughguy:
          "Purpose before volume.",

        mafia:
          "Make the session earn its place.",

        internet:
          "Workout quality > chaos volume."

      });

    }

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
          "Hydration is still light today. Add some fluids before complicating the rest of the plan.",

        toughguy:
          "Handle the easy hydration win.",

        mafia:
          "Water first. Then we talk about the complicated stuff.",

        internet:
          "Hydration bar needs attention."

      });

    }


    return (
      "Hydration looks reasonably steady today. Keep it moving."
    );

  }


  /*
   * CUT / WEIGHT
   */

  if (
    lower.includes(
      "cut"
    ) ||
    lower.includes(
      "lose weight"
    ) ||
    lower.includes(
      "make weight"
    ) ||
    lower.includes(
      "weight cut"
    )
  ) {

    if (
      isCombatProfile()
    ) {

      return getFlavorLine({

        sweetspot:
          "Keep combat weight management planned and gradual. Avoid turning one scale reading into an aggressive last-minute reaction.",

        toughguy:
          "Making weight is a plan, not a panic move.",

        mafia:
          "No emergency decisions because the scale got loud.",

        internet:
          "Scale drama does not get admin privileges."

      });

    }


    return (
      "Keep weight change gradual and consistent rather than reacting aggressively to individual weigh-ins."
    );

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
        "Training, enough food, protein, carbohydrate, and recovery all work together.",

      toughguy:
        "Train hard enough to adapt and recover well enough to repeat it.",

      mafia:
        "Growth needs both work and supplies.",

      internet:
        "Muscle construction requires building materials."

    });

  }


  /*
   * PROTEIN
   */

  if (
    lower.includes(
      "protein"
    ) ||
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
    )
  ) {

    return getFlavorLine({

      sweetspot:
        "Choose a protein source you enjoy and can use consistently as part of a balanced meal.",

      toughguy:
        "Pick a solid protein source and move on.",

      mafia:
        "Good protein, simple meal, no drama.",

      internet:
        "Protein does not need a personality test."

    });

  }


  /*
   * SNACK
   */

  if (
    lower.includes(
      "snack"
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
        "Keep the snack useful: something with protein plus fruit, grains, or another simple carbohydrate source.",

      toughguy:
        "Useful snack. Protein plus something that supports the day.",

      mafia:
        "Make the snack earn its keep.",

      internet:
        "Snack with a job description."

    });

  }


  /*
   * FOOD
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

    if (
      isFitnessProfile()
    ) {

      return (
        "Keep the meal practical and connect it to what you’re doing next: training, recovery, or simply staying steady."
      );

    }


    return (
      "Keep meals practical and balanced. Nothing needs to be perfect."
    );

  }


  /*
   * SCALE
   */

  if (
    lower.includes(
      "weight"
    ) ||
    lower.includes(
      "scale"
    )
  ) {

    return (
      "Treat body weight as a trend rather than a judgment from one isolated reading."
    );

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

    return (
      "Intergalactic performance still probably needs food, water, and recovery."
    );

  }


  if (
    lower.includes(
      "batman"
    ) ||
    lower.includes(
      "superhero"
    )
  ) {

    return (
      "Even superheroes need recovery days."
    );

  }


  if (
    lower.includes(
      "zombie"
    )
  ) {

    return (
      "Zombie survival sounds like a strong case for conditioning and hydration."
    );

  }


  if (
    lower.includes(
      "skibidi"
    ) ||
    lower.includes(
      "rizz"
    )
  ) {

    return (
      "That has powerful side-quest energy. I’m still voting for the basics."
    );

  }


  return getProfileDefaultReply();
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


      setTimeout(
        () => {

          const storedQuestion =
            lastQuestion;


          lastQuestion =
            previousQuestion;


          const reply =
            generateWiseReply(
              question,
              summary
            );


          lastQuestion =
            question ||
            storedQuestion;


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

        700 +
        Math.random() *
        500
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
  setup.wiseCoachGender ||
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