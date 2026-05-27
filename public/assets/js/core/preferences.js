/* =========================
   THEME
========================= */

function getTheme() {
  return localStorage.getItem("fuelai-theme") || "night";
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
   LANGUAGE
========================= */

function getLanguage() {
  return localStorage.getItem("fuelai-lang") || "en";
}

/* =========================
   INIT
========================= */

applyTheme(
  getTheme()
);

applyLanguage(
  getLanguage()
);

/* =========================
   GLOBAL
========================= */

window.FuelAIPreferences = {
  getTheme,
  applyTheme,
  getLanguage,
  applyLanguage
};