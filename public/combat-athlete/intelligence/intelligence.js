const analyzeBtn =
  document.getElementById("analyzeBtn");

const responseOutput =
  document.getElementById("responseOutput");

const statusOutput =
  document.getElementById("statusOutput");

const plan =
  JSON.parse(
    localStorage.getItem(
      "fuelai-weightwise-beta"
    ) || "null"
  );

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
    status
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
      ${intel.status}.
      <br><br>

      You have ${intel.weightRemaining.toFixed(1)} lb remaining
      with ${intel.daysRemaining} days left.
      <br><br>

      Required pace:
      ${intel.weeklyPace.toFixed(1)} lb/week.
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

      responseOutput.textContent =
        "Need more information.";

      return;
    }

    const inLane =
      question.includes("track") ||
      question.includes("weight") ||
      question.includes("competition") ||
      question.includes("hydrate") ||
      question.includes("hydration") ||
      question.includes("fuel") ||
      question.includes("recovery") ||
      question.includes("performance") ||
      question.includes("pace") ||
      question.includes("weigh");

    if (inLane) {

      responseOutput.innerHTML =
        answerInLane(question);

      return;
    }

    responseOutput.textContent =
      "Out of my lane.";

  }
);