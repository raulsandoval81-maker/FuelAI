function getFuelAISetup() {
  return JSON.parse(
    localStorage.getItem("fuelai-setup") || "{}"
  );
}

function getCharacterFace() {
  const setup = getFuelAISetup();

  const flavor =
    setup.wiseFlavor || "sweetspot";

  const faces = {
    sweetspot: "🙂",
    mafia: "😎",
    toughguy: "💪",
    internet: "🛜"
  };

  return faces[flavor] || faces.sweetspot;
}

function renderCharacterFace(targetId) {
  const target =
    document.getElementById(targetId);

  if (!target) return;

  target.textContent = getCharacterFace();
}

window.FuelAICharacter = {
  getCharacterFace,
  renderCharacterFace
};