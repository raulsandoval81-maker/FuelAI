function getFuelAISetup() {

  return JSON.parse(
    localStorage.getItem("fuelai-setup") || "{}"
  );

}

function getCharacterFlavor() {

  const setup =
    getFuelAISetup();

  return (
    setup.wiseFlavor ||
    "sweetspot"
  );

}

function applyCharacterFlavor(target) {

  const flavor =
    getCharacterFlavor();

  target.className =
    "character-face";

  target.innerHTML = `
    <div class="face-glow"></div>
    <div class="face-hair"></div>
    <div class="face-hat"></div>
    <div class="face-headphones"></div>
    <div class="face-head"></div>
    <div class="face-neck"></div>
    <div class="face-body"></div>
    <div class="face-collar"></div>
  `;

  if (flavor === "mafia") {

    target.classList.add("mafia");

  }

  else if (flavor === "toughguy") {

    target.classList.add("toughguy");

  }

  else if (flavor === "internet") {

    target.classList.add("internet");

  }

  else {

    target.classList.add("sweetspot");

  }

}

function renderCharacterFace(targetId) {

  const target =
    document.getElementById(targetId);

  if (!target) return;

  applyCharacterFlavor(target);

}

window.FuelAICharacter = {
  getCharacterFlavor,
  renderCharacterFace
};