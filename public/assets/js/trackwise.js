const streakOutput =
  document.getElementById("streakOutput");

const waterOutput =
  document.getElementById("waterOutput");

const calorieOutput =
  document.getElementById("calorieOutput");

const proteinOutput =
  document.getElementById("proteinOutput");

const carbOutput =
  document.getElementById("carbOutput");

const fatOutput =
  document.getElementById("fatOutput");

const addWaterBtn =
  document.getElementById("addWaterBtn");


let water =
  Number(
    localStorage.getItem("fuelai-water")
  ) || 0;

function renderWater() {

  waterOutput.textContent =
    `${water} / 8 Cups`;

}

addWaterBtn?.addEventListener(
  "click",
  () => {

    water++;

    if (water > 8) {
      water = 8;
    }

    localStorage.setItem(
      "fuelai-water",
      water
    );

    renderWater();

  }
);

renderWater();


// FUELAI LOG

if (window.FuelAILog) {

  const summary =
    FuelAILog.getDailySummary?.() || {};

  calorieOutput.textContent =
    summary.calories || 0;

  proteinOutput.textContent =
    `${summary.protein || 0}g`;

  carbOutput.textContent =
    `${summary.carbs || 0}g`;

  fatOutput.textContent =
    `${summary.fats || 0}g`;

}


// TEMP STREAK

const streak =
  Number(
    localStorage.getItem("fuelai-streak")
  ) || 0;

streakOutput.textContent =
  `${streak} Days`;