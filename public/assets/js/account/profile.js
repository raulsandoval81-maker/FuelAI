"use strict";


/* =========================
   DOM
========================= */

const profileCard =
  document.getElementById(
    "profileCard"
  );

const historyList =
  document.getElementById(
    "historyList"
  );



/* =========================
   SAFE STORAGE
========================= */

function safeJSONParse(
  value,
  fallback
) {
  try {
    return (
      JSON.parse(value) ??
      fallback
    );
  } catch {
    return fallback;
  }
}


const setup =
  safeJSONParse(
    localStorage.getItem(
      "fuelai-setup"
    ) || "{}",
    {}
  );


const scans =
  safeJSONParse(
    localStorage.getItem(
      "fuelai-history"
    ) || "[]",
    []
  );



/* =========================
   LABELS
========================= */

const displayGoal = {

  fuelwise:
    "FuelWise — Maintain / Balance",

  cutwise:
    "CutWise — Lean Out",

  gainwise:
    "GainWise — Build / Recover"

};


const displayFoodStyle = {

  none:
    "No Preference",

  vegetarian:
    "Vegetarian",

  vegan:
    "Vegan",

  highprotein:
    "High Protein",

  dairyfree:
    "Dairy Free",

  glutenfree:
    "Gluten Free"

};


const displayLifestyle = {

  "general-health":
    "General Health",

  "fitness-enthusiast":
    "Fitness Enthusiast",

  "sports-athlete":
    "Sports Athlete",

  "combat-athlete":
    "Combat Athlete"

};


const displayActivity = {

  "1-2":
    "1–2 days per week",

  "2-3":
    "2–3 days per week",

  "4-5":
    "4–5 days per week",

  "6-plus":
    "6+ days per week",

  "6plus":
    "6+ days per week"

};


const displayCombatStyle = {

  grappling:
    "Grappling Sports",

  striking:
    "Striking Sports",

  mma:
    "MMA / Mixed Combat"

};



/* =========================
   ELEMENT HELPERS
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


function createProfileRow(
  label,
  value
) {

  const row =
    document.createElement(
      "div"
    );


  row.className =
    "profile-row";


  const labelEl =
    createTextElement(
      "span",
      "profile-label",
      label
    );


  const valueEl =
    createTextElement(
      "span",
      "profile-value",
      value
    );


  row.append(
    labelEl,
    valueEl
  );


  return row;
}



/* =========================
   PROFILE
========================= */

function renderEmptyProfile() {

  if (
    !profileCard
  ) {
    return;
  }


  profileCard.innerHTML =
    "";


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "empty-profile";


  wrapper.append(
    createTextElement(
      "h2",
      "",
      "No User Setup Yet"
    ),

    createTextElement(
      "p",
      "",
      "Complete setup to personalize FuelAI."
    )
  );


  const link =
    document.createElement(
      "a"
    );


  link.className =
    "secondary-btn";


  link.href =
    "/account/setup.html";


  link.textContent =
    "⚙️ Start Setup";


  wrapper.appendChild(
    link
  );


  profileCard.appendChild(
    wrapper
  );

}


function renderProfile() {

  if (
    !profileCard
  ) {
    return;
  }


  profileCard.style.display =
    "block";


  const hasSetup =
    Boolean(
      setup.nickname ||
      setup.goal ||
      setup.lifestyleType ||
      setup.weight ||
      setup.height
    );


  if (
    !hasSetup
  ) {

    renderEmptyProfile();

    return;

  }


  profileCard.innerHTML =
    "";


  const header =
    document.createElement(
      "div"
    );


  header.className =
    "profile-header";


  header.appendChild(
    createTextElement(
      "h2",
      "profile-name",
      setup.nickname ||
      "FuelAI User"
    )
  );


  const details =
    document.createElement(
      "div"
    );


  details.className =
    "profile-details";


  details.append(
    createProfileRow(
      "Profile",
      displayLifestyle[
        setup.lifestyleType
      ] ||
      "General Health"
    ),

    createProfileRow(
      "Weekly Focus",
      setup.weeklyFocus ||
      "Steady Energy Week"
    ),

    createProfileRow(
      "Direction",
      displayGoal[
        setup.goal
      ] ||
      displayGoal.fuelwise
    ),

    createProfileRow(
      "Activity",
      displayActivity[
        setup.activityLevel
      ] ||
      setup.activityLevel ||
      "Not set"
    ),

    createProfileRow(
      "Food Style",
      displayFoodStyle[
        setup.foodStyle
      ] ||
      "No Preference"
    ),

    createProfileRow(
      "Avoids",
      setup.foodAvoid ||
      "None"
    ),

    createProfileRow(
      "Height",
      setup.height ||
      "—"
    ),

    createProfileRow(
      "Weight",
      setup.weight
        ? `${setup.weight}`
        : "—"
    ),

    createProfileRow(
      "Target",
      setup.targetWeight
        ? `${setup.targetWeight}`
        : "—"
    ),

    createProfileRow(
      "Age Range",
      setup.ageRange ||
      "—"
    )
  );


  if (
    setup.lifestyleType ===
    "combat-athlete"
  ) {

    details.appendChild(
      createProfileRow(
        "Combat Style",
        displayCombatStyle[
          setup.combatStyle
        ] ||
        "Not selected"
      )
    );

  }


  profileCard.append(
    header,
    details
  );

}



/* =========================
   LEGACY SCAN HISTORY
========================= */

function renderHistory() {

  if (
    !historyList
  ) {
    return;
  }


  historyList.innerHTML =
    "";


  if (
    !Array.isArray(
      scans
    ) ||
    !scans.length
  ) {

    historyList.appendChild(
      createTextElement(
        "div",
        "history-empty",
        "No recent scans yet."
      )
    );

    return;

  }


  scans.forEach(
    (scan) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "history-item";


      if (
        scan.image
      ) {

        const img =
          document.createElement(
            "img"
          );


        img.className =
          "history-thumb";


        img.src =
          scan.image;


        img.alt =
          "Meal scan";


        item.appendChild(
          img
        );

      }


      const copy =
        document.createElement(
          "div"
        );


      copy.appendChild(
        createTextElement(
          "strong",
          "",
          scan.mealName ||
          "Meal Scan"
        )
      );


      copy.appendChild(
        createTextElement(
          "div",
          "history-meta",
          `${
            scan.calories ||
            "—"
          } Calories · ${
            displayGoal[
              scan.goal
            ] ||
            "FuelWise"
          }`
        )
      );


      const confidenceText =
        scan.confidence
          ? `${scan.confidence} confidence`
          : "";


      const dateText =
        scan.createdAt ||
        "";


      copy.appendChild(
        createTextElement(
          "div",
          "history-meta",
          [
            confidenceText,
            dateText
          ]
            .filter(
              Boolean
            )
            .join(
              " · "
            )
        )
      );


      item.appendChild(
        copy
      );


      historyList.appendChild(
        item
      );

    }
  );

}



/* =========================
   START
========================= */

renderProfile();

renderHistory();