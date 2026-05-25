const saveSetupBtn = document.getElementById("saveSetupBtn");

const heightInput = document.getElementById("heightInput");
const weightInput = document.getElementById("weightInput");
const targetWeightInput = document.getElementById("targetWeightInput");
const ageRange = document.getElementById("ageRange");
const genderType = document.getElementById("genderType");
const activityLevel = document.getElementById("activityLevel");
const goalSelect = document.getElementById("goalSelect");
const wiseFlavor = document.getElementById("wiseFlavor");
const rangeOutput = document.getElementById("rangeOutput");
const nicknameInput = document.getElementById("nicknameInput");


const langToggle = document.getElementById("langToggle");
const themeToggle = document.getElementById("themeToggle");

const copy = {
  en: {
    langBtn: "Español",
    nightBtn: "Night",
    dayBtn: "Day",
    start: "← Start",
    title: "Setup",
    sub: "Give FuelAI a little context before your scan.",
    height: "Height — example: 5'10",
    weight: "Current weight — example: 165 lbs",
    target: "Target weight — optional",
    bodyType: "Body type",
    male: "Male",
    female: "Female",

    activityPlaceholder: "Activity / Training Level",
    activity01: "0–1 days per week",
    activity23: "2–3 days per week",
    activity45: "4–5 days per week",
    activity6: "6+ days per week",

    fuelwise: "FuelWise — Maintain / Balance",
    cutwise: "CutWise — Lean Out",
    gainwise: "GainWise — Build / Recover",

    sweetspot: "Sweet Spot — Calm + Balanced",
    mafia: "Mafia — Funny Movie Flavor",
    toughguy: "Tough Guy — Direct Coach Energy",
    internet: "Internet — Meme / Teen Slang",
                  
    guidance: "Suggested Guidance",
    emptyRange: "Enter height and weight",
    note: "General guidance only. Not medical advice.",
    continue: "Continue to Your Guide",

    range: "General range:",
    current: "Current weight:",
    training: "Training:",
    direction: "Direction:",

    maintain: "Maintain",
    cut: "Gradual Cut",
    gain: "Gradual Gain"
  },

  es: {
    langBtn: "English",
    nightBtn: "Noche",
    dayBtn: "Día",
    start: "← Inicio",
    title: "Configuración",
    sub: "Dale a FuelAI un poco de contexto antes de escanear.",

    height: "Estatura — ejemplo: 5'10",
    weight: "Peso actual — ejemplo: 165 lbs",
    target: "Peso objetivo — opcional",

    bodyType: "Tipo de cuerpo",
    male: "Masculino",
    female: "Femenino",

    activityPlaceholder: "Nivel de actividad / entrenamiento",
    activity01: "0–1 días por semana",
    activity23: "2–3 días por semana",
    activity45: "4–5 días por semana",
    activity6: "6+ días por semana",

    fuelwise: "FuelWise — Mantener / Balance",
    cutwise: "CutWise — Bajar / Definir",
    gainwise: "GainWise — Subir / Recuperar",

    sweetspot: "Sweet Spot — Calmado + Balanceado",
    mafia: "Mafia — Sabor de Película",
    toughguy: "Tough Guy — Energía de Coach Directo",
    internet: "Internet — Meme / Slang Teen",

    lightFlavor: "90 / 10 — Sabor Ligero",
    balancedFlavor: "80 / 20 — Balanceado",
    spicyFlavor: "70 / 30 — Picante",

    guidance: "Guía sugerida",
    emptyRange: "Ingresa estatura y peso",
    note: "Guía general solamente. No es consejo médico.",
    continue: "Continuar a tu guía",

    range: "Rango general:",
    current: "Peso actual:",
    training: "Entrenamiento:",
    direction: "Dirección:",

    maintain: "Mantener",
    cut: "Bajar gradual",
    gain: "Subir gradual"
  }
};

function getLang() {
  return localStorage.getItem("fuelai-lang") || "en";
}

function getTheme() {
  return localStorage.getItem("fuelai-theme") || "day";
}

function applyLanguage(lang) {
  const t = copy[lang];

  document.body.dataset.lang = lang;
  localStorage.setItem("fuelai-lang", lang);

  document.querySelector(".top-link").textContent = t.start;
  document.querySelector(".scan-card h1").textContent = t.title;
  document.querySelector(".scan-card .sub").textContent = t.sub;

  heightInput.placeholder = t.height;
  weightInput.placeholder = t.weight;
  targetWeightInput.placeholder = t.target;

  genderType.options[0].textContent = t.bodyType;
  genderType.options[1].textContent = t.male;
  genderType.options[2].textContent = t.female;

  activityLevel.options[0].textContent = t.activityPlaceholder;
  activityLevel.options[1].textContent = t.activity01;
  activityLevel.options[2].textContent = t.activity23;
  activityLevel.options[3].textContent = t.activity45;
  activityLevel.options[4].textContent = t.activity6;

  goalSelect.options[0].textContent = t.fuelwise;
  goalSelect.options[1].textContent = t.cutwise;
  goalSelect.options[2].textContent = t.gainwise;

  if (wiseFlavor) {
    wiseFlavor.options[0].textContent = t.sweetspot;
    wiseFlavor.options[1].textContent = t.mafia;
    wiseFlavor.options[2].textContent = t.toughguy;
    wiseFlavor.options[3].textContent = t.internet;
  }

  document.querySelector(".range-label").textContent = t.guidance;
  document.querySelector(".range-note").textContent = t.note;

  saveSetupBtn.textContent = t.continue;
  langToggle.textContent = t.langBtn;

  updateThemeButton();
  updateGuidance();
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("fuelai-theme", theme);
  updateThemeButton();
}

function updateThemeButton() {
  const lang = getLang();
  const theme = document.body.getAttribute("data-theme") || getTheme();
  const t = copy[lang];

  themeToggle.textContent =
    theme === "night" ? t.dayBtn : t.nightBtn;
}

function getActivityText() {
  const lang = getLang();
  const value = activityLevel.value;

  const labels = {
    en: {
      low: "Not selected",
      "0-1": "0–1 days per week",
      "2-3": "2–3 days per week",
      "4-5": "4–5 days per week",
      "6plus": "6+ days per week"
    },

    es: {
      low: "No seleccionado",
      "0-1": "0–1 días por semana",
      "2-3": "2–3 días por semana",
      "4-5": "4–5 días por semana",
      "6plus": "6+ días por semana"
    }
  };

  return labels[lang][value] || labels[lang].low;
}

function updateGuidance() {
  const t = copy[getLang()];

  const height = heightInput.value.trim();
  const weight = parseInt(weightInput.value, 10);

  if (!height || !weight) {
    rangeOutput.textContent = t.emptyRange;
    return;
  }

  const low = weight - 10;
  const high = weight + 10;

  let direction = t.maintain;

  if (goalSelect.value === "cutwise") {
    direction = t.cut;
  }

  if (goalSelect.value === "gainwise") {
    direction = t.gain;
  }

  rangeOutput.innerHTML = `
    ${t.range}<br>
    ${low}–${high} lbs

    <br><br>

    ${t.current}<br>
    ${weight} lbs

    <br><br>

    ${t.training}<br>
    ${getActivityText()}

    <br><br>

    ${t.direction}<br>
    ${direction}
  `;
}

function loadSavedSetup() {
  const saved = JSON.parse(localStorage.getItem("fuelai-setup") || "{}");

  nicknameInput.value = saved.nickname || "";
  heightInput.value = saved.height || "";
  weightInput.value = saved.weight || "";
  targetWeightInput.value = saved.targetWeight || "";
  ageRange.value = saved.ageRange || "13-18";
  genderType.value = saved.gender || "";
  activityLevel.value = saved.activityLevel || "low";
  goalSelect.value = saved.goal || "fuelwise";

  if (wiseFlavor) {
    wiseFlavor.value = saved.wiseFlavor || "sweetspot";
  }

}

if (langToggle) {
  langToggle.addEventListener("click", () => {
    const nextLang = getLang() === "en" ? "es" : "en";
    applyLanguage(nextLang);
  });
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current =
      document.body.getAttribute("data-theme") || "day";

    const nextTheme =
      current === "day" ? "night" : "day";

    applyTheme(nextTheme);
  });
}

if (saveSetupBtn) {
  saveSetupBtn.addEventListener("click", () => {
    const flavor = wiseFlavor?.value || "sweetspot";

    const setup = {

      nickname: nicknameInput.value.trim(),
      height: heightInput.value.trim(),
      weight: weightInput.value.trim(),
      targetWeight: targetWeightInput.value.trim(),

      ageRange: ageRange.value,
      gender: genderType.value,
      activityLevel: activityLevel.value,
      goal: goalSelect.value,

      wiseFlavor: flavor,

      guide:
        genderType.value === "female"
          ? "wisegal"
          : "wiseguy",

      lang: getLang(),
      theme: getTheme()
    };

    localStorage.setItem(
      "fuelai-setup",
      JSON.stringify(setup)
    );

    window.location.href = "/hub.html";
  });
}

heightInput.addEventListener("input", updateGuidance);
weightInput.addEventListener("input", updateGuidance);
targetWeightInput.addEventListener("input", updateGuidance);

ageRange.addEventListener("change", updateGuidance);
genderType.addEventListener("change", updateGuidance);
activityLevel.addEventListener("change", updateGuidance);
goalSelect.addEventListener("change", updateGuidance);

loadSavedSetup();
applyTheme(getTheme());
applyLanguage(getLang());