"use strict";


/* =========================
   DOM
========================= */

const recoveryInput =
  document.getElementById(
    "recoveryInput"
  );

const recoveryBtn =
  document.getElementById(
    "recoveryBtn"
  );

const recoveryOutput =
  document.getElementById(
    "recoveryOutput"
  );

const recoveryResponse =
  document.getElementById(
    "recoveryResponse"
  );



/* =========================
   RESET PATTERNS
========================= */

const BREATHING_PATTERNS = {

  quick: {
    label:
      "Quick Reset",

    steps: [
      "Breathe in slowly for 3 seconds.",
      "Breathe out slowly for 3 seconds.",
      "Repeat 3 times."
    ]
  },


  steady: {
    label:
      "Steady Reset",

    steps: [
      "Breathe in slowly for 4 seconds.",
      "Breathe out slowly for 5 seconds.",
      "Repeat 3 times."
    ]
  },


  deep: {
    label:
      "Slow Reset",

    steps: [
      "Breathe in gently for 4 seconds.",
      "Breathe out slowly for 6 seconds.",
      "Repeat 3 times."
    ]
  }

};



/* =========================
   HELPERS
========================= */

function normalizeInput(
  value
) {

  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();

}


function containsAny(
  text,
  terms
) {

  return terms.some(
    (term) =>
      text.includes(
        term
      )
  );

}



/* =========================
   RED FLAGS
========================= */

function hasRedFlag(
  input
) {

  return containsAny(
    input,
    [
      "chest pain",
      "can't breathe",
      "cannot breathe",
      "trouble breathing",
      "passed out",
      "fainted",
      "fainting",
      "confused",
      "confusion",
      "severe dizziness",
      "heart racing",
      "irregular heartbeat",
      "vomiting nonstop",
      "can't keep fluids down",
      "cannot keep fluids down"
    ]
  );

}



/* =========================
   GUIDANCE
========================= */

function getRecoveryGuidance(
  text
) {

  const input =
    normalizeInput(
      text
    );


  /*
   * SAFETY FIRST
   */

  if (
    hasRedFlag(
      input
    )
  ) {

    return {
      pattern:
        null,

      alert:
        true,

      message:
        "Those symptoms are outside what FuelAI should try to manage.",

      next:
        "Stop training and get appropriate medical help rather than trying to push through it."
    };

  }


  /*
   * HYDRATION
   */

  if (
    containsAny(
      input,
      [
        "hydration",
        "dehydrated",
        "thirst",
        "thirsty",
        "sweat",
        "sweating",
        "cramp"
      ]
    )
  ) {

    return {
      pattern:
        BREATHING_PATTERNS.steady,

      message:
        "Start by replacing fluids. If the session was long, hot, or involved heavy sweating, electrolytes may also be useful.",

      next:
        "Drink, cool down, and pair recovery with a normal meal or snack."
    };

  }


  /*
   * SORENESS
   */

  if (
    containsAny(
      input,
      [
        "sore",
        "soreness",
        "aches",
        "aching",
        "legs hurt",
        "muscle pain"
      ]
    )
  ) {

    return {
      pattern:
        BREATHING_PATTERNS.deep,

      message:
        "Training soreness is a signal to support recovery rather than chase another hard session.",

      next:
        "Fluids, normal food with protein and carbohydrate, light movement, and adequate sleep."
    };

  }


  /*
   * LOW ENERGY
   */

  if (
    containsAny(
      input,
      [
        "low energy",
        "tired",
        "flat",
        "exhausted",
        "drained",
        "no energy"
      ]
    )
  ) {

    return {
      pattern:
        BREATHING_PATTERNS.steady,

      message:
        "Low energy can have more than one cause. Start with the basics instead of guessing at one explanation.",

      next:
        "Check fluids, when you last ate, how you slept, and how hard you have been training."
    };

  }


  /*
   * SLEEP
   */

  if (
    containsAny(
      input,
      [
        "sleep",
        "slept",
        "poor sleep",
        "didn't sleep",
        "did not sleep"
      ]
    )
  ) {

    return {
      pattern:
        BREATHING_PATTERNS.steady,

      message:
        "A poor night of sleep can change how the day feels. Avoid turning one rough night into an all-or-nothing response.",

      next:
        "Keep food and hydration steady, adjust training if needed, and protect tonight's sleep."
    };

  }


  /*
   * POST TRAINING
   */

  if (
    containsAny(
      input,
      [
        "practice",
        "workout",
        "training",
        "trained",
        "lift",
        "lifting",
        "post workout"
      ]
    )
  ) {

    return {
      pattern:
        BREATHING_PATTERNS.quick,

      message:
        "After training, recovery starts with replacing fluids and giving the body enough nutrition to recover.",

      next:
        "Choose a normal meal or snack with protein and carbohydrate."
    };

  }


  /*
   * WEIGHT / CUTTING
   */

  if (
    containsAny(
      input,
      [
        "cut",
        "cutting",
        "weight cut",
        "make weight",
        "weigh in",
        "weigh-in"
      ]
    )
  ) {

    return {
      pattern:
        BREATHING_PATTERNS.deep,

      message:
        "Avoid reacting to one weigh-in with extreme restriction or dehydration.",

      next:
        "Use your established WeightWise plan or qualified coaching guidance instead of making a last-minute aggressive change."
    };

  }


  /*
   * STRESS
   */

  if (
    containsAny(
      input,
      [
        "stress",
        "stressed",
        "overwhelmed",
        "panic",
        "anxious",
        "anxiety",
        "spiral"
      ]
    )
  ) {

    return {
      pattern:
        BREATHING_PATTERNS.deep,

      message:
        "When everything feels urgent, the useful move is usually to reduce the number of decisions you are trying to solve at once.",

      next:
        "Choose one basic action you can complete now, then reassess."
    };

  }


  /*
   * DEFAULT
   */

  return {
    pattern:
      BREATHING_PATTERNS.steady,

    message:
      "Start with the basics and avoid trying to solve everything at once.",

    next:
      "Check hydration, food, sleep, and training load. Then choose one useful next move."
  };

}



/* =========================
   DOM BUILDERS
========================= */

function createTextElement(
  tagName,
  className,
  text
) {

  const element =
    document.createElement(
      tagName
    );


  if (
    className
  ) {

    element.className =
      className;

  }


  element.textContent =
    text;


  return element;

}



/* =========================
   RENDER
========================= */

function renderRecoveryResponse(
  result
) {

  if (
    !recoveryResponse
  ) {
    return;
  }


  recoveryResponse.innerHTML =
    "";


  const plan =
    document.createElement(
      "div"
    );


  plan.className =
    "meal-plan";


  /*
   * RESET
   */

  if (
    result.pattern
  ) {

    plan.appendChild(
      createTextElement(
        "p",
        "meal-label",
        result.pattern.label
      )
    );


    const list =
      document.createElement(
        "ul"
      );


    list.className =
      "meal-list";


    result.pattern.steps
      .forEach(
        (step) => {

          const item =
            document.createElement(
              "li"
            );


          item.textContent =
            step;


          list.appendChild(
            item
          );

        }
      );


    plan.appendChild(
      list
    );


    const divider =
      document.createElement(
        "div"
      );


    divider.className =
      "meal-divider";


    plan.appendChild(
      divider
    );

  }


  /*
   * READ
   */

  plan.appendChild(
    createTextElement(
      "p",
      "meal-label",
      result.alert
        ? "Safety Check"
        : "Recovery Read"
    )
  );


  plan.appendChild(
    createTextElement(
      "p",
      "meal-line",
      result.message
    )
  );


  const divider =
    document.createElement(
      "div"
    );


  divider.className =
    "meal-divider";


  plan.appendChild(
    divider
  );


  /*
   * NEXT MOVE
   */

  plan.appendChild(
    createTextElement(
      "p",
      "meal-label",
      "Next Move"
    )
  );


  plan.appendChild(
    createTextElement(
      "p",
      "meal-line",
      result.next
    )
  );


  recoveryResponse.appendChild(
    plan
  );

}



/* =========================
   ACTION
========================= */

recoveryBtn
  ?.addEventListener(
    "click",
    () => {

      const text =
        recoveryInput
          ?.value
          .trim() ||
        "";


      const result =
        getRecoveryGuidance(
          text
        );


      recoveryOutput
        ?.classList
        .remove(
          "hidden"
        );


      renderRecoveryResponse(
        result
      );

    }
  );