console.log("CABINET DRAWER LOADED");

const allDrawerButtons =
  document.querySelectorAll(".drawer-chips button");

let cabinetDrawer =
  JSON.parse(
    localStorage.getItem("fuelai-cabinet-drawer") || "[]"
  );
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
allDrawerButtons.forEach((button) => {

  const label =
    button.textContent.trim();

  if (cabinetDrawer.includes(label)) {
    button.classList.add("active");
  }

  button.addEventListener("click", () => {

    const exists =
      cabinetDrawer.includes(label);

    if (exists) {

      cabinetDrawer =
        cabinetDrawer.filter(
          (item) => item !== label
        );

      button.classList.remove("active");

    } else {

      cabinetDrawer.push(label);

      button.classList.add("active");

    }

    localStorage.setItem(
      "fuelai-cabinet-drawer",
      JSON.stringify(cabinetDrawer)
    );

  });

});