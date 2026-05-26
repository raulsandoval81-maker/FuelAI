const profileCard =
  document.getElementById("profileCard");

const historyList =
  document.getElementById("historyList");

const setup =
  JSON.parse(
    localStorage.getItem("fuelai-setup") || "{}"
  );

const scans =
  JSON.parse(
    localStorage.getItem("fuelai-history") || "[]"
  );

const displayGoal = {
  fuelwise: "FuelWise — Maintain",
  cutwise: "CutWise — Cut",
  gainwise: "GainWise — Gain",
  hydratewise: "HydrateWise — Hydration"
};

const guideMarks = {
  sweetspot:
    "/assets/img/guides/sweetspot-mark.png",

  toughguy:
    "/assets/img/guides/toughguy-mark.png",

  mafia:
    "/assets/img/guides/mafia-mark.png",

  internet:
    "/assets/img/guides/internet-mark.png"
};

const displayFoodStyle = {
  none: "No Preference",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  highprotein: "High Protein",
  dairyfree: "Dairy Free",
  glutenfree: "Gluten Free"
};

const displaySport = {
  general: "General Fitness / Lifestyle",
  wrestling: "Wrestling",
  mma: "MMA",
  boxing: "Boxing",
  basketball: "Basketball",
  football: "Football",
  running: "Running"
};

const guideLabels = {
  sweetspot: "Sweet Spot",
  toughguy: "Tough Guy",
  mafia: "Mafia",
  internet: "Internet",
  wiseguy: "WiseGuy",
  wisegal: "WiseGal"
};

const guideKey =
  setup.wiseFlavor ||
  setup.guide ||
  "sweetspot";

const guideLabel =
  guideLabels[guideKey] || "Sweet Spot";

const guideMark =
  guideMarks[guideKey] ||
  guideMarks.sweetspot;

const genderStamp =
  setup.gender === "female"
    ? "♀"
    : "♂";

if (profileCard) {
  profileCard.style.display = "block";

  if (!setup.nickname && !setup.goal) {
    profileCard.innerHTML = `
      <div class="empty-profile">
        <h2>No Athlete / User Setup Yet</h2>

        <p>
          Complete setup to personalize FuelAI.
        </p>

        <a
          class="secondary-btn"
          href="/account/setup.html"
        >
          ⚙️ Start Setup
        </a>
      </div>
    `;
  } else {
    profileCard.innerHTML = `
      <div class="profile-header">

        <div class="profile-avatar">
          <img
            class="profile-guide-mark"
            src="${guideMark}"
            alt="${guideLabel}"
          />

          <span class="gender-stamp">
            ${genderStamp}
          </span>
        </div>

        <h2 class="profile-name">
          ${setup.nickname || "FuelAI User"}
        </h2>

        <p class="profile-goal">
          ${displayGoal[setup.goal] || "FuelWise — Maintain"}
        </p>

        <p class="profile-guide">
          ${guideLabel}
        </p>

      </div>

      <div class="profile-details">

        <div class="profile-row">
          <span class="profile-label">Goal</span>
          <span class="profile-value">${displayGoal[setup.goal] || "FuelWise — Maintain"}</span>
        </div>

        <div class="profile-row">
          <span class="profile-label">Weekly Focus</span>
          <span class="profile-value">${setup.weeklyFocus || "Steady Energy Week"}</span>
        </div>

        <div class="profile-row">
          <span class="profile-label">Sport</span>
          <span class="profile-value">${displaySport[setup.sportType] || "General Fitness / Lifestyle"}</span>
        </div>

        <div class="profile-row">
          <span class="profile-label">Activity</span>
          <span class="profile-value">${setup.activityLevel || "--"}</span>
        </div>

        <div class="profile-row">
          <span class="profile-label">Food Style</span>
          <span class="profile-value">${displayFoodStyle[setup.foodStyle] || "No Preference"}</span>
        </div>

        <div class="profile-row">
          <span class="profile-label">Avoids</span>
          <span class="profile-value">${setup.foodAvoid || "None"}</span>
        </div>

        <div class="profile-row">
          <span class="profile-label">Height</span>
          <span class="profile-value">${setup.height || "--"}</span>
        </div>

        <div class="profile-row">
          <span class="profile-label">Weight</span>
          <span class="profile-value">${setup.weight || "--"}</span>
        </div>

        <div class="profile-row">
          <span class="profile-label">Target</span>
          <span class="profile-value">${setup.targetWeight || "--"}</span>
        </div>

        <div class="profile-row">
          <span class="profile-label">Age Range</span>
          <span class="profile-value">${setup.ageRange || "--"}</span>
        </div>

      </div>
    `;
  }
}

if (historyList) {
  if (!scans.length) {
    historyList.innerHTML = `
      <div class="history-empty">
        No recent scans yet.
      </div>
    `;
  } else {
    historyList.innerHTML =
      scans.map(scan => `
        <div class="history-item">

          ${scan.image
            ? `
              <img
                class="history-thumb"
                src="${scan.image}"
                alt="Meal scan"
              />
            `
            : ""
          }

          <div>
            <strong>
              ${scan.mealName || "Meal Scan"}
            </strong>

            <div class="history-meta">
              ${scan.calories || "--"} Calories ·
              ${displayGoal[scan.goal] || scan.goal || "FuelWise"}
            </div>

            <div class="history-meta">
              ${scan.confidence
                ? `${scan.confidence} confidence · `
                : ""
              }

              ${scan.createdAt || ""}
            </div>
          </div>

        </div>
      `).join("");
  }
}