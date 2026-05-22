console.log("FRIDGEWISE PAGE JS LOADED");

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

/* Pantry toggle */

if (pantryToggle && pantryPanel) {
  pantryToggle.addEventListener("click", () => {
    pantryPanel.classList.toggle("hidden");

    pantryToggle.setAttribute(
      "aria-expanded",
      pantryPanel.classList.contains("hidden")
        ? "false"
        : "true"
    );
  });
}

/* Pantry chips */

if (pantryChips) {
  pantryChips.addEventListener("click", (e) => {
    const btn = e.target.closest("button");

    if (!btn) return;

    const item = btn.dataset.item;

    if (!item) return;

    if (pantryCompanion.includes(item)) {
      pantryCompanion =
        pantryCompanion.filter((i) => i !== item);

      btn.classList.remove("active");
    } else {
      pantryCompanion.push(item);

      btn.classList.add("active");
    }
  });
}

/* Add pantry item */

if (addPantryItem && pantryInput) {
  addPantryItem.addEventListener("click", () => {
    const value = pantryInput.value.trim();

    if (!value) return;

    pantryCompanion.push(value);

    pantryInput.value = "";
  });
}

/* Image preview */

function handleImage(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    selectedImage = e.target.result;

    if (fridgePreview) {
      fridgePreview.src = selectedImage;
      fridgePreview.classList.remove("hidden");
    }

    if (fridgeAnalyzeBtn) {
      fridgeAnalyzeBtn.classList.remove("hidden");
    }
  };

  reader.readAsDataURL(file);
}

if (fridgeInput) {
  fridgeInput.addEventListener("change", (e) => {
    handleImage(e.target.files?.[0]);
  });
}

if (fridgeUploadInput) {
  fridgeUploadInput.addEventListener("change", (e) => {
    handleImage(e.target.files?.[0]);
  });
}

/* Analyze fridge */

if (fridgeAnalyzeBtn) {
  fridgeAnalyzeBtn.addEventListener("click", async () => {
    if (!selectedImage) return;

    fridgeAnalyzeBtn.disabled = true;

    if (fridgeLoadingCard) {
      fridgeLoadingCard.classList.remove("hidden");
    }

    if (fridgeResultCard) {
      fridgeResultCard.classList.add("hidden");
    }

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
            lang: setup.lang || "en",
            wiseFlavor: setup.wiseFlavor || "sweetspot",
            pantryCompanion,
            pantryNotes: pantryNotes?.value || ""
          }),
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to analyze fridge"
        );
      }

      localStorage.setItem(
        "fuelwise_fridge_result",
        JSON.stringify(data.result)
      );

      if (fridgeLoadingText) {
        fridgeLoadingText.textContent =
          "Dinner ideas ready.";
      }

      window.location.href =
        "/fridgewise-results.html";

    } catch (err) {
      console.error(err);

      if (fridgeLoadingText) {
        fridgeLoadingText.textContent =
          "Something went wrong.";
      }

      fridgeAnalyzeBtn.disabled = false;
    }
  });
}