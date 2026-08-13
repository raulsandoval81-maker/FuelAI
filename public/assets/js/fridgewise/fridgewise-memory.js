window.FridgeWiseMemory = (() => {
  "use strict";

  const KEY =
    "fuelai-fridgewise-memory";


  const DEFAULT_MEMORY = {
    pantry: [],
    freezer: [],
    extras: [],
    groceryList: [],
    favoriteMeals: []
  };


  function safeArray(value) {
    return Array.isArray(value)
      ? value
      : [];
  }


  function normalizeText(value) {
    return String(
      value ?? ""
    )
      .trim()
      .toLowerCase();
  }


  function normalizeTextArray(value) {
    return safeArray(value)
      .map(
        normalizeText
      )
      .filter(
        Boolean
      );
  }


  function normalizeFavoriteMeals(value) {
    return safeArray(value)
      .map((meal) => {
        if (
          typeof meal ===
          "string"
        ) {
          return {
            name:
              String(meal)
                .trim(),

            ingredients:
              []
          };
        }


        return {
          name:
            String(
              meal?.name ?? ""
            ).trim(),

          ingredients:
            normalizeTextArray(
              meal?.ingredients
            )
        };
      })
      .filter(
        (meal) =>
          meal.name
      );
  }


  function normalizeMemory(memory) {
    return {
      pantry:
        normalizeTextArray(
          memory?.pantry
        ),

      freezer:
        normalizeTextArray(
          memory?.freezer
        ),

      extras:
        normalizeTextArray(
          memory?.extras
        ),

      groceryList:
        normalizeTextArray(
          memory?.groceryList
        ),

      favoriteMeals:
        normalizeFavoriteMeals(
          memory?.favoriteMeals
        )
    };
  }


  function load() {
    try {
      const raw =
        JSON.parse(
          localStorage.getItem(
            KEY
          ) || "{}"
        );

      return normalizeMemory(
        raw
      );
    } catch {
      return {
        ...DEFAULT_MEMORY
      };
    }
  }


  function save(memory) {
    const normalized =
      normalizeMemory(
        memory
      );

    localStorage.setItem(
      KEY,
      JSON.stringify(
        normalized
      )
    );

    return normalized;
  }


  function getAll() {
    return load();
  }


  function updateBucket(
    bucket,
    items
  ) {
    const memory =
      load();


    if (
      !Object.prototype
        .hasOwnProperty
        .call(
          DEFAULT_MEMORY,
          bucket
        )
    ) {
      return memory;
    }


    if (
      bucket ===
      "favoriteMeals"
    ) {
      memory[bucket] =
        normalizeFavoriteMeals(
          items
        );
    } else {
      memory[bucket] =
        normalizeTextArray(
          items
        );
    }


    return save(
      memory
    );
  }


  function addItem(
    bucket,
    item
  ) {
    const clean =
      normalizeText(
        item
      );


    if (
      !clean
    ) {
      return load();
    }


    if (
      ![
        "pantry",
        "freezer",
        "extras",
        "groceryList"
      ].includes(
        bucket
      )
    ) {
      return load();
    }


    const memory =
      load();


    const current =
      safeArray(
        memory[bucket]
      );


    const exists =
      current.some(
        (existing) =>
          normalizeText(
            existing
          ) ===
          clean
      );


    if (
      !exists
    ) {
      current.push(
        clean
      );
    }


    memory[bucket] =
      current;


    return save(
      memory
    );
  }


  function removeItem(
    bucket,
    item
  ) {
    const clean =
      normalizeText(
        item
      );


    if (
      ![
        "pantry",
        "freezer",
        "extras",
        "groceryList"
      ].includes(
        bucket
      )
    ) {
      return load();
    }


    const memory =
      load();


    memory[bucket] =
      safeArray(
        memory[bucket]
      )
        .filter(
          (existing) =>
            normalizeText(
              existing
            ) !==
            clean
        );


    return save(
      memory
    );
  }


  function addFavoriteMeal(
    name,
    ingredients
  ) {
    const memory =
      load();


    const mealName =
      String(
        name ?? ""
      ).trim();


    const mealIngredients =
      Array.isArray(
        ingredients
      )
        ? normalizeTextArray(
            ingredients
          )
        : normalizeTextArray(
            String(
              ingredients ?? ""
            ).split(
              ","
            )
          );


    if (
      !mealName
    ) {
      return memory;
    }


    const duplicate =
      memory.favoriteMeals
        .some(
          (meal) =>
            normalizeText(
              meal.name
            ) ===
            normalizeText(
              mealName
            )
        );


    if (
      !duplicate
    ) {
      memory.favoriteMeals.push({
        name:
          mealName,

        ingredients:
          mealIngredients
      });
    }


    return save(
      memory
    );
  }


  function getAvailableFoods() {
    const memory =
      load();


    return [
      ...safeArray(
        memory.pantry
      ),

      ...safeArray(
        memory.freezer
      ),

      ...safeArray(
        memory.extras
      )
    ];
  }


  function matchFavoriteMeals() {
    const memory =
      load();


    const available =
      new Set(
        getAvailableFoods()
          .map(
            normalizeText
          )
      );


    return safeArray(
      memory.favoriteMeals
    )
      .map(
        (meal) => {
          const ingredients =
            normalizeTextArray(
              meal.ingredients
            );


          const missing =
            ingredients.filter(
              (item) =>
                !available.has(
                  normalizeText(
                    item
                  )
                )
            );


          return {
            ...meal,

            ingredients,

            canMake:
              missing.length ===
              0,

            missing
          };
        }
      );
  }


  function clearAll() {
    localStorage.removeItem(
      KEY
    );

    return {
      ...DEFAULT_MEMORY
    };
  }


  return {
    getAll,
    save,
    updateBucket,
    addItem,
    removeItem,
    addFavoriteMeal,
    getAvailableFoods,
    matchFavoriteMeals,
    clearAll
  };
})();