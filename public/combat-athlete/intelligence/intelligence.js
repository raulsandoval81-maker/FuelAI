const analyzeBtn =
  document.getElementById("analyzeBtn");

const answerOutput =
  document.getElementById("answerOutput");

const statusOutput =
  document.getElementById("statusOutput");

const plan =
  JSON.parse(
    localStorage.getItem(
      "fuelai-weightwise-beta"
    ) || "null"
  );

const COMBAT_KNOWLEDGE = {
  competitionWeek: [
    "Maintain consistent sleep.",
    "Stay hydrated throughout the week.",
    "Avoid major nutrition changes.",
    "Reduce unnecessary stress.",
    "Prepare equipment and travel plans early.",
    "Review weigh-in requirements."
  ],

  makingWeight: [
    "Start planning early.",
    "Track trends, not daily fluctuations.",
    "Prioritize hydration.",
    "Maintain protein intake.",
    "Avoid crash dieting and extreme measures.",
    "Consult coaches and parents when needed."
  ],

  fueling: [
    "Protein supports recovery.",
    "Carbohydrates support training and competition energy.",
    "Healthy fats support overall health.",
    "Consistency usually beats perfection.",
    "Fuel for performance, not just weight."
  ],

  hydration: [
    "Drink consistently throughout the day.",
    "Monitor urine color as a simple hydration indicator.",
    "Hydrate before, during, and after training.",
    "Increase fluids during hot conditions.",
    "Do not rely on dehydration as a weight-management strategy."
  ],

  afterWeighIns: [
    "Rehydrate steadily.",
    "Include electrolytes when appropriate.",
    "Use easy-to-digest carbohydrates.",
    "Add moderate protein.",
    "Avoid overeating immediately.",
    "Focus on performance and recovery."
  ],

  recovery: [
    "Protect sleep.",
    "Do not let the cut destroy training quality.",
    "Watch energy, mood, and soreness.",
    "Use lighter recovery work when needed.",
    "Talk with a coach if performance drops hard."
  ]
};

function renderList(items) {
  return `
    <ul>
      ${items
        .map((item) => `<li>${item}</li>`)
        .join("")}
    </ul>
  `;
}

function getTodayStart() {
  const today =
    new Date();

  today.setHours(0, 0, 0, 0);

  return today;
}

function getDaysRemaining(dateValue) {
  const today =
    getTodayStart();

  const competition =
    new Date(dateValue + "T00:00:00");

  const diff =
    competition - today;

  return Math.ceil(diff / 86400000);
}

function getStatus(weeklyPace) {
  if (weeklyPace <= 1) {
    return "On Track";
  }

  if (weeklyPace <= 2) {
    return "Attention";
  }

  return "Coach Review";
}

function getStatusGuidance(status) {
  if (status === "On Track") {
    return "You are on schedule. Keep logging, protect hydration, and do not make unnecessary changes.";
  }

  if (status === "Attention") {
    return "You are close, but the pace needs consistency. Watch sleep, hydration, energy, and training quality.";
  }

  return "This pace is aggressive. Review the plan with a coach before pushing harder.";
}

function getWeightWiseIntel() {
  if (!plan) return null;

  const currentWeight =
    Number(plan.currentWeight);

  const targetWeight =
    Number(plan.targetWeight);

  const daysRemaining =
    getDaysRemaining(plan.competitionDate);

  const weightRemaining =
    Math.max(
      0,
      currentWeight - targetWeight
    );

  const weeklyPace =
    daysRemaining > 0
      ? (weightRemaining / daysRemaining) * 7
      : 0;

  const status =
    getStatus(weeklyPace);

  return {
    currentWeight,
    targetWeight,
    daysRemaining,
    weightRemaining,
    weeklyPace,
    status,
    guidance:
      getStatusGuidance(status)
  };
}
function getTrendStatusFromHistory() {
  const history =
    JSON.parse(
      localStorage.getItem(
        "fuelai-weightwise-history"
      ) || "[]"
    );

  if (history.length < 2) {
    return null;
  }

  const sorted =
    history.sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );

  const latest =
    sorted[sorted.length - 1];

  const weekAgo =
    sorted.find((entry) => {
      const diff =
        (new Date(latest.date) -
          new Date(entry.date)) /
        86400000;

      return diff >= 7;
    });

  if (!weekAgo) {
    return null;
  }

  const actualPace =
    Math.abs(
      Number(latest.weight) -
      Number(weekAgo.weight)
    );

  const intel =
    getWeightWiseIntel();

  if (!intel) {
    return null;
  }

  const requiredPace =
    intel.weeklyPace;

  if (
    actualPace >
    requiredPace + 0.3
  ) {
    return "Ahead";
  }

  if (
    actualPace <
    requiredPace - 0.3
  ) {
    return "Behind";
  }

  return "On Pace";
}

function renderStatus() {
  if (!plan) {

    statusOutput.textContent =
      "Complete WeightWise setup first.";

    return;
  }

  const intel =
    getWeightWiseIntel();

  statusOutput.innerHTML = `
    Competition:
    ${plan.competitionName || "Not Set"}
    <br><br>

    Current Weight:
    ${plan.currentWeight || "Not Set"} lb
    <br><br>

    Target Weight:
    ${plan.targetWeight || "Not Set"} lb
    <br><br>

    Weight Class:
    ${plan.weightClass || "Not Set"}
    <br><br>

    Competition Date:
    ${plan.competitionDate || "Not Set"}
    <br><br>

    Weight Remaining:
    ${intel.weightRemaining.toFixed(1)} lb
    <br><br>

    Days Remaining:
    ${intel.daysRemaining}
    <br><br>

    Required Pace:
    ${intel.weeklyPace.toFixed(1)} lb/week
    <br><br>

    Status:
    ${intel.status}
  `;
}

function answerInLane(question) {
  if (!plan) {
    return "Complete WeightWise setup first.";
  }

  const intel =
    getWeightWiseIntel();
    const trendStatus =
  getTrendStatusFromHistory();

if (
  question.includes("track") ||
  question.includes("on track") ||
  question.includes("make weight") ||
  question.includes("can i make")
) {
  return `
    <strong>${intel.status}</strong>

    <br><br>

    <strong>Assessment</strong>

    <br>

    You have ${intel.weightRemaining.toFixed(1)} lb remaining
    with ${intel.daysRemaining} days until competition.

    <br><br>

    Required pace:
    ${intel.weeklyPace.toFixed(1)} lb/week.

    ${trendStatus
      ? `<br><br>Trend Status: ${trendStatus}`
      : ""}

    <br><br>

    ${intel.guidance}

    <br><br>

    <strong>Key Focus</strong>

    <ul>
      <li>Track trends, not daily fluctuations.</li>
      <li>Prioritize hydration.</li>
      <li>Maintain protein intake.</li>
      <li>Avoid extreme weight-cutting measures.</li>
      <li>Protect sleep and training quality.</li>
    </ul>
  `;
}

  if (
    question.includes("how much") ||
    question.includes("remain") ||
    question.includes("left")
  ) {
    return `
      <strong>Weight Remaining</strong>
      <br><br>
      ${intel.weightRemaining.toFixed(1)} lb remaining.
    `;
  }

  if (
    question.includes("pace") ||
    question.includes("per week")
  ) {
    return `
      <strong>Required Pace</strong>
      <br><br>
      ${intel.weeklyPace.toFixed(1)} lb/week.
      <br><br>
      ${intel.guidance}
    `;
  }

if (
  question.includes("hydrate") ||
  question.includes("hydration") ||
  question.includes("water")
) {
  return `
    <strong>Hydration Guidance</strong>

    <br><br>

    <strong>Assessment</strong>

    <br>

Your hydration habits can directly affect recovery,
energy levels, and competition readiness.
    <br><br>

    <strong>Key Focus</strong>

    <ul>
      <li>Drink consistently throughout the day.</li>
      <li>Hydrate before, during, and after training.</li>
      <li>Increase fluids during hot conditions.</li>
      <li>Monitor hydration habits daily.</li>
      <li>Do not rely on dehydration as a weight-management strategy.</li>
    </ul>
  `;
}

if (
  question.includes("fuel") ||
  question.includes("eat") ||
  question.includes("food") ||
  question.includes("nutrition")
) {
  return `
    <strong>Fueling Guidance</strong>

    <br><br>

    <strong>Assessment</strong>

    <br>

    Food choices should support training energy,
    recovery, and competition performance.

    <br><br>

    <strong>Key Focus</strong>

    <ul>
      <li>Prioritize protein for recovery.</li>
      <li>Use carbohydrates to support training and competition energy.</li>
      <li>Keep food choices consistent near competition.</li>
      <li>Avoid major nutrition changes late in the week.</li>
      <li>Fuel for performance, not just the scale.</li>
    </ul>
  `;
}
if (
  question.includes("after weigh") ||
  question.includes("after weigh-in") ||
  question.includes("after weighins") ||
  question.includes("after weigh ins")
) {
  return `
    <strong>After Weigh-Ins</strong>

    <br><br>

    <strong>Assessment</strong>

    <br>

    The goal after weigh-ins is to restore hydration,
    energy, and performance without overwhelming digestion.

    <br><br>

    <strong>Key Focus</strong>

    <ul>
      <li>Rehydrate steadily.</li>
      <li>Include electrolytes when appropriate.</li>
      <li>Use easy-to-digest carbohydrates.</li>
      <li>Add moderate protein.</li>
      <li>Avoid overeating immediately.</li>
      <li>Focus on performance and recovery.</li>
    </ul>
  `;
}
if (
  question.includes("recover") ||
  question.includes("recovery") ||
  question.includes("tired") ||
  question.includes("sore")
) {
  return `
    <strong>Recovery Guidance</strong>

    <br><br>

    <strong>Assessment</strong>

    <br>

    Recovery supports training quality,
    weight-management success, and competition performance.

    <br><br>

    <strong>Key Focus</strong>

    <ul>
      <li>Protect sleep whenever possible.</li>
      <li>Do not let weight cuts destroy training quality.</li>
      <li>Monitor energy, mood, and soreness.</li>
      <li>Use lighter recovery work when needed.</li>
      <li>Talk with a coach if performance drops significantly.</li>
    </ul>
  `;
}

if (
  question.includes("competition week") ||
  question.includes("tournament week")
) {
  return `
    <strong>Competition Week</strong>

    <br><br>

    <strong>Assessment</strong>

    <br>

    Competition week is about arriving prepared,
    healthy, hydrated, and ready to perform.

    <br><br>

    <strong>Key Focus</strong>

    <ul>
      <li>Maintain consistent sleep.</li>
      <li>Stay hydrated throughout the week.</li>
      <li>Avoid major nutrition changes.</li>
      <li>Reduce unnecessary stress.</li>
      <li>Prepare equipment and travel plans early.</li>
      <li>Review weigh-in requirements.</li>
    </ul>
  `;
}


  return `
    <strong>In lane.</strong>
    <br><br>
    Ask about making weight, pace, remaining weight,
    competition timing, fueling, hydration, recovery,
    or performance.
  `;
}

renderStatus();

analyzeBtn?.addEventListener(
  "click",
  () => {

    const question =
      document
        .getElementById("questionInput")
        .value
        .trim()
        .toLowerCase();

    if (!question) {

      answerOutput.textContent =
        "Need more information.";

      return;
    }

    const inLane =
      question.includes("track") ||
      question.includes("weight") ||
      question.includes("competition") ||
      question.includes("tournament") ||
      question.includes("hydrate") ||
      question.includes("hydration") ||
      question.includes("water") ||
      question.includes("fuel") ||
      question.includes("eat") ||
      question.includes("food") ||
      question.includes("nutrition") ||
      question.includes("recovery") ||
      question.includes("recover") ||
      question.includes("tired") ||
      question.includes("sore") ||
      question.includes("performance") ||
      question.includes("pace") ||
      question.includes("weigh");

    if (inLane) {

answerOutput.innerHTML =
  answerInLane(question);

      return;
    }

    answerOutput.textContent =
      "Out of my lane.";

  }
);