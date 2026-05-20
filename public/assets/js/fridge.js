const fridgeInput = document.getElementById("fridgeInput");
const fridgePreview = document.getElementById("fridgePreview");
const fridgeAnalyzeBtn = document.getElementById("fridgeAnalyzeBtn");
const fridgeResultCard = document.getElementById("fridgeResultCard");
const fridgeLoadingCard = document.getElementById("fridgeLoadingCard");
const fridgeLoadingText = document.getElementById("fridgeLoadingText");
const fridgeUploadBox = document.getElementById("fridgeUploadBox");

let selectedFridgeImage = null;

if (fridgeInput) {
  fridgeInput.addEventListener("change", () => {
    const file = fridgeInput.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      selectedFridgeImage = reader.result;

      fridgePreview.src = selectedFridgeImage;
      fridgePreview.classList.remove("hidden");
      fridgeUploadBox.classList.add("hidden");
      fridgeAnalyzeBtn.classList.remove("hidden");
      fridgeResultCard.classList.add("hidden");
      fridgeLoadingCard.classList.add("hidden");
    };

    reader.readAsDataURL(file);
  });
}

if (fridgeAnalyzeBtn) {
  fridgeAnalyzeBtn.addEventListener("click", async () => {
    if (!selectedFridgeImage) return;

    const loadingMessages = [
      "Detecting foods...",
      "Finding simple combinations...",
      "Building quick meal ideas...",
      "Reducing dinner stress..."
    ];

    let loadingIndex = 0;

    fridgeAnalyzeBtn.disabled = true;
    fridgeAnalyzeBtn.textContent = "Thinking...";
    fridgeResultCard.classList.add("hidden");
    fridgeLoadingCard.classList.remove("hidden");
    fridgeLoadingText.textContent = loadingMessages[0];

    const loadingInterval = setInterval(() => {
      loadingIndex++;

      if (loadingIndex >= loadingMessages.length) {
        loadingIndex = 0;
      }

      fridgeLoadingText.textContent = loadingMessages[loadingIndex];
    }, 1200);

    try {
      const response = await fetch("/api/fridge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: selectedFridgeImage
        })
      });

      const data = await response.json();

      const cleaned = data.result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      fridgeResultCard.innerHTML = `
        <h2>Fridge Ideas</h2>

        <p class="feedback">
          <strong>Detected:</strong> ${parsed.detectedFoods}
        </p>

        <div class="history-section">
          ${parsed.meals.map(meal => `
            <div class="history-item">
              <strong>${meal.name}</strong>
              <div class="history-meta">${meal.time}</div>
              <p class="feedback">${meal.how}</p>
            </div>
          `).join("")}
        </div>

        <p class="caution">
          ${parsed.note}
        </p>
      `;

      clearInterval(loadingInterval);
      fridgeLoadingCard.classList.add("hidden");
      fridgeResultCard.classList.remove("hidden");
      fridgeAnalyzeBtn.textContent = "Suggest Again";

    } catch (error) {
      console.error(error);

      clearInterval(loadingInterval);
      fridgeLoadingCard.classList.add("hidden");

fridgeResultCard.innerHTML = `
  <h2>Dinner Ideas</h2>

  <p class="feedback">
    <strong>Detected:</strong>
    ${(parsed.detectedItems || []).join(", ") || "No clear items detected"}
  </p>

  ${
    parsed.possibleItems?.length
      ? `
        <p class="feedback">
          <strong>Maybe:</strong>
          ${parsed.possibleItems.join(", ")}
        </p>
      `
      : ""
  }

  <div class="history-section">
    ${(parsed.suggestedMeals || []).map(meal => `
      <div class="history-item">
        <strong>${meal.name}</strong>
        <div class="history-meta">${meal.time || ""}</div>

        <p class="feedback">
          ${meal.whyItWorks || ""}
        </p>

        <p class="feedback">
          <strong>Uses:</strong>
          ${(meal.uses || []).join(", ") || "Items from your photo"}
        </p>

        <p class="feedback">
          <strong>Need:</strong>
          ${(meal.needs || []).join(", ") || "Nothing extra"}
        </p>

        ${
          meal.steps?.length
            ? `
              <ol>
                ${meal.steps.map(step => `<li>${step}</li>`).join("")}
              </ol>
            `
            : ""
        }
      </div>
    `).join("")}
  </div>

  <div class="history-item">
    <strong>Quick Grocery List</strong>
    <p class="feedback">
      ${(parsed.groceryList || []).join(", ") || "No extra groceries needed"}
    </p>
  </div>
`;

      fridgeResultCard.classList.remove("hidden");
      fridgeAnalyzeBtn.textContent = "Try Again";

    } finally {
      fridgeAnalyzeBtn.disabled = false;
    }
  });
}