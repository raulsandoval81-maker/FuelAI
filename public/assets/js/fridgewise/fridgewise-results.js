console.log(
  "FRIDGEWISE RESULTS LOADED"
);

const RESULT_STORAGE_KEY =
  "fuelwise_fridge_result";

const LAST_MEAL_STORAGE_KEY =
  "fuelai-last-meal";

function getStoredResult() {
  try {
    return JSON.parse(
      localStorage.getItem(
        RESULT_STORAGE_KEY
      ) || "{}"
    );
  } catch (error) {
    console.warn(
      "Could not read FridgeWise result.",
      error
    );

    return {};
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeList(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map(normalizeText)
    .filter(Boolean);
}

function createTextElement(
  tagName,
  className,
  text
) {
  const element =
    document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  element.textContent = text;

  return element;
}

const result =
  getStoredResult();

const mealsContainer =
  document.getElementById(
    "mealsContainer"
  );

const meals =
  Array.isArray(result.suggestedMeals)
    ? result.suggestedMeals
    : [];

function renderSummary(container) {
  const detectedItems =
    normalizeList(result.detectedItems);

  const detected =
    document.createElement("p");

  detected.className =
    "feedback";

  const detectedLabel =
    document.createElement("strong");

  detectedLabel.textContent =
    "🧊 Detected: ";

  detected.append(
    detectedLabel,
    document.createTextNode(
      detectedItems.join(", ") ||
      "No clear items detected"
    )
  );

  container.appendChild(detected);

  const possibleItems =
    normalizeList(result.possibleItems);

  if (!possibleItems.length) {
    return;
  }

  const possible =
    document.createElement("p");

  possible.className =
    "feedback";

  const possibleLabel =
    document.createElement("strong");

  possibleLabel.textContent =
    "Maybe: ";

  possible.append(
    possibleLabel,
    document.createTextNode(
      possibleItems.join(", ")
    )
  );

  container.appendChild(possible);
}

function createFeedbackRow(
  label,
  value
) {
  const paragraph =
    document.createElement("p");

  paragraph.className =
    "feedback";

  const strong =
    document.createElement("strong");

  strong.textContent =
    label;

  paragraph.append(
    strong,
    document.createTextNode(value)
  );

  return paragraph;
}

function createMealCard(meal) {
  const card =
    document.createElement("article");

  card.className =
    "history-item meal-card";

  const mealName =
    normalizeText(meal.name) ||
    "Meal idea";

  const mealType =
    meal.type === "snack"
      ? "🥨 Quick Snack"
      : "🍽️ Quick Meal";

  const mealTime =
    normalizeText(meal.time) ||
    "10 min";

  const uses =
    normalizeList(meal.uses);

  const needs =
    normalizeList(meal.needs);

  const steps =
    normalizeList(meal.steps);

  const top =
    document.createElement("div");

  top.className =
    "meal-top";

  const headingWrap =
    document.createElement("div");

  headingWrap.append(
    createTextElement(
      "strong",
      "meal-title",
      mealType
    ),
    createTextElement(
      "div",
      "history-meta",
      mealName
    )
  );

  const time =
    createTextElement(
      "div",
      "meal-time",
      `⏱️ ${mealTime}`
    );

  top.append(
    headingWrap,
    time
  );

  card.appendChild(top);

  const whyItWorks =
    normalizeText(meal.whyItWorks);

  if (whyItWorks) {
    card.appendChild(
      createTextElement(
        "p",
        "feedback",
        whyItWorks
      )
    );
  }

  card.appendChild(
    createFeedbackRow(
      "🧊 Uses: ",
      uses.join(", ") ||
      "Items from your fridge"
    )
  );

  card.appendChild(
    createFeedbackRow(
      "🛒 Needs: ",
      needs.join(", ") ||
      "Nothing extra"
    )
  );

  if (steps.length) {
    const list =
      document.createElement("ol");

    list.className =
      "meal-steps";

    steps.forEach((step) => {
      const item =
        document.createElement("li");

      item.textContent =
        step;

      list.appendChild(item);
    });

    card.appendChild(list);
  }

  const button =
    document.createElement("button");

  button.className =
    "secondary-btn make-this-btn";

  button.type =
    "button";

  button.textContent =
    "✅ Make This";

  button.dataset.meal =
    mealName;

  button._mealNeeds =
    needs;

  card.appendChild(button);

  return card;
}

function renderMeals(container) {
  const historySection =
    document.createElement("div");

  historySection.className =
    "history-section";

  if (!meals.length) {
    const empty =
      document.createElement("div");

    empty.className =
      "history-item meal-card";

    empty.append(
      createTextElement(
        "strong",
        "meal-title",
        "No meal ideas yet"
      ),
      createTextElement(
        "p",
        "feedback",
        "Return to FridgeWise and add or scan more food to generate suggestions."
      )
    );

    historySection.appendChild(
      empty
    );
  } else {
    meals.forEach((meal) => {
      historySection.appendChild(
        createMealCard(meal)
      );
    });
  }

  container.appendChild(
    historySection
  );
}

function renderGrocerySummary(
  container
) {
  const groceryList =
    normalizeList(result.groceryList);

  const card =
    document.createElement("div");

  card.className =
    "history-item grocery-card";

  card.append(
    createTextElement(
      "strong",
      "",
      "🛒 Quick Grocery List"
    ),
    createTextElement(
      "p",
      "feedback",
      groceryList.join(", ") ||
      "No extra groceries needed"
    )
  );

  container.appendChild(card);
}

function renderResults() {
  if (!mealsContainer) {
    console.warn(
      "No mealsContainer found."
    );

    return;
  }

  mealsContainer.innerHTML = "";

  renderSummary(
    mealsContainer
  );

  renderMeals(
    mealsContainer
  );

  renderGrocerySummary(
    mealsContainer
  );

  mealsContainer.setAttribute(
    "aria-busy",
    "false"
  );
}

function addMealNeedsToGroceryList(
  mealName,
  needs
) {
  const memory =
    window.FridgeWiseMemory
      ?.getAll?.();

  if (!memory) {
    alert(
      "FridgeWise memory is unavailable."
    );

    return;
  }

  memory.groceryList =
    Array.isArray(memory.groceryList)
      ? memory.groceryList
      : [];

  const existingItems =
    new Set(
      memory.groceryList.map(
        item =>
          normalizeText(item)
            .toLowerCase()
      )
    );

  let addedCount = 0;

  needs.forEach((item) => {
    const clean =
      normalizeText(item);

    const comparisonKey =
      clean.toLowerCase();

    if (
      !clean ||
      existingItems.has(
        comparisonKey
      )
    ) {
      return;
    }

    memory.groceryList.push(
      clean
    );

    existingItems.add(
      comparisonKey
    );

    addedCount += 1;
  });

  localStorage.setItem(
    LAST_MEAL_STORAGE_KEY,
    mealName
  );

  window.FridgeWiseMemory
    ?.save?.(memory);

  alert(
    addedCount
      ? `${addedCount} missing ${
          addedCount === 1
            ? "ingredient"
            : "ingredients"
        } added to your Grocery List.`
      : "This meal does not need any new grocery items."
  );
}

document.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest(
        ".make-this-btn"
      );

    if (!button) return;

    const mealName =
      normalizeText(
        button.dataset.meal
      ) || "Selected meal";

    const needs =
      Array.isArray(
        button._mealNeeds
      )
        ? button._mealNeeds
        : [];

    addMealNeedsToGroceryList(
      mealName,
      needs
    );
  }
);

renderResults();