function getFlavorHeader() {

  switch (wiseFlavor) {

    case "mafia":
      return `
        <p class="feedback">
          Alright. Simple meal moves from what’s already there.
        </p>
      `;

    case "toughguy":
      return `
        <p class="feedback">
          Fast meals. Simple choices. Let’s move.
        </p>
      `;

    case "internet":
      return `
        <p class="feedback">
          Fridge gave us enough to work with.
        </p>
      `;

    default:
      return `
        <p class="feedback">
          Simple ideas using what you already have.
        </p>
      `;
  }
}