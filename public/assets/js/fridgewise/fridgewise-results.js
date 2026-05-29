console.log(
  "FRIDGEWISE RESULTS LOADED"
);

const result =
  JSON.parse(
    localStorage.getItem(
      "fuelwise_fridge_result"
    ) || "{}"
  );

const mealsContainer =
  document.getElementById(
    "mealsContainer"
  );

const meals =
  result.suggestedMeals || [];

if (!mealsContainer) {
  console.warn(
    "No mealsContainer found."
  );
} else {

  mealsContainer.innerHTML = `

    <p class="feedback">
      <strong>🧊 Detected:</strong>
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

    <div class="history-section">

      ${meals.map(meal => `

        <div class="history-item meal-card">

          <div class="meal-top">

            <div>

              <strong class="meal-title">
                ${
                  meal.type === "snack"
                    ? "🥨 Quick Snack"
                    : "🍽️ Quick Meal"
                }
              </strong>

              <div class="history-meta">
                ${meal.name}
              </div>

            </div>

            <div class="meal-time">
              ⏱️ ${meal.time || "10 min"}
            </div>

          </div>

          <p class="feedback">
            ${meal.whyItWorks || ""}
          </p>

          <p class="feedback">
            <strong>🧊 Uses:</strong>
            ${(meal.uses || []).join(", ") || "Items from your fridge"}
          </p>

          <p class="feedback">
            <strong>🛒 Needs:</strong>
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

          <button
            class="secondary-btn make-this-btn"
            data-meal="${meal.name}"
            data-needs='${JSON.stringify(meal.needs || [])}'
            type="button"
          >
            ✅ Make This
          </button>

        </div>

      `).join("")}

    </div>

    <div class="history-item grocery-card">

      <strong>
        🛒 Quick Grocery List
      </strong>

      <p class="feedback">
        ${(result.groceryList || []).join(", ") || "No extra groceries needed"}
      </p>

    </div>

  `;
}

document.addEventListener(
  "click",
  (e) => {

    const btn =
      e.target.closest(
        ".make-this-btn"
      );

    if (!btn) return;

    const mealName =
      btn.dataset.meal;

    const needs =
      JSON.parse(
        btn.dataset.needs || "[]"
      );

    const memory =
      window.FridgeWiseMemory?.getAll?.();

    if (memory) {

      memory.groceryList =
        memory.groceryList || [];

      needs.forEach((item) => {

        const clean =
          String(item || "")
            .trim()
            .toLowerCase();

        if (
          clean &&
          !memory.groceryList.includes(clean)
        ) {
          memory.groceryList.push(clean);
        }

      });

      localStorage.setItem(
        "fuelai-last-meal",
        mealName
      );

      window.FridgeWiseMemory.save(
        memory
      );
    }

    alert(
      "Added missing ingredients to Grocery List."
    );

  }
);