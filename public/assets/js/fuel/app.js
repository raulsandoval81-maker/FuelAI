const foodInput =
  document.getElementById("foodInput");

const foodUploadInput =
  document.getElementById("foodUploadInput");

const previewImage =
  document.getElementById("previewImage");

const analyzeBtn =
  document.getElementById("analyzeBtn");

const scanMealBtn =
  document.getElementById("scanMealBtn");

const resultCard =
  document.getElementById("resultCard");

const loadingCard =
  document.getElementById("loadingCard");

const loadingText =
  document.getElementById("loadingText");

const uploadBox =
  document.getElementById("uploadBox");

const extraIngredients =
  document.getElementById("extraIngredients");

const addWaterBtn =
  document.getElementById("addWaterBtn");

const todayKey =
  new Date().toISOString().slice(0, 10);

const waterKey =
  `fuelai-water-oz-${todayKey}`;

let selectedImageBase64 =
  null;

let scanMode =
  "prescan";

const setup =
  JSON.parse(
    localStorage.getItem("fuelai-setup") || "{}"
  );


function resetMealScan() {

  selectedImageBase64 =
    null;

  if (previewImage) {
    previewImage.src = "";
    previewImage.classList.add("hidden");
  }

  if (foodInput) {
    foodInput.value = "";
  }

  if (foodUploadInput) {
    foodUploadInput.value = "";
  }

  if (extraIngredients) {
    extraIngredients.value = "";
  }

  uploadBox?.classList.remove("hidden");
  resultCard?.classList.add("hidden");
  loadingCard?.classList.add("hidden");

  if (analyzeBtn) {
    analyzeBtn.textContent = "Scan Meal";
    analyzeBtn.classList.add("hidden");
  }

}


addWaterBtn?.addEventListener(
  "click",
  () => {

    const current =
      Number(
        localStorage.getItem(waterKey)
      ) || 0;

    const updated =
      Math.min(current + 8, 128);

    localStorage.setItem(
      waterKey,
      String(updated)
    );

    addWaterBtn.textContent =
      `💧 ${updated} oz Logged`;

    setTimeout(() => {

      addWaterBtn.textContent =
        "💧 + 8 oz Water";

    }, 1400);

  }
);


function handleFoodFile(file) {

  if (!file) return;

  const img =
    new Image();

  const reader =
    new FileReader();

  reader.onload = () => {

    img.onload = () => {

      const maxSize =
        1200;

      let width =
        img.width;

      let height =
        img.height;

      if (
        width > height &&
        width > maxSize
      ) {

        height =
          Math.round(
            (height * maxSize) / width
          );

        width =
          maxSize;

      }

      else if (
        height > maxSize
      ) {

        width =
          Math.round(
            (width * maxSize) / height
          );

        height =
          maxSize;

      }

      const canvas =
        document.createElement("canvas");

      canvas.width =
        width;

      canvas.height =
        height;

      const ctx =
        canvas.getContext("2d");

      ctx.drawImage(
        img,
        0,
        0,
        width,
        height
      );

      selectedImageBase64 =
        canvas.toDataURL(
          "image/jpeg",
          0.82
        );

      previewImage.src =
        selectedImageBase64;

      previewImage.classList.remove(
        "hidden"
      );

      uploadBox?.classList.add(
        "hidden"
      );

      resultCard?.classList.add(
        "hidden"
      );

      loadingCard?.classList.add(
        "hidden"
      );

      if (analyzeBtn) {

        analyzeBtn.classList.remove(
          "hidden"
        );

        analyzeBtn.textContent =
          "Scan Meal";

      }

    };

    img.src =
      reader.result;

  };

  reader.readAsDataURL(file);

}


foodInput?.addEventListener(
  "change",
  () => {
    handleFoodFile(foodInput.files[0]);
  }
);


foodUploadInput?.addEventListener(
  "change",
  () => {
    handleFoodFile(foodUploadInput.files[0]);
  }
);


/* Quick Actions auto-open */

const quickParams =
  new URLSearchParams(window.location.search);

if (
  quickParams.get("quick") === "meal"
) {

  setTimeout(() => {
    foodInput?.click();
  }, 300);

}


function saveScan(scan) {

  const scans =
    JSON.parse(
      localStorage.getItem("fuelai-history") || "[]"
    );

  scans.unshift({
    ...scan,
    createdAt:
      new Date().toLocaleString()
  });

  const trimmed =
    scans.slice(0, 5);

  localStorage.setItem(
    "fuelai-history",
    JSON.stringify(trimmed)
  );

}


function showError(message) {

  resultCard.innerHTML = `
    <h2>Error</h2>

    <p class="feedback">
      ${
        message ||
        "Could not analyze meal. Try another photo."
      }
    </p>
  `;

  resultCard.classList.remove("hidden");

}


function addMealToFuelLog(parsed) {

  if (!window.FuelAILog) return;

  window.FuelAILog.addFuelLog({

    type:
      "meal",

    calories:
      Number(
        String(parsed.calories).replace(/[^0-9]/g, "")
      ) || 0,

    protein:
      Number(
        String(parsed.protein).replace(/[^0-9]/g, "")
      ) || 0,

    carbs:
      Number(
        String(parsed.carbs).replace(/[^0-9]/g, "")
      ) || 0,

    fats:
      Number(
        String(parsed.fat || parsed.fats).replace(/[^0-9]/g, "")
      ) || 0,

    goal:
      setup.goal || "fuelwise",

    source:
      "meal-scan"

  });

}


function saveParsedMeal(parsed) {

  saveScan({

    mealName:
      parsed.mealName ||
      "Meal Scan",

    calories:
      parsed.calories || "",

    protein:
      parsed.protein || "",

    carbs:
      parsed.carbs || "",

    fats:
      parsed.fat ||
      parsed.fats || "",

    goal:
      setup.goal ||
      "fuelwise",

    confidence:
      parsed.confidence || ""

  });

  addMealToFuelLog(parsed);

}


analyzeBtn?.addEventListener(
  "click",
  async () => {

    if (!selectedImageBase64) return;

    const isDirectScan =
      scanMode === "scan";

    if (!isDirectScan) {
      scanMode = "prescan";
    }

    const loadingMessages = [
      "Detecting ingredients...",
      "Estimating calories...",
      "Checking balance...",
      "Building guidance...",
      "Finishing scan..."
    ];

    let loadingIndex =
      0;

    analyzeBtn.disabled =
      true;

    analyzeBtn.textContent =
      "Analyzing...";

    if (scanMealBtn) {
      scanMealBtn.disabled = false;
    }

    resultCard.classList.add("hidden");
    loadingCard.classList.remove("hidden");

    loadingText.textContent =
      loadingMessages[0];

    const loadingInterval =
      setInterval(() => {

        loadingIndex++;

        if (
          loadingIndex >=
          loadingMessages.length
        ) {
          loadingIndex = 0;
        }

        loadingText.textContent =
          loadingMessages[loadingIndex];

      }, 1200);

    try {

      const response =
        await fetch(
          "/api/analyze",
          {

            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({

                image:
                  selectedImageBase64,

                goal:
                  setup.goal ||
                  "fuelwise",

                height:
                  setup.height || "",

                weight:
                  setup.weight || "",

                targetWeight:
                  setup.targetWeight || "",

                ageRange:
                  setup.ageRange || "",

                gender:
                  setup.gender || "",

                activityLevel:
                  setup.activityLevel || "",


                extraIngredients:
                  extraIngredients?.value.trim() || ""

              })

          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "API request failed"
        );
      }

      if (!data.result) {
        throw new Error(
          "No AI result returned"
        );
      }

      const parsed =
        data.result;

      resultCard.innerHTML = `
        <h2>
          ${
            parsed.mealName ||
            "Meal Scan"
          }
        </h2>

        <div class="calories">
          ${
            parsed.calories ||
            "Unknown"
          } Calories
        </div>

        <div class="macro-grid">

          <div>
            <strong>🥩 Protein</strong>
            <span>${parsed.protein || "—"}</span>
          </div>

          <div>
            <strong>🍞 Carbs</strong>
            <span>${parsed.carbs || "—"}</span>
          </div>

          <div>
            <strong>🥑 Fat</strong>
            <span>${parsed.fat || "—"}</span>
          </div>

        </div>

        <p class="feedback">
          ${parsed.feedback || ""}
        </p>

        ${
          parsed.extraNoteResponse
            ? `
              <p class="feedback">
                ${parsed.extraNoteResponse}
              </p>
            `
            : ""
        }

        <p class="feedback">
          Fuel Check:
          ${parsed.score || "—"}/10
        </p>

        <p class="feedback">
          Confidence Level:
          ${parsed.confidence || "—"}
        </p>

        <p class="caution">
          ${parsed.caution || ""}
        </p>

        <div class="commit-actions">

          <button
            id="commitMealBtn"
            class="start-btn"
            type="button"
          >
            👍 Commit Meal
          </button>

          <button
            id="discardMealBtn"
            class="secondary-btn"
            type="button"
          >
            ✕ Never Mind
          </button>

        </div>
      `;

      resultCard.classList.remove("hidden");

      const commitMealBtn =
        document.getElementById("commitMealBtn");

      const discardMealBtn =
        document.getElementById("discardMealBtn");

      if (isDirectScan) {

        saveParsedMeal(parsed);

        const commitActions =
          document.querySelector(".commit-actions");

        if (commitActions) {

          commitActions.innerHTML = `
            <button
              class="start-btn"
              type="button"
              disabled
            >
              Meal added to your log.
            </button>
          `;

        }

      }

      commitMealBtn?.addEventListener(
        "click",
        () => {

          saveParsedMeal(parsed);

          commitMealBtn.textContent =
            "Meal Committed";

          commitMealBtn.disabled =
            true;

        }
      );

      discardMealBtn?.addEventListener(
        "click",
        () => {

          resultCard.classList.add("hidden");

          analyzeBtn.textContent =
            "Scan Meal";

          resetMealScan();

        }
      );

    }

    catch (err) {

      console.error(
        "SCAN ERROR:",
        err
      );

      showError(
        "Could not analyze meal. Try another photo."
      );

      analyzeBtn.textContent =
        "Try Again";

    }

    finally {

      clearInterval(loadingInterval);

      loadingCard.classList.add("hidden");

      analyzeBtn.disabled =
        false;

      if (scanMealBtn) {
        scanMealBtn.disabled = false;
      }

      if (scanMode === "scan") {
        scanMode = "prescan";
      }

    }

  }
);