const mealsContainer =
  document.getElementById("mealsContainer");

const setup =
  JSON.parse(
    localStorage.getItem("fuelai-setup") || "{}"
  );

const wiseFlavor =
  setup.wiseFlavor || "sweetspot";

const result =
  JSON.parse(
    localStorage.getItem("fuelwise_fridge_result") || "{}"
  );

const meals =
  result.suggestedMeals || [];

/* =========================
   FLAVOR HEADER
========================= */

function getFlavorHeader() {

  switch (wiseFlavor) {

    case "mafia":
      return `
        <p class="feedback">
          Tonight’s lookin’ pretty manageable honestly.
        </p>
      `;

    case "toughguy":
      return `
        <p class="feedback">
          Fast meals. Low excuses. Let’s move.
        </p>
      `;

    case "internet":
      return `
        <p class="feedback">
          Fridge kinda carried ngl.
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

/* =========================
   RENDER
========================= */

mealsContainer.innerHTML = `

  ${getFlavorHeader()}

  <p class="feedback">
    <strong>Detected:</strong>
    ${(result.detectedItems || []).join(", ") || "No clear items detected"}
  </p>

  ${
    result.possibleItems?.length
      ? `
        <p class="feedback">
          <strong>Maybe:</strong>
          ${result.possibleItems.join(", ")}
        </p>
      `
      : ""
  }

  ${
    result.unclearItems?.length
      ? `
        <p class="feedback">
          <strong>Unclear:</strong>
          ${result.unclearItems.join(", ")}
        </p>
      `
      : ""
  }

  <div class="history-section">

    ${meals.map(meal => `

      <div class="history-item">

        <strong>${meal.name}</strong>

        <div class="history-meta">
          ${meal.time || ""}
        </div>

        <p class="feedback">
          ${meal.whyItWorks || ""}
        </p>

        <p class="feedback">
          <strong>Uses:</strong>
          ${(meal.uses || []).join(", ") || "Items from your fridge"}
        </p>

        <p class="feedback">
          <strong>Need:</strong>
          ${(meal.needs || []).join(", ") || "Nothing extra"}
        </p>

        ${
          meal.steps?.length
            ? `
              <ol class="meal-steps">
                ${meal.steps.map(step => `
                  <li>${step}</li>
                `).join("")}
              </ol>
            `
            : ""
        }

      </div>

    `).join("")}

  </div>

  <div class="history-item">

    <strong>Quick Grocery List</strong>

    <p class="feedback">
      ${(result.groceryList || []).join(", ") || "No extra groceries needed"}
    </p>

  </div>

`;