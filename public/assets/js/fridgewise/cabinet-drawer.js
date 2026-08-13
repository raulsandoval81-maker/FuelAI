"use strict";


/* =========================
   MEMORY
========================= */

const Memory =
  window.FridgeWiseMemory;


/*
 * Real inventory starts empty.
 * FridgeWise should never assume
 * a user owns food they did not add.
 */

const DEFAULTS = {
  pantry: [],
  freezer: [],
  extras: [],
  groceryList: [],
  favoriteMeals: []
};



/* =========================
   HELPERS
========================= */

function safeArray(
  value
) {

  return Array.isArray(
    value
  )
    ? value
    : [];

}


function normalizeForCompare(
  value
) {

  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();

}


function normalizeTextArray(
  value
) {

  return safeArray(
    value
  )
    .map(
      (item) =>
        String(
          item ?? ""
        ).trim()
    )
    .filter(
      Boolean
    );

}


function normalizeFavoriteMeals(
  value
) {

  return safeArray(
    value
  )
    .map(
      (meal) => {

        if (
          typeof meal ===
          "string"
        ) {

          return {
            name:
              meal.trim(),

            ingredients:
              []
          };

        }


        return {
          name:
            String(
              meal?.name ??
              ""
            ).trim(),

          ingredients:
            normalizeTextArray(
              meal?.ingredients
            )
        };

      }
    )
    .filter(
      (meal) =>
        meal.name
    );

}



/* =========================
   LOAD
========================= */

function loadDrawerData() {

  let stored =
    {};


  try {

    if (
      Memory?.getAll
    ) {

      stored =
        Memory.getAll() ||
        {};

    } else {

      stored =
        JSON.parse(
          localStorage.getItem(
            "fuelai-fridgewise-memory"
          ) ||
          "{}"
        );

    }

  } catch {

    stored =
      {};

  }


  return {

    pantry:
      normalizeTextArray(
        stored.pantry
      ),

    freezer:
      normalizeTextArray(
        stored.freezer
      ),

    extras:
      normalizeTextArray(
        stored.extras
      ),

    groceryList:
      normalizeTextArray(
        stored.groceryList
      ),

    favoriteMeals:
      normalizeFavoriteMeals(
        stored.favoriteMeals
      )

  };

}


let drawerData =
  loadDrawerData();



/* =========================
   SAVE
========================= */

function saveDrawer() {

  if (
    Memory?.save
  ) {

    Memory.save(
      drawerData
    );

    return;

  }


  localStorage.setItem(
    "fuelai-fridgewise-memory",
    JSON.stringify(
      drawerData
    )
  );

}



/* =========================
   BUCKETS
========================= */

function getBucket(
  type
) {

  if (
    type ===
    "grocery"
  ) {
    return "groceryList";
  }


  if (
    type ===
    "other"
  ) {
    return "extras";
  }


  return type;

}



/* =========================
   EMPTY STATE
========================= */

function renderEmptyState(
  list,
  message
) {

  const li =
    document.createElement(
      "li"
    );


  li.className =
    "drawer-empty";


  li.textContent =
    message;


  list.appendChild(
    li
  );

}



/* =========================
   STANDARD LISTS
========================= */

function renderList(
  type
) {

  const list =
    document.getElementById(
      `${type}List`
    );


  if (
    !list
  ) {
    return;
  }


  const bucket =
    getBucket(
      type
    );


  const items =
    safeArray(
      drawerData[
        bucket
      ]
    );


  list.innerHTML =
    "";


  if (
    !items.length
  ) {

    renderEmptyState(
      list,
      "Nothing added yet."
    );

    return;

  }


  items.forEach(
    (
      item,
      index
    ) => {

      const li =
        document.createElement(
          "li"
        );


      li.className =
        "drawer-item";


      const label =
        document.createElement(
          "span"
        );


      label.textContent =
        item;


      const removeBtn =
        document.createElement(
          "button"
        );


      removeBtn.className =
        "remove-btn";


      removeBtn.type =
        "button";


      removeBtn.dataset.type =
        type;


      removeBtn.dataset.index =
        String(
          index
        );


      removeBtn.setAttribute(
        "aria-label",
        `Remove ${item}`
      );


      removeBtn.textContent =
        "Remove";


      li.append(
        label,
        removeBtn
      );


      list.appendChild(
        li
      );

    }
  );

}



/* =========================
   FAVORITE MEALS
========================= */

function renderFavoriteMeals() {

  const list =
    document.getElementById(
      "favoriteMealsList"
    );


  if (
    !list
  ) {
    return;
  }


  const meals =
    safeArray(
      drawerData.favoriteMeals
    );


  list.innerHTML =
    "";


  if (
    !meals.length
  ) {

    renderEmptyState(
      list,
      "No favorite meals saved yet."
    );

    return;

  }


  meals.forEach(
    (
      meal,
      index
    ) => {

      const li =
        document.createElement(
          "li"
        );


      li.className =
        "drawer-item favorite-meal-item";


      const copy =
        document.createElement(
          "span"
        );


      const name =
        document.createElement(
          "strong"
        );


      name.textContent =
        meal.name ||
        "Favorite meal";


      copy.appendChild(
        name
      );


      const ingredients =
        normalizeTextArray(
          meal.ingredients
        );


      if (
        ingredients.length
      ) {

        copy.appendChild(
          document.createElement(
            "br"
          )
        );


        const ingredientText =
          document.createElement(
            "small"
          );


        ingredientText.textContent =
          ingredients.join(
            ", "
          );


        copy.appendChild(
          ingredientText
        );

      }


      const removeBtn =
        document.createElement(
          "button"
        );


      removeBtn.className =
        "remove-favorite-meal-btn";


      removeBtn.type =
        "button";


      removeBtn.dataset.index =
        String(
          index
        );


      removeBtn.setAttribute(
        "aria-label",
        `Remove ${
          meal.name ||
          "favorite meal"
        }`
      );


      removeBtn.textContent =
        "Remove";


      li.append(
        copy,
        removeBtn
      );


      list.appendChild(
        li
      );

    }
  );

}



/* =========================
   RENDER ALL
========================= */

function renderAll() {

  [
    "pantry",
    "freezer",
    "other",
    "grocery"
  ].forEach(
    renderList
  );


  renderFavoriteMeals();

}



/* =========================
   ADD STANDARD ITEM
========================= */

function addDrawerItem(
  type
) {

  const bucket =
    getBucket(
      type
    );


  const input =
    document.getElementById(
      `${type}Input`
    );


  if (
    !input
  ) {
    return;
  }


  const value =
    input.value
      .trim();


  if (
    !value
  ) {
    return;
  }


  drawerData[
    bucket
  ] =
    safeArray(
      drawerData[
        bucket
      ]
    );


  const alreadyExists =
    drawerData[
      bucket
    ]
      .some(
        (item) =>

          normalizeForCompare(
            item
          ) ===

          normalizeForCompare(
            value
          )
      );


  if (
    !alreadyExists
  ) {

    drawerData[
      bucket
    ].push(
      value
    );


    saveDrawer();


    renderList(
      type
    );

  }


  input.value =
    "";


  input.focus();

}



/* =========================
   DRAWER TOGGLES
========================= */

document
  .querySelectorAll(
    ".drawer-toggle"
  )
  .forEach(
    (toggle) => {

      toggle.addEventListener(
        "click",
        () => {

          const panel =
            toggle.nextElementSibling;


          if (
            !panel
          ) {
            return;
          }


          const isOpening =
            panel.classList
              .contains(
                "hidden"
              );


          panel.classList.toggle(
            "hidden"
          );


          toggle.setAttribute(
            "aria-expanded",
            String(
              isOpening
            )
          );


          const indicator =
            toggle.querySelector(
              "[aria-hidden='true']"
            );


          if (
            indicator
          ) {

            indicator.textContent =
              isOpening
                ? "−"
                : "＋";

          }

        }
      );

    }
  );



/* =========================
   ADD BUTTONS
========================= */

document
  .querySelectorAll(
    "[data-add]"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          addDrawerItem(
            button.dataset.add
          );

        }
      );

    }
  );



/* =========================
   ENTER TO ADD
========================= */

[
  "pantry",
  "freezer",
  "other",
  "grocery"
]
  .forEach(
    (type) => {

      const input =
        document.getElementById(
          `${type}Input`
        );


      input
        ?.addEventListener(
          "keydown",
          (event) => {

            if (
              event.key !==
              "Enter"
            ) {
              return;
            }


            event.preventDefault();


            addDrawerItem(
              type
            );

          }
        );

    }
  );



/* =========================
   FAVORITE MEAL INPUTS
========================= */

const addFavoriteMealBtn =
  document.getElementById(
    "addFavoriteMealBtn"
  );


const favoriteMealNameInput =
  document.getElementById(
    "favoriteMealNameInput"
  );


const favoriteMealIngredientsInput =
  document.getElementById(
    "favoriteMealIngredientsInput"
  );


function addFavoriteMeal() {

  const name =
    favoriteMealNameInput
      ?.value
      .trim() ||
    "";


  const ingredients =
    normalizeTextArray(
      favoriteMealIngredientsInput
        ?.value
        .split(
          ","
        )
    );


  if (
    !name
  ) {
    return;
  }


  drawerData.favoriteMeals =
    safeArray(
      drawerData.favoriteMeals
    );


  const alreadyExists =
    drawerData
      .favoriteMeals
      .some(
        (meal) =>

          normalizeForCompare(
            meal.name
          ) ===

          normalizeForCompare(
            name
          )
      );


  if (
    !alreadyExists
  ) {

    drawerData
      .favoriteMeals
      .push({
        name,
        ingredients
      });


    saveDrawer();


    renderFavoriteMeals();

  }


  if (
    favoriteMealNameInput
  ) {

    favoriteMealNameInput.value =
      "";

  }


  if (
    favoriteMealIngredientsInput
  ) {

    favoriteMealIngredientsInput.value =
      "";

  }


  favoriteMealNameInput
    ?.focus();

}



addFavoriteMealBtn
  ?.addEventListener(
    "click",
    addFavoriteMeal
  );


[
  favoriteMealNameInput,
  favoriteMealIngredientsInput
]
  .forEach(
    (input) => {

      input
        ?.addEventListener(
          "keydown",
          (event) => {

            if (
              event.key !==
              "Enter"
            ) {
              return;
            }


            event.preventDefault();


            addFavoriteMeal();

          }
        );

    }
  );



/* =========================
   REMOVE ITEMS
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


    const removeBtn =
      target.closest(
        ".remove-btn"
      );


    if (
      removeBtn
    ) {

      const type =
        removeBtn.dataset.type;


      const bucket =
        getBucket(
          type
        );


      const index =
        Number(
          removeBtn.dataset.index
        );


      if (
        Array.isArray(
          drawerData[
            bucket
          ]
        ) &&
        Number.isInteger(
          index
        ) &&
        index >= 0 &&
        index <
          drawerData[
            bucket
          ].length
      ) {

        drawerData[
          bucket
        ].splice(
          index,
          1
        );


        saveDrawer();


        renderList(
          type
        );

      }


      return;

    }


    const favoriteBtn =
      target.closest(
        ".remove-favorite-meal-btn"
      );


    if (
      !favoriteBtn
    ) {
      return;
    }


    const index =
      Number(
        favoriteBtn
          .dataset
          .index
      );


    if (
      Array.isArray(
        drawerData.favoriteMeals
      ) &&
      Number.isInteger(
        index
      ) &&
      index >= 0 &&
      index <
        drawerData
          .favoriteMeals
          .length
    ) {

      drawerData
        .favoriteMeals
        .splice(
          index,
          1
        );


      saveDrawer();


      renderFavoriteMeals();

    }

  }
);



/* =========================
   START
========================= */

renderAll();