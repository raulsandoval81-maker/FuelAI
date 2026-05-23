function renderCharacterFace(targetId) {

  const target =
    document.getElementById(targetId);

  if (!target) return;

  const setup =
    JSON.parse(
      localStorage.getItem("fuelai-setup") || "{}"
    );

  const flavor =
    setup.wiseFlavor || "sweetspot";

  target.className =
    `character-face ${flavor}`;
}