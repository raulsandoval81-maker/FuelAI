console.log("CABINET DRAWER LOADED");

const Memory =
  window.FridgeWiseMemory;

const DEFAULTS = {
  pantry: [
    "rice",
    "pasta",
    "beans",
    "tortillas"
  ],

  freezer: [
    "frozen chicken",
    "ground beef",
    "frozen veggies",
    "pizza"
  ],

  extras: [],

  groceryList: [],

  favoriteMeals: []
};

let drawerData =
  Memory?.getAll?.() || DEFAULTS;

drawerData = {
  ...DEFAULTS,
  ...drawerData
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

function renderList(type) {
  const list =
    document.getElementById(`${type}List`);

  if (!list) return;

  const bucket =
    getBucket(type);

  const items =
    drawerData[bucket] || [];

  list.innerHTML = "";

  items.forEach((item, index) => {
    const li =
      document.createElement("li");

    li.className =
      "drawer-item";

    li.innerHTML = `
      <span>${item}</span>

      <button
        class="remove-btn"
        data-type="${type}"
        data-index="${index}"
        type="button"
      >
        Remove
      </button>
    `;

    list.appendChild(li);
  });
}

function renderFavoriteMeals() {
  const list =
    document.getElementById("favoriteMealsList");

  if (!list) return;

  const meals =
    drawerData.favoriteMeals || [];

  list.innerHTML = "";

  meals.forEach((meal, index) => {
    const li =
      document.createElement("li");

    li.className =
      "drawer-item favorite-meal-item";

    li.innerHTML = `
      <span>
        <strong>${meal.name}</strong><br>
        <small>
          ${(meal.ingredients || []).join(", ")}
        </small>
      </span>

      <button
        class="remove-favorite-meal-btn"
        data-index="${index}"
        type="button"
      >
        Remove
      </button>
    `;

    list.appendChild(li);
  });
}

[
  "pantry",
  "freezer",
  "other",
  "grocery"
].forEach(renderList);

renderFavoriteMeals();

document
  .querySelectorAll(".drawer-toggle")
  .forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const panel =
        toggle.nextElementSibling;

      if (!panel) return;

      panel.classList.toggle("hidden");
    });
  });

document
  .querySelectorAll("[data-add]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const type =
        button.dataset.add;

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

      const clean =
        value.toLowerCase();

      if (!drawerData[bucket].includes(clean)) {
        drawerData[bucket].push(clean);
      }

      saveDrawer();

      renderList(type);

      input.value = "";
    });
  });

const addFavoriteMealBtn =
  document.getElementById("addFavoriteMealBtn");

const favoriteMealNameInput =
  document.getElementById("favoriteMealNameInput");

const favoriteMealIngredientsInput =
  document.getElementById("favoriteMealIngredientsInput");

addFavoriteMealBtn?.addEventListener(
  "click",
  () => {
    const name =
      favoriteMealNameInput?.value.trim();

    const ingredients =
      favoriteMealIngredientsInput?.value
        .split(",")
        .map(item => item.trim().toLowerCase())
        .filter(Boolean) || [];

    if (!name || !ingredients.length) return;

    drawerData.favoriteMeals =
      drawerData.favoriteMeals || [];

    drawerData.favoriteMeals.push({
      name,
      ingredients
    });

    saveDrawer();

    renderFavoriteMeals();

    favoriteMealNameInput.value = "";
    favoriteMealIngredientsInput.value = "";
  }
);

document.addEventListener("click", (e) => {
  const btn =
    e.target.closest(".remove-btn");

  if (!btn) return;

  const type =
    btn.dataset.type;

  const bucket =
    getBucket(type);

  const index =
    Number(btn.dataset.index);

  drawerData[bucket].splice(index, 1);

  saveDrawer();

  renderList(type);
});

document.addEventListener("click", (e) => {
  const btn =
    e.target.closest(".remove-favorite-meal-btn");

  if (!btn) return;

  const index =
    Number(btn.dataset.index);

  drawerData.favoriteMeals.splice(index, 1);

  saveDrawer();

  renderFavoriteMeals();
});