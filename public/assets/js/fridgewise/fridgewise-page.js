"use strict";


/* =========================
   DOM
========================= */

const fridgeInput =
  document.getElementById(
    "fridgeInput"
  );

const fridgeUploadInput =
  document.getElementById(
    "fridgeUploadInput"
  );

const fridgePreview =
  document.getElementById(
    "fridgePreview"
  );

const fridgeAnalyzeBtn =
  document.getElementById(
    "fridgeAnalyzeBtn"
  );

const fridgeLoadingCard =
  document.getElementById(
    "fridgeLoadingCard"
  );

const fridgeLoadingText =
  document.getElementById(
    "fridgeLoadingText"
  );

const fridgeResultCard =
  document.getElementById(
    "fridgeResultCard"
  );

const pantryToggle =
  document.getElementById(
    "pantryToggle"
  );

const pantryPanel =
  document.getElementById(
    "pantryPanel"
  );

const pantryInput =
  document.getElementById(
    "pantryInput"
  );

const addPantryItem =
  document.getElementById(
    "addPantryItem"
  );

const pantryChips =
  document.getElementById(
    "pantryChips"
  );

const pantryNotes =
  document.getElementById(
    "pantryNotes"
  );


const Memory =
  window.FridgeWiseMemory;


const fridgeLoadingMessages = [
  "Checking fridge...",
  "Finding quick meal options...",
  "Looking at pantry and freezer notes...",
  "Keeping it simple...",
  "Building dinner ideas..."
];


let fridgeLoadingInterval =
  null;

let selectedImage =
  null;

let pantryCompanion =
  [];



/* =========================
   HELPERS
========================= */

function normalizeText(
  value
) {

  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();

}


function safeArray(
  value
) {

  return Array.isArray(
    value
  )
    ? value
    : [];

}


function uniqueTextArray(
  values
) {

  const seen =
    new Set();


  return safeArray(
    values
  )
    .map(
      normalizeText
    )
    .filter(
      (item) => {

        if (
          !item ||
          seen.has(
            item
          )
        ) {
          return false;
        }


        seen.add(
          item
        );

        return true;

      }
    );

}


function getSetup() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "fuelai-setup"
      ) || "{}"
    );

  } catch {

    return {};

  }

}


function getCurrentMemory() {

  return (
    Memory?.getAll?.() ||
    {
      pantry: [],
      freezer: [],
      extras: [],
      groceryList: [],
      favoriteMeals: []
    }
  );

}


function getCurrentPantryCompanion() {

  const memory =
    getCurrentMemory();


  return uniqueTextArray([
    ...safeArray(
      memory.pantry
    ),

    ...safeArray(
      memory.freezer
    ),

    ...safeArray(
      memory.extras
    ),

    ...safeArray(
      pantryCompanion
    )
  ]);

}



/* =========================
   PANTRY STATE
========================= */

function syncPantryCompanion() {

  const memory =
    getCurrentMemory();


  pantryCompanion =
    uniqueTextArray([
      ...safeArray(
        memory.pantry
      ),

      ...safeArray(
        memory.freezer
      ),

      ...safeArray(
        memory.extras
      )
    ]);

}


syncPantryCompanion();



/* =========================
   GROCERY HELPERS
========================= */

function addMissingItemsToGroceryList(
  items
) {

  const cleanItems =
    uniqueTextArray(
      items
    );


  if (
    !cleanItems.length
  ) {
    return;
  }


  const memory =
    getCurrentMemory();


  const current =
    uniqueTextArray(
      memory.groceryList
    );


  const merged =
    uniqueTextArray([
      ...current,
      ...cleanItems
    ]);


  memory.groceryList =
    merged;


  Memory?.save?.(
    memory
  );

}



/* =========================
   PANTRY TOGGLE
========================= */

if (
  pantryToggle &&
  pantryPanel
) {

  pantryToggle.addEventListener(
    "click",
    () => {

      const isOpening =
        pantryPanel
          .classList
          .contains(
            "hidden"
          );


      pantryPanel
        .classList
        .toggle(
          "hidden"
        );


      pantryToggle.setAttribute(
        "aria-expanded",
        String(
          isOpening
        )
      );

    }
  );

}



/* =========================
   PANTRY CHIPS
========================= */

pantryChips
  ?.addEventListener(
    "click",
    (event) => {

      const target =
        event.target;


      if (
        !(
          target instanceof
          Element
        )
      ) {
        return;
      }


      const btn =
        target.closest(
          "button"
        );


      if (
        !btn
      ) {
        return;
      }


      const item =
        normalizeText(
          btn.dataset.item
        );


      if (
        !item
      ) {
        return;
      }


      const exists =
        pantryCompanion
          .includes(
            item
          );


      if (
        exists
      ) {

        pantryCompanion =
          pantryCompanion.filter(
            (existing) =>
              existing !==
              item
          );


        btn.classList.remove(
          "active"
        );

      } else {

        pantryCompanion.push(
          item
        );


        pantryCompanion =
          uniqueTextArray(
            pantryCompanion
          );


        btn.classList.add(
          "active"
        );

      }

    }
  );



/* =========================
   ADD PANTRY ITEM
========================= */

function addPantryCompanionItem() {

  const value =
    normalizeText(
      pantryInput?.value
    );


  if (
    !value
  ) {
    return;
  }


  if (
    !pantryCompanion.includes(
      value
    )
  ) {

    pantryCompanion.push(
      value
    );

  }


  /*
   * Persist this as real pantry
   * memory, not just temporary
   * scan context.
   */

  Memory?.addItem?.(
    "pantry",
    value
  );


  if (
    pantryInput
  ) {

    pantryInput.value =
      "";

    pantryInput.focus();

  }

}


addPantryItem
  ?.addEventListener(
    "click",
    addPantryCompanionItem
  );


pantryInput
  ?.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !==
        "Enter"
      ) {
        return;
      }


      event.preventDefault();


      addPantryCompanionItem();

    }
  );



/* =========================
   LOADING
========================= */

function startFridgeLoadingMessages() {

  stopFridgeLoadingMessages();


  let index =
    0;


  if (
    fridgeLoadingText
  ) {

    fridgeLoadingText.textContent =
      fridgeLoadingMessages[
        index
      ];

  }


  fridgeLoadingInterval =
    setInterval(
      () => {

        index =
          (
            index + 1
          ) %
          fridgeLoadingMessages.length;


        if (
          fridgeLoadingText
        ) {

          fridgeLoadingText.textContent =
            fridgeLoadingMessages[
              index
            ];

        }

      },
      1200
    );

}


function stopFridgeLoadingMessages() {

  if (
    !fridgeLoadingInterval
  ) {
    return;
  }


  clearInterval(
    fridgeLoadingInterval
  );


  fridgeLoadingInterval =
    null;

}



/* =========================
   IMAGE
========================= */

function handleImage(
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

          } else if (
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


          selectedImage =
            canvas.toDataURL(
              "image/jpeg",
              0.82
            );


          if (
            fridgePreview
          ) {

            fridgePreview.src =
              selectedImage;


            fridgePreview
              .classList
              .remove(
                "hidden"
              );

          }


          fridgeAnalyzeBtn
            ?.classList
            .remove(
              "hidden"
            );

        };


      img.src =
        reader.result;

    };


  reader.readAsDataURL(
    file
  );

}



fridgeInput
  ?.addEventListener(
    "change",
    (event) => {

      handleImage(
        event.target
          .files?.[0]
      );

    }
  );


fridgeUploadInput
  ?.addEventListener(
    "change",
    (event) => {

      handleImage(
        event.target
          .files?.[0]
      );

    }
  );



/* =========================
   QUICK ACTION
========================= */

const quickParams =
  new URLSearchParams(
    window.location.search
  );


if (
  quickParams.get(
    "quick"
  ) ===
  "fridge"
) {

  setTimeout(
    () => {

      fridgeInput
        ?.click();

    },
    300
  );

}



/* =========================
   ANALYZE
========================= */

fridgeAnalyzeBtn
  ?.addEventListener(
    "click",
    async () => {

      if (
        !selectedImage
      ) {
        return;
      }


      fridgeAnalyzeBtn.disabled =
        true;


      fridgeLoadingCard
        ?.classList
        .remove(
          "hidden"
        );


      fridgeResultCard
        ?.classList
        .add(
          "hidden"
        );


      startFridgeLoadingMessages();


      const setup =
        getSetup();


      /*
       * Pull latest memory at
       * scan time.
       */

      const memory =
        getCurrentMemory();


      const favoriteMeals =
        safeArray(
          memory.favoriteMeals
        );


      const mealMatches =
        Memory
          ?.matchFavoriteMeals?.() ||
        [];


      const missingItems =
        uniqueTextArray(
          mealMatches.flatMap(
            (meal) =>
              meal.missing ||
              []
          )
        );


      const currentPantryCompanion =
        getCurrentPantryCompanion();


      try {

        const response =
          await fetch(
            "/api/fridge",
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
                    selectedImage,

                  lang:
                    setup.lang ||
                    "en",

                  wiseFlavor:
                    setup.wiseFlavor ||
                    "sweetspot",

                  pantryCompanion:
                    currentPantryCompanion,

                  favoriteMeals,

                  mealMatches,

                  missingItems,

                  pantryNotes:
                    pantryNotes
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

          throw new Error(
            data.error ||
            "Failed to analyze fridge"
          );

        }


        if (
          !data.result
        ) {

          throw new Error(
            "No fridge result returned"
          );

        }


        localStorage.setItem(
          "fuelwise_fridge_result",
          JSON.stringify(
            data.result
          )
        );


        if (
          fridgeLoadingText
        ) {

          fridgeLoadingText.textContent =
            "Dinner ideas ready.";

        }


        stopFridgeLoadingMessages();


        window.location.href =
          "/tools/fridgewise/fridgewise-results.html";

      }


      catch (
        err
      ) {

        console.error(
          "FRIDGEWISE ERROR:",
          err
        );


        stopFridgeLoadingMessages();


        fridgeLoadingCard
          ?.classList
          .add(
            "hidden"
          );


        if (
          fridgeLoadingText
        ) {

          fridgeLoadingText.textContent =
            "Something went wrong. Try again.";

        }


        fridgeAnalyzeBtn.disabled =
          false;

      }

    }
  );