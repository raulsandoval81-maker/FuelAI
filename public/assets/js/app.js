const foodInput = document.getElementById("foodInput");
const previewImage = document.getElementById("previewImage");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultCard = document.getElementById("resultCard");
const loadingCard = document.getElementById("loadingCard");
const loadingText = document.getElementById("loadingText");
const uploadBox = document.getElementById("uploadBox");

let selectedImageBase64 = null;

const setup =
  JSON.parse(localStorage.getItem("fuelai-setup") || "{}");

if (foodInput) {
  foodInput.addEventListener("change", () => {
    const file = foodInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      selectedImageBase64 = reader.result;

      previewImage.src = selectedImageBase64;
      previewImage.classList.remove("hidden");

      if (uploadBox) {
        uploadBox.classList.add("hidden");
      }

      analyzeBtn.classList.remove("hidden");
      resultCard.classList.add("hidden");
      loadingCard.classList.add("hidden");
    };

    reader.readAsDataURL(file);
  });
}

function saveScan(scan) {
  const scans =
    JSON.parse(localStorage.getItem("cutwise-history") || "[]");

  scans.unshift({
    ...scan,
    createdAt: new Date().toLocaleString()
  });

  const trimmed = scans.slice(0, 5);

  localStorage.setItem(
    "cutwise-history",
    JSON.stringify(trimmed)
  );
}

function showError(message) {
  resultCard.innerHTML = `
    <h2>Error</h2>

    <p class="feedback">
      ${message || "Could not analyze image. Please try again."}
    </p>
  `;

  resultCard.classList.remove("hidden");
}

if (analyzeBtn) {
  analyzeBtn.addEventListener("click", async () => {
    if (!selectedImageBase64) return;

    const loadingMessages = [
      "Detecting ingredients...",
      "Estimating calories...",
      "Checking balance...",
      "Building guidance...",
      "Finishing scan..."
    ];

    let loadingIndex = 0;

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";
    resultCard.classList.add("hidden");
    loadingCard.classList.remove("hidden");
    loadingText.textContent = loadingMessages[0];

    const loadingInterval = setInterval(() => {
      loadingIndex++;

      if (loadingIndex >= loadingMessages.length) {
        loadingIndex = 0;
      }

      loadingText.textContent = loadingMessages[loadingIndex];
    }, 1200);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: selectedImageBase64,
          goal: setup.goal || "fuelwise",
          height: setup.height || "",
          weight: setup.weight || "",
          targetWeight: setup.targetWeight || "",
          ageRange: setup.ageRange || "",
          gender: setup.gender || "",
          activityLevel: setup.activityLevel || "",
          lang: setup.lang || "en"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "API request failed");
      }

      if (!data.result) {
        throw new Error("No AI result returned");
      }

      const cleaned = data.result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let parsed;

      try {
        parsed = JSON.parse(cleaned);
      } catch (err) {
        console.error("JSON PARSE ERROR:", err);
        console.error("RAW AI RESULT:", data.result);

        showError("AI response formatting failed. Try again.");
        return;
      }

      if (window.FuelAILog) {
        window.FuelAILog.addFuelLog({
          type: "meal",
          calories:
            Number(
              String(parsed.calories)
                .replace(/[^0-9]/g, "")
            ) || 0,
          goal: setup.goal || "fuelwise",
          source: "meal-scan"
        });
      }

      resultCard.innerHTML = `
        <h2>${parsed.mealName || "Meal Scan"}</h2>

        <div class="calories">
          ${parsed.calories || "Unknown"} Calories
        </div>

        <div class="macro-grid">
          <div>
            <strong>Protein</strong>
            <span>${parsed.protein || "—"}</span>
          </div>

          <div>
            <strong>Carbs</strong>
            <span>${parsed.carbs || "—"}</span>
          </div>

          <div>
            <strong>Fat</strong>
            <span>${parsed.fat || "—"}</span>
          </div>
        </div>

        <p class="feedback">
          ${parsed.feedback || ""}
        </p>

        <p class="feedback">
          Meal Score: ${parsed.score || "—"}/10
        </p>

        <p class="feedback">
          Confidence: ${parsed.confidence || "—"}
        </p>

        <p class="caution">
          ${parsed.caution || ""}
        </p>
      `;

      saveScan({
        mealName: parsed.mealName || "Meal Scan",
        calories: parsed.calories || "",
        goal: setup.goal || "fuelwise",
        confidence: parsed.confidence || ""
      });

      resultCard.classList.remove("hidden");
      analyzeBtn.textContent = "Analyze Again";

    } catch (err) {
      console.error("SCAN ERROR:", err);

      showError(
        err?.message ||
        "Could not analyze image. Please try again."
      );

      analyzeBtn.textContent = "Try Again";

    } finally {
      clearInterval(loadingInterval);
      loadingCard.classList.add("hidden");
      analyzeBtn.disabled = false;
    }
  });
}