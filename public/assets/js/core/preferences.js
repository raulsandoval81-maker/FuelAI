/* =========================
   THEME
========================= */

const VALID_THEMES = [
  "night",
  "light"
];


function getTheme() {
  const saved =
    localStorage.getItem(
      "fuelai-theme"
    );

  return VALID_THEMES.includes(
    saved
  )
    ? saved
    : "night";
}


function applyTheme(
  theme
) {

  const nextTheme =
    VALID_THEMES.includes(
      theme
    )
      ? theme
      : "night";


  if (
    document.body
  ) {
    document.body.setAttribute(
      "data-theme",
      nextTheme
    );
  }


  localStorage.setItem(
    "fuelai-theme",
    nextTheme
  );


  return nextTheme;
}


/* =========================
   INIT
========================= */

function initTheme() {

  applyTheme(
    getTheme()
  );

}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initTheme,
    {
      once: true
    }
  );

} else {

  initTheme();

}


/* =========================
   GLOBAL
========================= */

window.FuelAIPreferences = {
  getTheme,
  applyTheme
};