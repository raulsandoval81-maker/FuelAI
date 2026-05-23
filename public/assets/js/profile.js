const profileCard =
  document.getElementById("profileCard");

const historyList =
  document.getElementById("historyList");

const setup =
  JSON.parse(
    localStorage.getItem("fuelai-setup")
  ) || {};

const scans =
  JSON.parse(
    localStorage.getItem("fuelai-history")
  ) || [];

const displayGoal = {
  fuelwise: "FuelWise Maintain",
  cutwise: "CutWise Drop",
  gainwise: "GainWise Add",
  hydratewise: "HydrateWise H2O"
};

if (profileCard) {

  profileCard.innerHTML = `

    <div class="profile-header">

      <div class="profile-avatar">
        ${setup.gender === "female"
          ?  "♀"
          :  "♂" }
      </div>

      <h2 class="profile-name">
        ${setup.nickname || "Your Profile"}
      </h2>

      <p class="profile-goal">
        ${displayGoal[setup.goal] || "FuelWise"}
      </p>

    </div>

    <div class="profile-grid">

      <div class="profile-stat">
        <span>Height</span>

        <strong>
          ${setup.height || "--"}
        </strong>
      </div>

      <div class="profile-stat">
        <span>Weight</span>

        <strong>
          ${setup.weight || "--"}
        </strong>
      </div>

      <div class="profile-stat">
        <span>Target</span>

        <strong>
          ${setup.targetWeight || "--"}
        </strong>
      </div>

      <div class="profile-stat">
        <span>Age Range</span>

        <strong>
          ${setup.ageRange || "--"}
        </strong>
      </div>

    </div>

  `;

}

if (historyList) {

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
            ${scan.mealName}
          </strong>

          <div class="history-meta">
            ${scan.calories} Calories ·
            ${displayGoal[scan.goal] || scan.goal}
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