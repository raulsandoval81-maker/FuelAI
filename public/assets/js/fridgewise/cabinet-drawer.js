console.log("CABINET DRAWER LOADED");

/* =========================
   DEFAULT DATA
========================= */

const DEFAULTS = {

  pantry: [
    "Rice",
    "Pasta",
    "Beans",
    "Tortillas"
  ],

  freezer: [
    "Frozen Chicken",
    "Ground Beef",
    "Frozen Veggies",
    "Pizza"
  ],

  favorites: [
    "Quesadillas",
    "Rice Bowls",
    "Protein Snacks"
  ],

  grocery: [],

  preferences: [
    "Ultra Fast",
    "Family",
    "Kid Friendly",
    "Protein-Heavy",
    "Leftovers First"
  ]

};

/* =========================
   STORAGE
========================= */

let drawerData =
  JSON.parse(
    localStorage.getItem("fuelai-cabinet-drawer")
  ) || DEFAULTS;
drawerData = {
  ...DEFAULTS,
  ...drawerData
};
/* =========================
   SAVE
========================= */

function saveDrawer() {

  localStorage.setItem(
    "fuelai-cabinet-drawer",
    JSON.stringify(drawerData)
  );

}

/* =========================
   RENDER
========================= */

function renderList(type) {

  const list =
    document.getElementById(`${type}List`);

  if (!list) return;

  list.innerHTML = "";

  drawerData[type].forEach((item, index) => {

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
      >
        Remove
      </button>
    `;

    list.appendChild(li);

  });

}

/* =========================
   INITIAL RENDER
========================= */

Object.keys(drawerData).forEach(renderList);

/* =========================
   TOGGLES
========================= */

const drawerToggles =
  document.querySelectorAll(".drawer-toggle");

drawerToggles.forEach((toggle) => {

  toggle.addEventListener("click", () => {

    const panel =
      toggle.nextElementSibling;

    if (!panel) return;

    panel.classList.toggle("hidden");

  });

});

/* =========================
   ADD ITEM
========================= */

const addButtons =
  document.querySelectorAll("[data-add]");

addButtons.forEach((button) => {

  button.addEventListener("click", () => {

    const type =
      button.dataset.add;

    const input =
      document.getElementById(`${type}Input`);

    if (!input) return;

    const value =
      input.value.trim();

    if (!value) return;

    drawerData[type].push(value);

    saveDrawer();

    renderList(type);

    input.value = "";

  });

});

/* =========================
   REMOVE ITEM
========================= */

document.addEventListener("click", (e) => {

  const btn =
    e.target.closest(".remove-btn");

  if (!btn) return;

  const type =
    btn.dataset.type;

  const index =
    Number(btn.dataset.index);

  drawerData[type].splice(index, 1);

  saveDrawer();

  renderList(type);

});