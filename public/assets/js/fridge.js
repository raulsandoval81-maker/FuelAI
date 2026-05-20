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
      "Reducing dinner stress...",
      "Building dinner paths..."
    ];

    let loadingIndex = 0;

    fridgeAnalyzeBtn.disabled = true;
    fridgeAnalyzeBtn.textContent = "Thinking...";

    fridgeResultCard.classList.add("hidden");

    fridgeLoadingCard.classList.remove("hidden");

    fridgeLoadingText.textContent =
      loadingMessages[0];

    const loadingInterval = setInterval(() => {

      loadingIndex++;

      if (loadingIndex >= loadingMessages.length) {
        loadingIndex = 0;
      }

      fridgeLoadingText.textContent =
        loadingMessages[loadingIndex];

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

      const cleaned =
        data.result
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

      const parsed =
        JSON.parse(cleaned);

      localStorage.setItem(
        "fuelwise_fridge_result",
        JSON.stringify(parsed)
      );

      clearInterval(loadingInterval);

      fridgeLoadingCard.classList.add("hidden");

      fridgeResultCard.innerHTML = `
        <h2>Fridge Scanned</h2>

        <p class="feedback">
          <strong>Detected:</strong>
          ${(parsed.detectedItems || []).join(", ") || "No clear items detected"}
        </p>

        <a class="start-btn" href="/fridge-meals.html">
          View Meal Ideas
        </a>
      `;

      fridgeResultCard.classList.remove("hidden");

      fridgeAnalyzeBtn.textContent =
        "Scan Again";

    } catch (error) {

      console.error(error);

      clearInterval(loadingInterval);

      fridgeLoadingCard.classList.add("hidden");

      fridgeResultCard.innerHTML = `
        <h2>Error</h2>

        <p class="feedback">
          Could not analyze fridge.
          Please try again.
        </p>
      `;

      fridgeResultCard.classList.remove("hidden");

      fridgeAnalyzeBtn.textContent =
        "Try Again";

    } finally {

      fridgeAnalyzeBtn.disabled = false;

    }

  });

}