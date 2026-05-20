const saveSetupBtn = document.getElementById("saveSetupBtn");

if (saveSetupBtn) {

  saveSetupBtn.addEventListener("click", () => {

    const setup = {
      height: document.getElementById("heightInput").value,
      weight: document.getElementById("weightInput").value,
      targetWeight: document.getElementById("targetWeightInput").value,
      ageRange: document.getElementById("ageRange").value,
      gender: document.getElementById("genderType").value,
      goal: document.getElementById("goalSelect").value
    };

    localStorage.setItem(
      "fuelai-setup",
      JSON.stringify(setup)
    );

    window.location.href = "/app.html";

  });

}


/* ------------------------- */
/* Suggested Guidance Logic */
/* ------------------------- */

const heightInput =
  document.getElementById("heightInput");

const weightInput =
  document.getElementById("weightInput");

const ageRange =
  document.getElementById("ageRange");

const genderType =
  document.getElementById("genderType");

const rangeOutput =
  document.getElementById("rangeOutput");


function updateGuidance() {

  const height =
    heightInput.value.trim();

  const weight =
    parseInt(weightInput.value);

  if (!height || !weight) {

    rangeOutput.textContent =
      "Enter height and weight";

    return;
  }

  let low = weight - 10;
  let high = weight + 10;

  let direction = "Maintain";

  if (weight > high - 3) {
    direction = "Gradual Cut";
  }

  if (weight < low + 3) {
    direction = "Gradual Gain";
  }

  rangeOutput.innerHTML = `
    General performance range:
    ${low}–${high} lbs

    <br><br>

    Current weight:
    ${weight} lbs

    <br><br>

    Direction:
    ${direction}
  `;
}


heightInput.addEventListener(
  "input",
  updateGuidance
);

weightInput.addEventListener(
  "input",
  updateGuidance
);

ageRange.addEventListener(
  "change",
  updateGuidance
);

genderType.addEventListener(
  "change",
  updateGuidance
);