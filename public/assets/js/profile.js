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
  fuelwise: "FuelWise Maintain",
  cutwise: "CutWise Drop",
  gainwise: "GainWise Add",
  hydratewise: "HydrateWise H2O"
};

const guideIcons = {
  sweetspot: "●",
  toughguy: "▲",
  mafia: "◆",
  internet: "■",

  wiseguy: "●",
  wisegal: "●"
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

const guideIcon =
  guideIcons[guideKey] || "●";

const guideLabel =
  guideLabels[guideKey] || "Sweet Spot";

const genderStamp =
  setup.gender === "female"
    ? "♀"
    : "♂";

if (profileCard) {

  if (!setup.nickname && !setup.goal) {

    profileCard.innerHTML = `
      <div class="empty-profile">
        <h2>No Athlete / User Setup Yet</h2>

        <p>
          Complete setup to personalize FuelAI.
        </p>
      </div>
    `;

  } else {

    profileCard.innerHTML = `
      <div class="profile-header">

        <div
          class="profile-avatar guide-symbol"
          data-guide="${guideKey}"
        >
          <span class="guide-shape">
            ${guideIcon}
          </span>

          <span class="gender-stamp">
            ${genderStamp}
          </span>
        </div>

        <h2 class="profile-name">
          ${setup.nickname || "FuelAI User"}
        </h2>

        <p class="profile-goal">
          ${displayGoal[setup.goal] || "FuelWise"}
        </p>

        <p class="profile-guide">
          ${guideLabel}
        </p>

      </div>

      <div class="profile-grid">

        <div class="profile-stat">
          <span>Height</span>
          <strong>${setup.height || "--"}</strong>
        </div>

        <div class="profile-stat">
          <span>Weight</span>
          <strong>${setup.weight || "--"}</strong>
        </div>

        <div class="profile-stat">
          <span>Target</span>
          <strong>${setup.targetWeight || "--"}</strong>
        </div>

        <div class="profile-stat">
          <span>Age Range</span>
          <strong>${setup.ageRange || "--"}</strong>
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