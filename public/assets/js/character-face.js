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

  target.classList.remove(
    "sweetspot",
    "mafia",
    "toughguy",
    "internet"
  );

  target.classList.add(flavor);

}

function renderCharacterFace(targetId) {

  const target =
    document.getElementById(targetId);

  if (!target) return;

  target.innerHTML = `
    <div class="face-head"></div>
    <div class="face-body"></div>
  `;

  applyCharacterFlavor(target);

}

window.FuelAICharacter = {
  getCharacterFlavor,
  renderCharacterFace
};