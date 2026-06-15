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

if (!plan) {

statusOutput.textContent =
"Complete WeightWise setup first.";

} else {

statusOutput.innerHTML = `
Competition:
${plan.competitionName || "Not Set"} <br><br>


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


`;

}

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

if (
  question.includes("track") ||
  question.includes("weight") ||
  question.includes("competition") ||
  question.includes("hydrate") ||
  question.includes("fuel") ||
  question.includes("performance")
) {

  if (!plan) {

    responseOutput.textContent =
      "Complete WeightWise setup first.";

    return;
  }

  responseOutput.innerHTML = `
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

    In lane.
    Intelligence integration coming soon.
  `;

  return;
}

responseOutput.textContent =
  "Out of my lane.";

}
);
