const form = document.getElementById("weightwiseForm");

const output = document.getElementById("weightwiseOutput");
const statusOutput = document.getElementById("statusOutput");
const remainingOutput = document.getElementById("remainingOutput");
const daysOutput = document.getElementById("daysOutput");
const weeklyOutput = document.getElementById("weeklyOutput");
const classOutput = document.getElementById("classOutput");
const guidanceOutput = document.getElementById("guidanceOutput");

const STORAGE_KEY = "fuelai-weightwise-beta";

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getDaysRemaining(dateValue) {
  const today = getTodayStart();
  const competition = new Date(dateValue + "T00:00:00");

  const diff = competition - today;
  return Math.ceil(diff / 86400000);
}

function getStatus(weeklyPace) {
  if (weeklyPace <= 1) {
    return {
      label: "ON TRACK ✓",
      className: "status-good",
      guidance: "This pace is within the current planning range. Keep logging and reassess as conditions change."
    };
  }

  if (weeklyPace <= 2) {
    return {
      label: "AGGRESSIVE",
      className: "status-warning",
      guidance: "This pace is more aggressive. Watch energy, hydration, sleep, and training quality."
    };
  }

  return {
    label: "HIGH RISK",
    className: "status-danger",
    guidance: "This target may be too aggressive. Recheck the weight class, timeline, and coaching plan."
  };
}

function savePlan(plan) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

function loadPlan() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return;

  const plan = JSON.parse(saved);

  document.getElementById("currentWeight").value = plan.currentWeight || "";
  document.getElementById("targetWeight").value = plan.targetWeight || "";
  document.getElementById("weightClass").value = plan.weightClass || "";
  const competitionNameInput =
  document.getElementById("competitionName");

if (competitionNameInput) {
  competitionNameInput.value =
    plan.competitionName || "";
}
  document.getElementById("competitionDate").value = plan.competitionDate || "";

  calculatePlan(plan);
}

function calculatePlan(plan) {
  const currentWeight = Number(plan.currentWeight);
  const targetWeight = Number(plan.targetWeight);
  const daysRemaining = getDaysRemaining(plan.competitionDate);

  const weightRemaining = currentWeight - targetWeight;
  const weeklyPace = daysRemaining > 0
    ? (weightRemaining / daysRemaining) * 7
    : 0;

  output.classList.remove("hidden");

  if (daysRemaining < 0) {
    statusOutput.textContent = "DATE PASSED";
    statusOutput.className = "status-pill status-danger";
    guidanceOutput.textContent = "Competition date has already passed. Update the date.";
    return;
  }

  if (weightRemaining <= 0) {
    statusOutput.textContent = "AT TARGET ✓";
    statusOutput.className = "status-pill status-good";
    remainingOutput.textContent = "0 lb";
    daysOutput.textContent = `${daysRemaining}`;
    weeklyOutput.textContent = "0 lb/week";
    classOutput.textContent = plan.weightClass || "—";
    guidanceOutput.textContent = "You are at or below target. Focus on holding weight, hydration, and performance.";
    return;
  }

  const status = getStatus(weeklyPace);

  statusOutput.textContent = status.label;
  statusOutput.className = `status-pill ${status.className}`;

  remainingOutput.textContent = `${weightRemaining.toFixed(1)} lb`;
  daysOutput.textContent = `${daysRemaining}`;
  weeklyOutput.textContent = `${weeklyPace.toFixed(1)} lb/week`;
  classOutput.textContent = plan.weightClass || "—";
  guidanceOutput.textContent = status.guidance;
}

if (form) {
  form.addEventListener("submit", function (event) {
    event.preventDefault();

const plan = {
  currentWeight: document.getElementById("currentWeight").value,
  targetWeight: document.getElementById("targetWeight").value,
  weightClass: document.getElementById("weightClass").value,

competitionName:
  document.getElementById("competitionName")
    ? document.getElementById("competitionName").value
    : "",


  competitionDate:
    document.getElementById("competitionDate").value,

  updatedAt:
    new Date().toISOString()
};

    savePlan(plan);
    calculatePlan(plan);
  });

  loadPlan();
}

function getWeightDateKey(
  entry
) {

  if (
    entry?.weighInDate
  ) {
    return entry.weighInDate;
  }


  if (
    !entry?.createdAt
  ) {
    return "";
  }


  const date =
    new Date(
      entry.createdAt
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Los_Angeles",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit"
      }
    )
      .formatToParts(
        date
      );


  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value;


  return (
    year &&
    month &&
    day
  )
    ? `${year}-${month}-${day}`
    : "";

}


function getLegacyHistory() {

  try {

    const saved =
      JSON.parse(
        localStorage.getItem(
          HISTORY_KEY
        ) || "[]"
      );

    return Array.isArray(
      saved
    )
      ? saved
      : [];

  } catch {

    return [];

  }

}


function getSharedWeightHistory() {

  const logs =
    window.FuelAILog
      ?.getFuelLog?.() ||
    [];


  const userEmail =
    window.FuelAIAuth
      ?.getSoftUserEmail?.() ||
    "";


  if (
    !userEmail
  ) {
    return [];
  }


  return logs
    .filter(
      (entry) =>

        entry?.type ===
          "weight" &&

        entry?.userEmail ===
          userEmail &&

        Number.isFinite(
          Number(
            entry.weight
          )
        ) &&

        Number(
          entry.weight
        ) > 0
    )
    .map(
      (entry) => ({

        athleteName:
          entry.athleteName ||
          "",

        date:
          getWeightDateKey(
            entry
          ),

        weight:
          Number(
            entry.weight
          ),

        loggedAt:
          entry.createdAt ||
          "",

        source:
          entry.source ||
          "fuelai",

        sharedLogId:
          entry.id ||
          ""

      })
    )
    .filter(
      (entry) =>
        entry.date
    );

}


function getHistory() {

  return getSharedWeightHistory();

}


function getWeeklyTrend() {
  const history =
    getHistory()
      .filter((entry) =>
        entry.date &&
        entry.weight
      )
      .sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      );

  if (history.length < 2) {
    return null;
  }

  const latestEntry =
    history[history.length - 1];

  const latestDate =
    new Date(latestEntry.date);

  const weekWindow =
    history.filter((entry) => {
      const entryDate =
        new Date(entry.date);

      const diffDays =
        (latestDate - entryDate) / 86400000;

      return diffDays >= 0 && diffDays <= 7;
    });

  if (weekWindow.length < 2) {
    return null;
  }

  const firstEntry =
    weekWindow[0];

  const latestWeight =
    Number(latestEntry.weight);

  const startWeight =
    Number(firstEntry.weight);

  const change =
    latestWeight - startWeight;

  return {
    startDate:
      firstEntry.date,

    latestDate:
      latestEntry.date,

    startWeight,

    latestWeight,

    change,

    weeklyPace:
      Math.abs(change)
  };
}
function getTrendStatus(actualPace, requiredPace) {
  if (!actualPace || !requiredPace) {
    return "No Trend";
  }

  const difference =
    actualPace - requiredPace;

  if (difference >= 0.3) {
    return "Ahead";
  }

  if (difference <= -0.3) {
    return "Behind";
  }

  return "On Pace";
}

function getLatestWeighIn() {

  const history =
    getHistory()
      .filter(
        (entry) =>
          entry.date &&
          entry.weight
      )
      .sort(
        (a, b) => {

          const aTime =
            new Date(
              a.loggedAt ||
              a.date
            ).getTime();

          const bTime =
            new Date(
              b.loggedAt ||
              b.date
            ).getTime();

          return (
            bTime -
            aTime
          );

        }
      );


  return (
    history[0] ||
    null
  );

}


function renderHistory() {
  const list = document.getElementById("historyList");

  if (!list) return;

  const history =
    getHistory()
      .sort(
        (a, b) => {

          const aTime =
            new Date(
              a.loggedAt ||
              a.date
            ).getTime();

          const bTime =
            new Date(
              b.loggedAt ||
              b.date
            ).getTime();

          return (
            bTime -
            aTime
          );

        }
      );

  if (!history.length) {
    list.textContent = "No weigh-ins yet.";
    return;
  }

  const displayName =
    getWeightwiseNickname();


  list.innerHTML = history
    .map((entry) => {
      return `
        <div class="history-row">
          <span>
            ${displayName} · ${entry.date}
          </span>

          <strong>
            ${Number(entry.weight).toFixed(1)} lb
          </strong>
        </div>
      `;
    })
    .join("");
}

function getWeightwiseNickname() {

  try {

    const setup =
      JSON.parse(
        localStorage.getItem(
          "fuelai-setup"
        ) || "{}"
      );

    return (
      setup.nickname ||
      "Athlete"
    );

  } catch {

    return "Athlete";

  }

}


function setupHistoryForm() {

  const historyForm =
    document.getElementById(
      "historyForm"
    );

  if (!historyForm) {
    return;
  }


  const dateInput =
    document.getElementById(
      "logDate"
    );

  const weightInput =
    document.getElementById(
      "logWeight"
    );


  if (
    !dateInput ||
    !weightInput
  ) {
    return;
  }


  dateInput.value =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );


  historyForm.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();


      const weight =
        Number(
          weightInput.value
        );

      const date =
        dateInput.value;

      const userEmail =
        window.FuelAIAuth
          ?.getSoftUserEmail?.() ||
        "";

      const athleteName =
        getWeightwiseNickname();


      if (
        !Number.isFinite(
          weight
        ) ||
        weight <= 0 ||
        !userEmail
      ) {
        return;
      }


      window.FuelAILog
        ?.addFuelLog?.({

          type:
            "weight",

          weight,

          source:
            "weightwise",

          userEmail,

          athleteName,

          weighInDate:
            date

        });


      weightInput.value =
        "";


      renderHistory();

      renderDescentSchedule();

      renderCompetitionMode();

    }
  );


  renderHistory();

}


setupHistoryForm();
function renderDescentSchedule() {

  const output =
    document.getElementById(
      "scheduleOutput"
    );

  if (!output) {
    return;
  }


  const saved =
    localStorage.getItem(
      STORAGE_KEY
    );


  if (!saved) {

    output.textContent =
      "Complete WeightWise setup first.";

    return;

  }


  const plan =
    JSON.parse(
      saved
    );


  const latestWeighIn =
    getLatestWeighIn();


  const currentWeight =
    latestWeighIn
      ? Number(
          latestWeighIn.weight
        )
      : Number(
          plan.currentWeight
        );


  const targetWeight =
    Number(
      plan.targetWeight
    );


  const daysRemaining =
    getDaysRemaining(
      plan.competitionDate
    );


  const weightRemaining =
    Math.max(
      0,
      currentWeight -
        targetWeight
    );


  const weeklyPace =
    daysRemaining > 0
      ? (
          weightRemaining /
          daysRemaining
        ) * 7
      : 0;


  const status =
    getStatus(
      weeklyPace
    );


  /*
   * HIGH RISK
   *
   * Do not generate weekly target
   * weights for an aggressive path.
   */

  if (
    status.label ===
      "HIGH RISK"
  ) {

    output.innerHTML = `
      <div class="history-row">
        <span>Current Weight</span>
        <strong>
          ${currentWeight.toFixed(1)} lb
        </strong>
      </div>

      <div class="history-row">
        <span>Target Weight</span>
        <strong>
          ${targetWeight.toFixed(1)} lb
        </strong>
      </div>

      <div class="history-row">
        <span>Days Remaining</span>
        <strong>
          ${Math.max(0, daysRemaining)}
        </strong>
      </div>

      <div
        class="status-pill ${status.className}"
      >
        ${status.label}
      </div>

      <p class="guidance">
        This target requires review before
        WeightWise builds a weekly descent
        schedule. Recheck the weight class,
        timeline, and coaching plan.
      </p>
    `;

    return;

  }


  /*
   * NORMAL / AGGRESSIVE
   *
   * Render planning projection.
   */

  const weeks =
    Math.max(
      1,
      Math.ceil(
        Math.max(
          1,
          daysRemaining
        ) / 7
      )
    );


  let html = `
    <div class="history-row">
      <span>Today</span>
      <strong>
        ${currentWeight.toFixed(1)} lb
      </strong>
    </div>
  `;


  for (
    let i = 1;
    i <= weeks;
    i++
  ) {

    const progress =
      i / weeks;


    const projected =
      currentWeight -
      (
        weightRemaining *
        progress
      );


    html += `
      <div class="history-row">
        <span>
          Week ${i}
        </span>

        <strong>
          ${projected.toFixed(1)} lb
        </strong>
      </div>
    `;

  }


  html += `
    <div class="history-row">
      <span>Competition</span>
      <strong>
        ${targetWeight.toFixed(1)} lb
      </strong>
    </div>

    <div
      class="status-pill ${status.className}"
    >
      ${status.label}
    </div>
  `;


  output.innerHTML =
    html;

}


renderDescentSchedule();
function renderCompetitionMode() {
  const output =
    document.getElementById("competitionOutput");

  if (!output) return;

  const saved =
    localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    output.textContent =
      "Complete WeightWise setup first.";
    return;
  }

  const plan =
    JSON.parse(saved);
  const competitionName = plan.competitionName || "Competition";




  const latestWeighIn =
  getLatestWeighIn();

const currentWeight =
  latestWeighIn
    ? Number(latestWeighIn.weight)
    : Number(plan.currentWeight);

  const targetWeight =
    Number(plan.targetWeight);

  const daysRemaining =
    getDaysRemaining(
      plan.competitionDate
    );

  const weightRemaining =
    Math.max(
      0,
      currentWeight - targetWeight
    );

const weeklyPace =
  daysRemaining > 0
    ? (weightRemaining / daysRemaining) * 7
    : 0;

const assumedSafeWeeklyLoss = 1.0;

const projectedCompetitionWeight =
  Math.max(
    targetWeight,
    currentWeight -
      assumedSafeWeeklyLoss * (daysRemaining / 7)
  );

  const projectedGap =
  projectedCompetitionWeight - targetWeight;

  const actualVsProjected =
  currentWeight - projectedCompetitionWeight;

const status =
  getStatus(weeklyPace);


  const trend =
  getWeeklyTrend();

  const trendStatus =
  trend
    ? getTrendStatus(
        trend.weeklyPace,
        weeklyPace
      )
    : null;

  const coachReviewNeeded =
    weeklyPace > 2 ||
    projectedGap > 3;


  /*
   * HIGH RISK
   *
   * Keep Competition Mode focused on
   * awareness and review. Do not grade
   * the athlete against an unsafe pace.
   */

  if (
    status.label ===
      "HIGH RISK"
  ) {

    output.innerHTML = `
      <h2>
        ${competitionName}
      </h2>

      <div class="history-row">
        <span>
          Current Weight
        </span>

        <strong>
          ${currentWeight.toFixed(1)} lb
        </strong>
      </div>

      <div class="history-row">
        <span>
          Target Weight
        </span>

        <strong>
          ${targetWeight.toFixed(1)} lb
        </strong>
      </div>

      <div class="history-row">
        <span>
          Weight Remaining
        </span>

        <strong>
          ${weightRemaining.toFixed(1)} lb
        </strong>
      </div>

      <div class="history-row">
        <span>
          Days Remaining
        </span>

        <strong>
          ${Math.max(0, daysRemaining)}
        </strong>
      </div>

      ${
        trend
          ? `
            <div class="history-row">
              <span>
                7-Day Change
              </span>

              <strong>
                ${
                  trend.change >= 0
                    ? "+"
                    : ""
                }${trend.change.toFixed(1)} lb
              </strong>
            </div>
          `
          : ""
      }

      <div
        class="status-pill ${status.className}"
      >
        ${status.label}
      </div>

      <div class="history-row">
        <span>
          Coach Review
        </span>

        <strong>
          Required
        </strong>
      </div>

      <p class="guidance">
        This target requires review.
        Recheck the weight class,
        competition timeline, and plan
        before continuing weight-descent
        planning.
      </p>
    `;

    return;

  }


  output.innerHTML = `
    <h2>${competitionName}</h2>

    <div class="history-row">
      <span>Current Weight</span>
      <strong>${currentWeight.toFixed(1)} lb</strong>
    </div>

    <div class="history-row">
      <span>Target Weight</span>
      <strong>${targetWeight.toFixed(1)} lb</strong>
    </div>

    <div class="history-row">
      <span>Weight Remaining</span>
      <strong>${weightRemaining.toFixed(1)} lb</strong>
    </div>

<div class="history-row">
  <span>Days Remaining</span>
  <strong>${daysRemaining}</strong>
</div>

<div class="history-row">
  <span>Weekly Pace</span>
  <strong>${weeklyPace.toFixed(1)} lb/week</strong>
</div>

${trend ? `
  <div class="history-row">
    <span>7-Day Change</span>
    <strong>
      ${trend.change >= 0 ? "+" : ""}
      ${trend.change.toFixed(1)} lb
    </strong>
  </div>

  <div class="history-row">
    <span>Actual Pace</span>
    <strong>
      ${trend.weeklyPace.toFixed(1)} lb/week
    </strong>
  </div>
` : ""}

${trendStatus ? `
  <div class="history-row">
    <span>Trend Status</span>
    <strong>${trendStatus}</strong>
  </div>
` : ""}

    <div class="history-row">
     <span>Projected Competition Weight</span>
     <strong>${projectedCompetitionWeight.toFixed(1)} lb</strong>
    </div>

    <div class="history-row">
  <span>Projected Gap</span>
  <strong>+${projectedGap.toFixed(1)} lb</strong>
    </div>

<div class="history-row">
  <span>Distance From Target</span>
  <strong>
    ${weightRemaining.toFixed(1)} lb
  </strong>
</div>


    <div class="status-pill ${status.className}">
      ${status.label}
    </div>
    
    <div class="history-row">
  <span>Coach Review</span>
  <strong>
    ${coachReviewNeeded ? "Recommended" : "Not Needed"}
  </strong>
   </div>

    <p class="guidance">
      ${status.guidance}
    </p>
  `;
}

renderCompetitionMode();