const savedTheme =
  localStorage.getItem("fuelai-theme") || "day";

document.body.dataset.theme = savedTheme;