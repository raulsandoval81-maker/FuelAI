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

  if (
    question.includes("track") ||
    question.includes("on track") ||
    question.includes("make weight") ||
    question.includes("can i make")
  ) {
    return `
      <strong>${intel.status}.</strong>
      <br><br>

      You have ${intel.weightRemaining.toFixed(1)} lb remaining
      with ${intel.daysRemaining} days left.
      <br><br>

      Required pace:
      ${intel.weeklyPace.toFixed(1)} lb/week.
      <br><br>

      ${intel.guidance}
      ${renderList(COMBAT_KNOWLEDGE.makingWeight)}
    `;
  }

  if (
    question.includes("how much") ||
    question.includes("remain") ||
    question.includes("left")
  ) {
    return `
      Weight remaining:
      ${intel.weightRemaining.toFixed(1)} lb.
    `;
  }

  if (
    question.includes("pace") ||
    question.includes("per week")
  ) {
    return `
      Required pace:
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
      Hydration guidance:
      ${renderList(COMBAT_KNOWLEDGE.hydration)}
    `;
  }

  if (
    question.includes("fuel") ||
    question.includes("eat") ||
    question.includes("food") ||
    question.includes("nutrition")
  ) {
    return `
      Fueling guidance:
      ${renderList(COMBAT_KNOWLEDGE.fueling)}
    `;
  }

  if (
    question.includes("after weigh") ||
    question.includes("after weigh-in") ||
    question.includes("after weighins") ||
    question.includes("after weigh ins")
  ) {
    return `
      After weigh-ins:
      ${renderList(COMBAT_KNOWLEDGE.afterWeighIns)}
    `;
  }

  if (
    question.includes("recover") ||
    question.includes("recovery") ||
    question.includes("tired") ||
    question.includes("sore")
  ) {
    return `
      Recovery guidance:
      ${renderList(COMBAT_KNOWLEDGE.recovery)}
    `;
  }

  if (
    question.includes("competition week") ||
    question.includes("tournament week")
  ) {
    return `
      Competition week:
      ${renderList(COMBAT_KNOWLEDGE.competitionWeek)}
    `;
  }

  return `
    In lane.
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