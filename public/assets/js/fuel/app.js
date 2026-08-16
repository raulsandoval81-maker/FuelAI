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


let selectedImageBase64 =
  null;

let scanMode =
  "prescan";


const setup =
  JSON.parse(
    localStorage.getItem("fuelai-setup") || "{}"
  );


const FUEL_APP_TIME_ZONE =
  "America/Los_Angeles";


function getDateKey(
  date = new Date()
) {

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          FUEL_APP_TIME_ZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit"
      }
    ).formatToParts(date);


  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value;


  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value;


  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value;


  return (
    `${year}-${month}-${day}`
  );
}


const mealwiseTodayKey =
  getDateKey();


const waterKey =
  `fuelai-water-oz-${mealwiseTodayKey}`;



/* =========================
   HELPERS
========================= */

function escapeMealWiseHtml(
  value
) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function createMealWiseRequestId() {
  if (
    window.crypto
      ?.randomUUID
  ) {
    return window.crypto.randomUUID();
  }

  const bytes =
    new Uint8Array(16);

  window.crypto.getRandomValues(bytes);

  bytes[6] =
    (bytes[6] & 0x0f) | 0x40;

  bytes[8] =
    (bytes[8] & 0x3f) | 0x80;

  const hex =
    [...bytes].map(
      byte =>
        byte.toString(16)
          .padStart(2, "0")
    );

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join("")
  ].join("-");
}


async function getMealWiseAuthToken() {
  if (!window.FuelAIFirebase) {
    await new Promise(
      (resolve, reject) => {
        const timeout =
          window.setTimeout(
            () => reject(
              new Error(
                "FuelAI sign-in could not be loaded."
              )
            ),
            5000
          );

        window.addEventListener(
          "fuelai:firebase-ready",
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          { once: true }
        );
      }
    );
  }

  for (
    let attempt = 0;
    attempt < 50;
    attempt++
  ) {
    const user =
      window.FuelAIFirebase
        ?.auth
        ?.currentUser;

    if (user) {
      return user.getIdToken();
    }

    await new Promise(
      resolve =>
        window.setTimeout(
          resolve,
          100
        )
    );
  }

  const error =
    new Error(
      "Sign in to use MealWise."
    );

  error.code = "AUTH_REQUIRED";

  throw error;
}


function safeMealWiseResult(result) {
  return Object.fromEntries(
    Object.entries(result || {})
      .map(
        ([key, value]) => [
          key,
          escapeMealWiseHtml(value)
        ]
      )
  );
}


function parseFuelNumber(
  value
) {

  const match =
    String(
      value ?? ""
    )
      .replace(
        /,/g,
        ""
      )
      .match(
        /-?\d+(?:\.\d+)?/
      );


  if (
    !match
  ) {
    return 0;
  }


  const number =
    Number(
      match[0]
    );


  return (
    Number.isFinite(
      number
    )
      ? number
      : 0
  );
}


function resetMealScan() {

  selectedImageBase64 =
    null;


  if (
    previewImage
  ) {

    previewImage.src =
      "";

    previewImage.classList.add(
      "hidden"
    );

  }


  if (
    foodInput
  ) {
    foodInput.value =
      "";
  }


  if (
    foodUploadInput
  ) {
    foodUploadInput.value =
      "";
  }


  if (
    extraIngredients
  ) {
    extraIngredients.value =
      "";
  }


  uploadBox
    ?.classList
    .remove(
      "hidden"
    );


  resultCard
    ?.classList
    .add(
      "hidden"
    );


  loadingCard
    ?.classList
    .add(
      "hidden"
    );


  if (
    analyzeBtn
  ) {

    analyzeBtn.textContent =
      "Scan Meal";

    analyzeBtn.classList.add(
      "hidden"
    );

  }

}



/* =========================
   WATER
========================= */

addWaterBtn
  ?.addEventListener(
    "click",
    () => {

      const current =
        Number(
          localStorage.getItem(
            waterKey
          )
        ) || 0;


      const updated =
        Math.min(
          current + 8,
          128
        );


      localStorage.setItem(
        waterKey,
        String(
          updated
        )
      );


      if (
        window.FuelAILog
          ?.addFuelLog
      ) {

        window.FuelAILog
          .addFuelLog({
            type:
              "water",

            water:
              8,

            source:
              "mealwise"
          });

      }


      addWaterBtn.textContent =
        `💧 ${updated} oz Logged`;


      setTimeout(
        () => {

          addWaterBtn.textContent =
            "💧 + 8 oz Water";

        },
        1400
      );

    }
  );



/* =========================
   IMAGE HANDLING
========================= */

function handleFoodFile(
  file
) {

  if (
    !file
  ) {
    return;
  }


  const img =
    new Image();


  const reader =
    new FileReader();


  reader.onload =
    () => {

      img.onload =
        () => {

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
                (
                  height *
                  maxSize
                ) /
                width
              );


            width =
              maxSize;

          }


          else if (
            height > maxSize
          ) {

            width =
              Math.round(
                (
                  width *
                  maxSize
                ) /
                height
              );


            height =
              maxSize;

          }


          const canvas =
            document.createElement(
              "canvas"
            );


          canvas.width =
            width;


          canvas.height =
            height;


          const ctx =
            canvas.getContext(
              "2d"
            );


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


          if (
            previewImage
          ) {

            previewImage.src =
              selectedImageBase64;


            previewImage
              .classList
              .remove(
                "hidden"
              );

          }


          uploadBox
            ?.classList
            .add(
              "hidden"
            );


          resultCard
            ?.classList
            .add(
              "hidden"
            );


          loadingCard
            ?.classList
            .add(
              "hidden"
            );


          if (
            analyzeBtn
          ) {

            analyzeBtn
              .classList
              .remove(
                "hidden"
              );


            analyzeBtn.textContent =
              "Scan Meal";

          }

        };


      img.src =
        reader.result;

    };


  reader.readAsDataURL(
    file
  );

}



foodInput
  ?.addEventListener(
    "change",
    () => {

      handleFoodFile(
        foodInput.files?.[0]
      );

    }
  );


foodUploadInput
  ?.addEventListener(
    "change",
    () => {

      handleFoodFile(
        foodUploadInput.files?.[0]
      );

    }
  );



/* =========================
   QUICK ACTION AUTO-OPEN
========================= */

const quickParams =
  new URLSearchParams(
    window.location.search
  );


if (
  quickParams.get(
    "quick"
  ) === "meal"
) {

  setTimeout(
    () => {

      foodInput
        ?.click();

    },
    300
  );

}



/* =========================
   HISTORY
========================= */

function saveScan(
  scan
) {

  let scans =
    [];


  try {

    scans =
      JSON.parse(
        localStorage.getItem(
          "fuelai-history"
        ) || "[]"
      );

  } catch {

    scans =
      [];

  }


  scans.unshift({
    ...scan,

    createdAt:
      new Date()
        .toLocaleString()
  });


  const trimmed =
    scans.slice(
      0,
      5
    );


  localStorage.setItem(
    "fuelai-history",
    JSON.stringify(
      trimmed
    )
  );

}



/* =========================
   ERROR
========================= */

function showError(
  message
) {

  if (
    !resultCard
  ) {
    return;
  }


  resultCard.innerHTML = `
    <h2>Error</h2>

    <p class="feedback">
      ${
        escapeMealWiseHtml(
          message ||
          "Could not analyze meal. Try another photo."
        )
      }
    </p>
  `;


  resultCard
    .classList
    .remove(
      "hidden"
    );

}



/* =========================
   FUEL LOG
========================= */

function addMealToFuelLog(
  parsed
) {

  if (
    !window.FuelAILog
      ?.addFuelLog
  ) {
    return;
  }


  window.FuelAILog
    .addFuelLog({

      type:
        "meal",

      calories:
        parseFuelNumber(
          parsed.calories
        ),

      protein:
        parseFuelNumber(
          parsed.protein
        ),

      carbs:
        parseFuelNumber(
          parsed.carbs
        ),

      fats:
        parseFuelNumber(
          parsed.fat ??
          parsed.fats
        ),

      goal:
        setup.goal ||
        "fuelwise",

      source:
        "meal-scan"

    });

}



function saveParsedMeal(
  parsed
) {

  saveScan({

    mealName:
      parsed.mealName ||
      "Meal Scan",

    calories:
      parsed.calories ||
      "",

    protein:
      parsed.protein ||
      "",

    carbs:
      parsed.carbs ||
      "",

    fats:
      parsed.fat ??
      parsed.fats ??
      "",

    goal:
      setup.goal ||
      "fuelwise",

    confidence:
      parsed.confidence ||
      ""

  });


  addMealToFuelLog(
    parsed
  );

}



/* =========================
   ANALYZE
========================= */

analyzeBtn
  ?.addEventListener(
    "click",
    async () => {

      if (
        !selectedImageBase64
      ) {
        return;
      }


      const isDirectScan =
        scanMode ===
        "scan";


      if (
        !isDirectScan
      ) {
        scanMode =
          "prescan";
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


      if (
        scanMealBtn
      ) {
        scanMealBtn.disabled =
          false;
      }


      resultCard
        ?.classList
        .add(
          "hidden"
        );


      loadingCard
        ?.classList
        .remove(
          "hidden"
        );


      if (
        loadingText
      ) {
        loadingText.textContent =
          loadingMessages[0];
      }


      const loadingInterval =
        setInterval(
          () => {

            loadingIndex++;


            if (
              loadingIndex >=
              loadingMessages.length
            ) {
              loadingIndex =
                0;
            }


            if (
              loadingText
            ) {

              loadingText.textContent =
                loadingMessages[
                  loadingIndex
                ];

            }

          },
          1200
        );


      try {

        const token =
          await getMealWiseAuthToken();

        const requestId =
          createMealWiseRequestId();

        const response =
          await fetch(
            "/api/analyze",
            {

              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "Authorization":
                  `Bearer ${token}`,

                "X-FuelAI-Request-ID":
                  requestId
              },

              body:
                JSON.stringify({

                  image:
                    selectedImageBase64,

                  goal:
                    setup.goal ||
                    "fuelwise",

                  height:
                    setup.height ||
                    "",

                  weight:
                    setup.weight ||
                    "",

                  targetWeight:
                    setup.targetWeight ||
                    "",

                  ageRange:
                    setup.ageRange ||
                    "",

                  gender:
                    setup.gender ||
                    "",

                  activityLevel:
                    setup.activityLevel ||
                    "",

                  extraIngredients:
                    extraIngredients
                      ?.value
                      .trim() ||
                    ""

                })

            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          const apiError =
            new Error(
              data.error?.message ||
              data.error ||
              "MealWise could not complete this scan."
            );

          apiError.code =
            data.error?.code ||
            "API_REQUEST_FAILED";

          throw apiError;

        }


        if (
          !data.result
        ) {

          throw new Error(
            "No AI result returned"
          );

        }


        const parsed =
          data.result;

        const safeParsed =
          safeMealWiseResult(
            parsed
          );

        const safeUsageMessage =
          data.usage
            ? escapeMealWiseHtml(
                `${data.usage.remaining} of ${data.usage.limit} MealWise scans remaining today.`
              )
            : "";


        if (
          !resultCard
        ) {
          return;
        }


        resultCard.innerHTML = `
          <h2>
            ${
              safeParsed.mealName ||
              "Meal Scan"
            }
          </h2>

          <div class="calories">
            ${
              safeParsed.calories ||
              "Unknown"
            } Calories
          </div>

          <div class="macro-grid">

            <div>
              <strong>
                🥩 Protein
              </strong>

              <span>
                ${
                  safeParsed.protein ||
                  "—"
                }
              </span>
            </div>

            <div>
              <strong>
                🍞 Carbs
              </strong>

              <span>
                ${
                  safeParsed.carbs ||
                  "—"
                }
              </span>
            </div>

            <div>
              <strong>
                🥑 Fat
              </strong>

              <span>
                ${
                  safeParsed.fat ??
                  safeParsed.fats ??
                  "—"
                }
              </span>
            </div>

          </div>

          <p class="feedback">
            ${
              safeParsed.feedback ||
              ""
            }
          </p>

          ${
            safeParsed.extraNoteResponse
              ? `
                <p class="feedback">
                  ${safeParsed.extraNoteResponse}
                </p>
              `
              : ""
          }

          <p class="feedback">
            Fuel Check:
            ${
              safeParsed.score ||
              "—"
            }/10
          </p>

          <p class="feedback">
            Confidence Level:
            ${
              safeParsed.confidence ||
              "—"
            }
          </p>

          <p class="caution">
            ${
              safeParsed.caution ||
              ""
            }
          </p>

          ${
            safeUsageMessage
              ? `
                <p class="feedback">
                  ${safeUsageMessage}
                </p>
              `
              : ""
          }

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


        resultCard
          .classList
          .remove(
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


        if (
          isDirectScan
        ) {

          saveParsedMeal(
            parsed
          );


          const commitActions =
            document.querySelector(
              ".commit-actions"
            );


          if (
            commitActions
          ) {

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


        commitMealBtn
          ?.addEventListener(
            "click",
            () => {

              saveParsedMeal(
                parsed
              );


              commitMealBtn.textContent =
                "Meal Committed";


              commitMealBtn.disabled =
                true;

            }
          );


        discardMealBtn
          ?.addEventListener(
            "click",
            () => {

              resultCard
                .classList
                .add(
                  "hidden"
                );


              analyzeBtn.textContent =
                "Scan Meal";


              resetMealScan();

            }
          );

      }


      catch (
        err
      ) {

        console.error(
          "SCAN ERROR:",
          err
        );


        showError(
          err.message ||
          "Could not analyze meal. Try another photo."
        );

        if (
          err.code ===
          "AUTH_REQUIRED"
        ) {
          window.setTimeout(
            () => {
              window.location.href =
                "/account/login.html";
            },
            1200
          );
        }


        analyzeBtn.textContent =
          "Try Again";

      }


      finally {

        clearInterval(
          loadingInterval
        );


        loadingCard
          ?.classList
          .add(
            "hidden"
          );


        analyzeBtn.disabled =
          false;


        if (
          scanMealBtn
        ) {
          scanMealBtn.disabled =
            false;
        }


        if (
          scanMode ===
          "scan"
        ) {
          scanMode =
            "prescan";
        }

      }

    }
  );