console.log("CABINET DRAWER LOADED");

const DEFAULTS = {
  pantry: ["Rice", "Pasta", "Beans", "Tortillas"],
  freezer: ["Frozen Chicken", "Ground Beef", "Frozen Veggies", "Pizza"],
  grocery: [],
  other: []
};

let drawerData =
  JSON.parse(
    localStorage.getItem("fuelai-cabinet-drawer") || "null"
  ) || DEFAULTS;

drawerData = {
  ...DEFAULTS,
  ...drawerData
};

function saveDrawer() {
  localStorage.setItem(
    "fuelai-cabinet-drawer",
    JSON.stringify(drawerData)
  );
}

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
        type="button"
      >
        Remove
      </button>
    `;

    list.appendChild(li);
  });
}

Object.keys(DEFAULTS).forEach(renderList);

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