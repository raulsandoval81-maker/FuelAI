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

let selectedImageBase64 = null;
let scanMode = "prescan";

const setup =
  JSON.parse(
    localStorage.getItem("fuelai-setup") || "{}"
  );

function handleFoodFile(file) {

  if (!file) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = () => {

    img.onload = () => {

      const maxSize = 1200;

      let width = img.width;
      let height = img.height;

      if (
        width > height &&
        width > maxSize
      ) {

        height =
          Math.round(
            (height * maxSize) / width
          );

        width = maxSize;

      }

      else if (height > maxSize) {

        width =
          Math.round(
            (width * maxSize) / height
          );

        height = maxSize;

      }

      const canvas =
        document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

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

      if (uploadBox) {
        uploadBox.classList.add(
          "hidden"
        );
      }

      if (analyzeBtn) {

        analyzeBtn.classList.remove(
          "hidden"
        );

        analyzeBtn.textContent =
          "Scan Meal";
      }

      if (scanMealBtn) {
        scanMealBtn.classList.remove(
          "hidden"
        );
      }

      resultCard.classList.add(
        "hidden"
      );

      loadingCard.classList.add(
        "hidden"
      );

    };

    img.src = reader.result;

  };

  reader.readAsDataURL(file);

}

if (foodInput) {

  foodInput.addEventListener(
    "change",
    () => {

      handleFoodFile(
        foodInput.files[0]
      );

    }
  );

}

if (foodUploadInput) {

  foodUploadInput.addEventListener(
    "change",
    () => {

      handleFoodFile(
        foodUploadInput.files[0]
      );

    }
  );

}

if (scanMealBtn) {

  scanMealBtn.addEventListener(
    "click",
    () => {

      scanMode = "scan";

      analyzeBtn.click();

    }
  );

}

function saveScan(scan) {

  const scans =
    JSON.parse(
      localStorage.getItem(
        "fuelai-history"
      ) || "[]"
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

  resultCard.classList.remove(
    "hidden"
  );

}

if (analyzeBtn) {

  analyzeBtn.addEventListener(
    "click",
    async () => {

      if (!selectedImageBase64)
        return;

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

      let loadingIndex = 0;

      analyzeBtn.disabled = true;

      analyzeBtn.textContent =
        "Analyzing...";

      if (scanMealBtn) {
        scanMealBtn.disabled = true;
      }

      resultCard.classList.add(
        "hidden"
      );

      loadingCard.classList.remove(
        "hidden"
      );

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
            loadingMessages[
              loadingIndex
            ];

        }, 1200);

      try {

        const response =
          await fetch(
            "/api/analyze",
            {

              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({

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

                lang:
                  setup.lang || "en",

                extraIngredients:
                  extraIngredients
                    ?.value
                    .trim() || ""

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

              <span>
                ${
                  parsed.protein || "—"
                }
              </span>
            </div>

            <div>
              <strong>🍞 Carbs</strong>

              <span>
                ${
                  parsed.carbs || "—"
                }
              </span>
            </div>

            <div>
              <strong>🥑 Fat</strong>

              <span>
                ${
                  parsed.fat || "—"
                }
              </span>
            </div>

          </div>

          <p class="feedback">
            ${
              parsed.feedback || ""
            }
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
            ${
              parsed.score || "—"
            }/10
          </p>

          <p class="feedback">
            Confidence Level:
            ${
              parsed.confidence || "—"
            }
          </p>

          <p class="caution">
            ${
              parsed.caution || ""
            }
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

        resultCard.classList.remove(
          "hidden"
        );

        const commitMealBtn =
          document.getElementById(
            "commitMealBtn"
          );

        const discardMealBtn =
          document.getElementById(
            "discardMealBtn"
          );

        if (isDirectScan) {

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

          if (window.FuelAILog) {

            window.FuelAILog.addFuelLog({

              type: "meal",

              calories:
                Number(
                  String(
                    parsed.calories
                  ).replace(
                    /[^0-9]/g,
                    ""
                  )
                ) || 0,

              protein:
                Number(
                  String(
                    parsed.protein
                  ).replace(
                    /[^0-9]/g,
                    ""
                  )
                ) || 0,

              goal:
                setup.goal ||
                "fuelwise",

              source:
                "meal-scan"

            });

          }

          const commitActions =
            document.querySelector(
              ".commit-actions"
            );

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

        if (commitMealBtn) {

          commitMealBtn.addEventListener(
            "click",
            () => {

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

              if (window.FuelAILog) {

                window.FuelAILog.addFuelLog({

                  type: "meal",

                  calories:
                    Number(
                      String(
                        parsed.calories
                      ).replace(
                        /[^0-9]/g,
                        ""
                      )
                    ) || 0,

                  protein:
                    Number(
                      String(
                        parsed.protein
                      ).replace(
                        /[^0-9]/g,
                        ""
                      )
                    ) || 0,

                  goal:
                    setup.goal ||
                    "fuelwise",

                  source:
                    "meal-scan"

                });

              }

              commitMealBtn.textContent =
                "Meal Committed";

              commitMealBtn.disabled = true;

            }
          );

        }

        if (discardMealBtn) {

          discardMealBtn.addEventListener(
            "click",
            () => {

              resultCard.classList.add(
                "hidden"
              );

              analyzeBtn.textContent =
                "Scan Meal";

              scanMode =
                "prescan";

            }
          );

        }

        analyzeBtn.textContent =
          "Pre-Scan Another Meal";

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

        clearInterval(
          loadingInterval
        );

        loadingCard.classList.add(
          "hidden"
        );

        analyzeBtn.disabled = false;

        if (scanMealBtn) {
          scanMealBtn.disabled = false;
        }

        if (
          scanMode === "scan"
        ) {
          scanMode = "prescan";
        }

      }

    }
  );

}