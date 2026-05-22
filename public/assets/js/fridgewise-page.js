const fridgeInput =
  document.getElementById("fridgeInput");

const fridgeUploadInput =
  document.getElementById("fridgeUploadInput");

const fridgePreview =
  document.getElementById("fridgePreview");

const fridgeAnalyzeBtn =
  document.getElementById("fridgeAnalyzeBtn");

const fridgeLoadingCard =
  document.getElementById("fridgeLoadingCard");

const fridgeLoadingText =
  document.getElementById("fridgeLoadingText");

const fridgeResultCard =
  document.getElementById("fridgeResultCard");

const pantryToggle =
  document.getElementById("pantryToggle");

const pantryPanel =
  document.getElementById("pantryPanel");

const pantryInput =
  document.getElementById("pantryInput");

const addPantryItem =
  document.getElementById("addPantryItem");

const pantryChips =
  document.getElementById("pantryChips");

const pantryNotes =
  document.getElementById("pantryNotes");

let selectedImage = null;

let pantryCompanion = [];

/* =========================
   TOGGLE PANTRY
========================= */

if (pantryToggle && pantryPanel) {

  pantryToggle.addEventListener("click", () => {

    pantryPanel.classList.toggle("hidden");

  });

}

/* =========================
   PANTRY CHIPS
========================= */

if (pantryChips) {

  pantryChips.addEventListener("click", (e) => {

    const btn =
      e.target.closest("button");

    if (!btn) return;

    const item =
      btn.dataset.item;

    if (!item) return;

    const exists =
      pantryCompanion.includes(item);

    if (exists) {

      pantryCompanion =
        pantryCompanion.filter(i => i !== item);

      btn.classList.remove("active");

    } else {

      pantryCompanion.push(item);

      btn.classList.add("active");

    }

  });

}

/* =========================
   ADD CUSTOM PANTRY ITEM
========================= */

if (addPantryItem && pantryInput) {

  addPantryItem.addEventListener("click", () => {

    const value =
      pantryInput.value.trim();

    if (!value) return;

    pantryCompanion.push(value);

    pantryInput.value = "";

  });

}

/* =========================
   IMAGE PREVIEW
========================= */

function handleImage(file) {

  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {

    selectedImage =
      e.target.result;

    fridgePreview.src =
      selectedImage;

    fridgePreview.classList.remove("hidden");

    fridgeAnalyzeBtn.classList.remove("hidden");

  };

  reader.readAsDataURL(file);

}

if (fridgeInput) {

  fridgeInput.addEventListener("change", (e) => {

    handleImage(
      e.target.files?.[0]
    );

  });

}

if (fridgeUploadInput) {

  fridgeUploadInput.addEventListener("change", (e) => {

    handleImage(
      e.target.files?.[0]
    );

  });

}

/* =========================
   ANALYZE
========================= */

if (fridgeAnalyzeBtn) {

  fridgeAnalyzeBtn.addEventListener("click", async () => {

    if (!selectedImage) return;

    fridgeLoadingCard.classList.remove("hidden");

    fridgeResultCard.classList.add("hidden");

    const setup =
      JSON.parse(
        localStorage.getItem("fuelai-setup") || "{}"
      );

    try {

      const response =
        await fetch("/api/fridge", {

          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({

            image: selectedImage,

            lang:
              setup.lang || "en",

            wiseFlavor:
              setup.wiseFlavor || "sweetspot",

            pantryCompanion,

            pantryNotes:
              pantryNotes?.value || ""

          }),

        });

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error || "Failed to analyze fridge"
        );

      }

      localStorage.setItem(
        "fuelwise_result",
        JSON.stringify(data.result)
      );

      fridgeLoadingText.textContent =
        "Dinner ideas ready.";

      window.location.href =
        "/fridgewise-results.html";

    } catch (err) {

      console.error(err);

      fridgeLoadingText.textContent =
        "Something went wrong.";

    }

  });

}