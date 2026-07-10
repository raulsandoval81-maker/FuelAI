console.log("CABINET DRAWER LOADED");

const Memory =
  window.FridgeWiseMemory;

const DEFAULTS = {
  pantry: [
    "Rice",
    "Pasta",
    "Beans",
    "Tortillas"
  ],

  freezer: [
    "Frozen chicken",
    "Ground beef",
    "Frozen veggies",
    "Pizza"
  ],

  extras: [],

  groceryList: [],

  favoriteMeals: []
};

let drawerData =
  Memory?.getAll?.() || DEFAULTS;

drawerData = {
  ...DEFAULTS,
  ...drawerData,

  pantry: [
    ...(drawerData.pantry || DEFAULTS.pantry)
  ],

  freezer: [
    ...(drawerData.freezer || DEFAULTS.freezer)
  ],

  extras: [
    ...(drawerData.extras || [])
  ],

  groceryList: [
    ...(drawerData.groceryList || [])
  ],

  favoriteMeals: [
    ...(drawerData.favoriteMeals || [])
  ]
};

function saveDrawer() {
  if (Memory?.save) {
    Memory.save(drawerData);
    return;
  }

  localStorage.setItem(
    "fuelai-fridgewise-memory",
    JSON.stringify(drawerData)
  );
}

function getBucket(type) {
  if (type === "grocery") {
    return "groceryList";
  }

  if (type === "other") {
    return "extras";
  }

  return type;
}

function normalizeForCompare(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function renderEmptyState(list, message) {
  const li =
    document.createElement("li");

  li.className =
    "drawer-empty";

  li.textContent =
    message;

  list.appendChild(li);
}

function renderList(type) {
  const list =
    document.getElementById(`${type}List`);

  if (!list) return;

  const bucket =
    getBucket(type);

  const items =
    drawerData[bucket] || [];

  list.innerHTML = "";

  if (!items.length) {
    renderEmptyState(
      list,
      "Nothing added yet."
    );

    return;
  }

  items.forEach((item, index) => {
    const li =
      document.createElement("li");

    li.className =
      "drawer-item";

    const label =
      document.createElement("span");

    label.textContent =
      item;

    const removeBtn =
      document.createElement("button");

    removeBtn.className =
      "remove-btn";

    removeBtn.type =
      "button";

    removeBtn.dataset.type =
      type;

    removeBtn.dataset.index =
      String(index);

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

    list.appendChild(li);
  });
}

function renderFavoriteMeals() {
  const list =
    document.getElementById(
      "favoriteMealsList"
    );

  if (!list) return;

  const meals =
    drawerData.favoriteMeals || [];

  list.innerHTML = "";

  if (!meals.length) {
    renderEmptyState(
      list,
      "No favorite meals saved yet."
    );

    return;
  }

  meals.forEach((meal, index) => {
    const li =
      document.createElement("li");

    li.className =
      "drawer-item favorite-meal-item";

    const copy =
      document.createElement("span");

    const name =
      document.createElement("strong");

    name.textContent =
      meal.name || "Favorite meal";

    const ingredients =
      document.createElement("small");

    ingredients.textContent =
      (meal.ingredients || [])
        .join(", ");

    copy.append(
      name,
      document.createElement("br"),
      ingredients
    );

    const removeBtn =
      document.createElement("button");

    removeBtn.className =
      "remove-favorite-meal-btn";

    removeBtn.type =
      "button";

    removeBtn.dataset.index =
      String(index);

    removeBtn.setAttribute(
      "aria-label",
      `Remove ${meal.name || "favorite meal"}`
    );

    removeBtn.textContent =
      "Remove";

    li.append(
      copy,
      removeBtn
    );

    list.appendChild(li);
  });
}

function renderAll() {
  [
    "pantry",
    "freezer",
    "other",
    "grocery"
  ].forEach(renderList);

  renderFavoriteMeals();
}

function addDrawerItem(type) {
  const bucket =
    getBucket(type);

  const input =
    document.getElementById(`${type}Input`);

  if (!input) return;

  const value =
    input.value.trim();

  if (!value) return;

  drawerData[bucket] =
    drawerData[bucket] || [];

  const alreadyExists =
    drawerData[bucket].some(
      item =>
        normalizeForCompare(item) ===
        normalizeForCompare(value)
    );

  if (!alreadyExists) {
    drawerData[bucket].push(value);
    saveDrawer();
    renderList(type);
  }

  input.value = "";
  input.focus();
}

renderAll();

document
  .querySelectorAll(".drawer-toggle")
  .forEach((toggle) => {
    toggle.addEventListener(
      "click",
      () => {
        const panel =
          toggle.nextElementSibling;

        if (!panel) return;

        const isOpening =
          panel.classList.contains("hidden");

        panel.classList.toggle("hidden");

        toggle.setAttribute(
          "aria-expanded",
          String(isOpening)
        );

        const indicator =
          toggle.querySelector(
            "[aria-hidden='true']"
          );

        if (indicator) {
          indicator.textContent =
            isOpening
              ? "−"
              : "＋";
        }
      }
    );
  });

document
  .querySelectorAll("[data-add]")
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        addDrawerItem(
          button.dataset.add
        );
      }
    );
  });

[
  "pantry",
  "freezer",
  "other",
  "grocery"
].forEach((type) => {
  const input =
    document.getElementById(`${type}Input`);

  input?.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      addDrawerItem(type);
    }
  );
});

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
    favoriteMealNameInput?.value.trim();

  const ingredients =
    favoriteMealIngredientsInput?.value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean) || [];

  if (!name || !ingredients.length) {
    return;
  }

  drawerData.favoriteMeals =
    drawerData.favoriteMeals || [];

  const alreadyExists =
    drawerData.favoriteMeals.some(
      meal =>
        normalizeForCompare(meal.name) ===
        normalizeForCompare(name)
    );

  if (!alreadyExists) {
    drawerData.favoriteMeals.push({
      name,
      ingredients
    });

    saveDrawer();
    renderFavoriteMeals();
  }

  favoriteMealNameInput.value = "";
  favoriteMealIngredientsInput.value = "";

  favoriteMealNameInput.focus();
}

addFavoriteMealBtn?.addEventListener(
  "click",
  addFavoriteMeal
);

[
  favoriteMealNameInput,
  favoriteMealIngredientsInput
].forEach((input) => {
  input?.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      addFavoriteMeal();
    }
  );
});

document.addEventListener(
  "click",
  (event) => {
    const removeBtn =
      event.target.closest(".remove-btn");

    if (removeBtn) {
      const type =
        removeBtn.dataset.type;

      const bucket =
        getBucket(type);

      const index =
        Number(removeBtn.dataset.index);

      if (
        Array.isArray(drawerData[bucket]) &&
        Number.isInteger(index) &&
        index >= 0 &&
        index < drawerData[bucket].length
      ) {
        drawerData[bucket].splice(
          index,
          1
        );

        saveDrawer();
        renderList(type);
      }

      return;
    }

    const favoriteBtn =
      event.target.closest(
        ".remove-favorite-meal-btn"
      );

    if (!favoriteBtn) return;

    const index =
      Number(favoriteBtn.dataset.index);

    if (
      Array.isArray(drawerData.favoriteMeals) &&
      Number.isInteger(index) &&
      index >= 0 &&
      index <
        drawerData.favoriteMeals.length
    ) {
      drawerData.favoriteMeals.splice(
        index,
        1
      );

      saveDrawer();
      renderFavoriteMeals();
    }
  }
);