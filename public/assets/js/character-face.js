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

function getGuideType() {

  const setup =
    getFuelAISetup();

  return (
    setup.guideType ||
    "wiseguy"
  );

}

function applyCharacterFlavor(target) {

  const flavor =
    getCharacterFlavor();

  const guideType =
    getGuideType();

  target.className =
    "character-face";

  target.classList.add(flavor);

  target.classList.add(guideType);

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

}

function renderCharacterFace(targetId) {

  const target =
    document.getElementById(targetId);

  if (!target) return;

  applyCharacterFlavor(target);

}

window.FuelAICharacter = {
  getCharacterFlavor,
  getGuideType,
  renderCharacterFace
};