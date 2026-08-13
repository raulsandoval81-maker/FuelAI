"use strict";


/* =========================
   CONSTANTS
========================= */

const RESULT_STORAGE_KEY =
  "fuelwise_fridge_result";

const LAST_MEAL_STORAGE_KEY =
  "fuelai-last-meal";


const Memory =
  window.FridgeWiseMemory;


const mealsContainer =
  document.getElementById(
    "mealsContainer"
  );


const mealNeedsByButton =
  new WeakMap();



/* =========================
   HELPERS
========================= */

function normalizeText(
  value
) {

  return String(
    value ?? ""
  ).trim();

}


function normalizeCompare(
  value
) {

  return normalizeText(
    value
  ).toLowerCase();

}


function normalizeList(
  items
) {

  if (
    !Array.isArray(
      items
    )
  ) {
    return [];
  }


  const seen =
    new Set();


  return items
    .map(
      normalizeText
    )
    .filter(
      (item) => {

        if (
          !item
        ) {
          return false;
        }


        const key =
          normalizeCompare(
            item
          );


        if (
          seen.has(
            key
          )
        ) {
          return false;
        }


        seen.add(
          key
        );


        return true;

      }
    );

}


function getStoredResult() {

  try {

    const result =
      JSON.parse(
        localStorage.getItem(
          RESULT_STORAGE_KEY
        ) || "{}"
      );


    return (
      result &&
      typeof result ===
      "object"
        ? result
        : {}
    );

  } catch {

    return {};

  }

}


function createTextElement(
  tagName,
  className,
  text
) {

  const element =
    document.createElement(
      tagName
    );


  if (
    className
  ) {

    element.className =
      className;

  }


  element.textContent =
    text;


  return element;

}


function createFeedbackRow(
  label,
  value
) {

  const paragraph =
    document.createElement(
      "p"
    );


  paragraph.className =
    "feedback";


  const strong =
    document.createElement(
      "strong"
    );


  strong.textContent =
    label;


  paragraph.append(
    strong,
    document.createTextNode(
      value
    )
  );


  return paragraph;

}



/* =========================
   RESULT
========================= */

const result =
  getStoredResult();


const meals =
  Array.isArray(
    result.suggestedMeals
  )
    ? result.suggestedMeals
    : [];



/* =========================
   SUMMARY
========================= */

function renderSummary(
  container
) {

  const detectedItems =
    normalizeList(
      result.detectedItems
    );


  const detected =
    document.createElement(
      "p"
    );


  detected.className =
    "feedback";


  const detectedLabel =
    document.createElement(
      "strong"
    );


  detectedLabel.textContent =
    "🧊 Detected: ";


  detected.append(
    detectedLabel,

    document.createTextNode(
      detectedItems.join(
        ", "
      ) ||
      "No clear items detected"
    )
  );


  container.appendChild(
    detected
  );


  const possibleItems =
    normalizeList(
      result.possibleItems
    );


  if (
    !possibleItems.length
  ) {
    return;
  }


  const possible =
    document.createElement(
      "p"
    );


  possible.className =
    "feedback";


  const possibleLabel =
    document.createElement(
      "strong"
    );


  possibleLabel.textContent =
    "Maybe: ";


  possible.append(
    possibleLabel,

    document.createTextNode(
      possibleItems.join(
        ", "
      )
    )
  );


  container.appendChild(
    possible
  );

}



/* =========================
   MEAL CARD
========================= */

function createMealCard(
  meal
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "history-item meal-card";


  const mealName =
    normalizeText(
      meal?.name
    ) ||
    "Meal idea";


  const mealType =
    meal?.type ===
    "snack"
      ? "🥨 Quick Snack"
      : "🍽️ Quick Meal";


  const mealTime =
    normalizeText(
      meal?.time
    ) ||
    "10 min";


  const uses =
    normalizeList(
      meal?.uses
    );


  const needs =
    normalizeList(
      meal?.needs
    );


  const steps =
    normalizeList(
      meal?.steps
    );


  const top =
    document.createElement(
      "div"
    );


  top.className =
    "meal-top";


  const headingWrap =
    document.createElement(
      "div"
    );


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


  card.appendChild(
    top
  );


  const whyItWorks =
    normalizeText(
      meal?.whyItWorks
    );


  if (
    whyItWorks
  ) {

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
      uses.join(
        ", "
      ) ||
      "Items from your fridge"
    )
  );


  card.appendChild(
    createFeedbackRow(
      "🛒 Needs: ",
      needs.join(
        ", "
      ) ||
      "Nothing extra"
    )
  );


  if (
    steps.length
  ) {

    const list =
      document.createElement(
        "ol"
      );


    list.className =
      "meal-steps";


    steps.forEach(
      (step) => {

        const item =
          document.createElement(
            "li"
          );


        item.textContent =
          step;


        list.appendChild(
          item
        );

      }
    );


    card.appendChild(
      list
    );

  }


  const button =
    document.createElement(
      "button"
    );


  button.className =
    "secondary-btn make-this-btn";


  button.type =
    "button";


  button.textContent =
    needs.length
      ? "✅ Make This"
      : "✅ Make This — Ready";


  button.dataset.meal =
    mealName;


  mealNeedsByButton.set(
    button,
    needs
  );


  card.appendChild(
    button
  );


  return card;

}



/* =========================
   MEALS
========================= */

function renderMeals(
  container
) {

  const historySection =
    document.createElement(
      "div"
    );


  historySection.className =
    "history-section";


  if (
    !meals.length
  ) {

    const empty =
      document.createElement(
        "div"
      );


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
        "Return to FridgeWise and scan more food or update Cabinet Drawer to generate better suggestions."
      )
    );


    historySection.appendChild(
      empty
    );

  } else {

    meals.forEach(
      (meal) => {

        historySection.appendChild(
          createMealCard(
            meal
          )
        );

      }
    );

  }


  container.appendChild(
    historySection
  );

}



/* =========================
   GROCERY SUMMARY
========================= */

function renderGrocerySummary(
  container
) {

  const groceryList =
    normalizeList(
      result.groceryList
    );


  const card =
    document.createElement(
      "div"
    );


  card.className =
    "history-item grocery-card";


  card.append(
    createTextElement(
      "strong",
      "",
      "🛒 Suggested Grocery Items"
    ),

    createTextElement(
      "p",
      "feedback",
      groceryList.join(
        ", "
      ) ||
      "No extra groceries suggested"
    )
  );


  container.appendChild(
    card
  );

}



/* =========================
   RENDER
========================= */

function renderResults() {

  if (
    !mealsContainer
  ) {
    return;
  }


  mealsContainer.innerHTML =
    "";


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



/* =========================
   SELECT MEAL
========================= */

function addMealNeedsToGroceryList(
  mealName,
  needs
) {

  if (
    !Memory
  ) {

    alert(
      "FridgeWise memory is unavailable."
    );

    return;

  }


  const cleanNeeds =
    normalizeList(
      needs
    );


  const memory =
    Memory.getAll?.();


  if (
    !memory
  ) {

    alert(
      "FridgeWise memory is unavailable."
    );

    return;

  }


  const existing =
    new Set(
      normalizeList(
        memory.groceryList
      ).map(
        normalizeCompare
      )
    );


  let addedCount =
    0;


  cleanNeeds.forEach(
    (item) => {

      const key =
        normalizeCompare(
          item
        );


      if (
        !key ||
        existing.has(
          key
        )
      ) {
        return;
      }


      /*
       * Use central memory API.
       */

      Memory.addItem?.(
        "groceryList",
        item
      );


      existing.add(
        key
      );


      addedCount++;

    }
  );


  localStorage.setItem(
    LAST_MEAL_STORAGE_KEY,
    mealName
  );


  return addedCount;

}



/* =========================
   CLICK HANDLER
========================= */

document.addEventListener(
  "click",
  (event) => {

    const target =
      event.target;


    if (
      !(
        target instanceof
        Element
      )
    ) {
      return;
    }


    const button =
      target.closest(
        ".make-this-btn"
      );


    if (
      !button
    ) {
      return;
    }


    const mealName =
      normalizeText(
        button.dataset.meal
      ) ||
      "Selected meal";


    const needs =
      mealNeedsByButton.get(
        button
      ) ||
      [];


    const addedCount =
      addMealNeedsToGroceryList(
        mealName,
        needs
      );


    button.textContent =
      "✅ Meal Selected";


    button.disabled =
      true;


    if (
      !needs.length
    ) {

      alert(
        `${mealName} is ready with what you already have.`
      );

      return;

    }


    if (
      addedCount > 0
    ) {

      alert(
        `${addedCount} missing ${
          addedCount === 1
            ? "ingredient"
            : "ingredients"
        } added to your Grocery List.`
      );

      return;

    }


    alert(
      "The missing ingredients are already on your Grocery List."
    );

  }
);



/* =========================
   START
========================= */

renderResults();