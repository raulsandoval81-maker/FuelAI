/* =========================
   THEME
========================= */

function getTheme() {
  return localStorage.getItem("fuelai-theme") || "day";
}

function applyTheme(theme) {

  document.body.setAttribute(
    "data-theme",
    theme
  );

  localStorage.setItem(
    "fuelai-theme",
    theme
  );
}

/* =========================
   INIT
========================= */

applyTheme(getTheme());