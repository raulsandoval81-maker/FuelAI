const MEAL_HISTORY_KEY =
  "fuelai-history";

const MEAL_HISTORY_LIMIT = 5;
const MEAL_HISTORY_DAYS = 42;
const DAY_MS =
  24 * 60 * 60 * 1000;


function boundedText(
  value,
  maxLength = 160
) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}


function mealTimestamp(
  meal
) {
  return new Date(
    meal?.createdAt
  ).getTime();
}


function sanitizeMeal(
  meal,
  now = Date.now()
) {
  return {
    mealName:
      boundedText(
        meal?.mealName ||
        "Meal Scan"
      ),
    calories:
      boundedText(meal?.calories, 40),
    protein:
      boundedText(meal?.protein, 40),
    carbs:
      boundedText(meal?.carbs, 40),
    fats:
      boundedText(meal?.fats, 40),
    goal:
      boundedText(meal?.goal, 40),
    confidence:
      boundedText(meal?.confidence, 80),
    createdAt:
      new Date(
        Number.isFinite(
          mealTimestamp(meal)
        )
          ? mealTimestamp(meal)
          : now
      ).toISOString()
  };
}


function pruneRecentMeals(
  meals,
  now = Date.now()
) {
  const cutoff =
    now -
    MEAL_HISTORY_DAYS * DAY_MS;


  return (
    Array.isArray(meals)
      ? meals
      : []
  )
    .filter(
      meal => {
        const timestamp =
          mealTimestamp(meal);

        return (
          Number.isFinite(timestamp) &&
          timestamp >= cutoff
        );
      }
    )
    .sort(
      (left, right) =>
        mealTimestamp(right) -
        mealTimestamp(left)
    )
    .slice(0, MEAL_HISTORY_LIMIT)
    .map(
      meal => sanitizeMeal(meal, now)
    );
}


function readStoredMeals(
  storage
) {
  try {
    const stored = JSON.parse(
      storage.getItem(
        MEAL_HISTORY_KEY
      ) || "[]"
    );

    return Array.isArray(stored)
      ? stored
      : [];
  } catch {
    return [];
  }
}


function loadRecentMeals(
  storage = globalThis.localStorage,
  now = Date.now()
) {
  if (!storage) {
    return [];
  }

  const stored =
    readStoredMeals(storage);
  const cleaned =
    pruneRecentMeals(stored, now);


  if (
    JSON.stringify(cleaned) !==
    JSON.stringify(stored)
  ) {
    storage.setItem(
      MEAL_HISTORY_KEY,
      JSON.stringify(cleaned)
    );
  }


  return cleaned;
}


function saveRecentMeal(
  meal,
  storage = globalThis.localStorage,
  now = Date.now()
) {
  if (!storage) {
    return [];
  }

  const existing =
    loadRecentMeals(storage, now);
  const next =
    pruneRecentMeals(
      [
        sanitizeMeal(meal, now),
        ...existing
      ],
      now
    );


  storage.setItem(
    MEAL_HISTORY_KEY,
    JSON.stringify(next)
  );


  return next;
}


function appendText(
  parent,
  tagName,
  className,
  value,
  documentRef
) {
  const element =
    documentRef.createElement(tagName);

  if (className) {
    element.className = className;
  }

  element.textContent = value;
  parent.appendChild(element);
  return element;
}


function renderRecentMeals(
  container,
  meals,
  documentRef =
    container?.ownerDocument ||
    globalThis.document
) {
  if (!container || !documentRef) {
    return;
  }

  container.replaceChildren();

  if (!meals.length) {
    appendText(
      container,
      "p",
      "recent-meals-empty",
      "No committed meals yet.",
      documentRef
    );
    return;
  }

  meals.forEach(
    meal => {
      const card =
        documentRef.createElement(
          "article"
        );
      card.className =
        "recent-meal-card";

      appendText(
        card,
        "h3",
        "",
        meal.mealName || "Meal Scan",
        documentRef
      );

      appendText(
        card,
        "p",
        "recent-meal-macros",
        [
          `${meal.calories || "—"} calories`,
          `${meal.protein || "—"} protein`,
          `${meal.carbs || "—"} carbs`,
          `${meal.fats || "—"} fat`
        ].join(" · "),
        documentRef
      );

      appendText(
        card,
        "p",
        "recent-meal-meta",
        new Date(
          meal.createdAt
        ).toLocaleString(),
        documentRef
      );

      container.appendChild(card);
    }
  );
}


export {
  MEAL_HISTORY_DAYS,
  MEAL_HISTORY_KEY,
  MEAL_HISTORY_LIMIT,
  loadRecentMeals,
  pruneRecentMeals,
  renderRecentMeals,
  sanitizeMeal,
  saveRecentMeal
};
