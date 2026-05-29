window.FridgeWiseMemory = (() => {
  const KEY =
    "fuelai-fridgewise-memory";

  const DEFAULT_MEMORY = {
    pantry: [
      "rice",
      "pasta",
      "beans",
      "tortillas"
    ],

    freezer: [
      "frozen chicken",
      "ground beef",
      "frozen veggies"
    ],

    extras: [],

    groceryList: [],

    favoriteMeals: [
      {
        name: "Chicken Tacos",
        ingredients: [
          "chicken",
          "tortillas",
          "salsa"
        ]
      },

      {
        name: "Rice Bowl",
        ingredients: [
          "rice",
          "chicken",
          "veggies"
        ]
      }
    ]
  };

  function load() {
    try {
      return {
        ...DEFAULT_MEMORY,
        ...JSON.parse(
          localStorage.getItem(KEY) || "{}"
        )
      };
    } catch {
      return DEFAULT_MEMORY;
    }
  }

  function save(memory) {
    localStorage.setItem(
      KEY,
      JSON.stringify(memory)
    );

    return memory;
  }

  function getAll() {
    return load();
  }

  function updateBucket(bucket, items) {
    const memory =
      load();

    memory[bucket] =
      items;

    return save(memory);
  }

  function addItem(bucket, item) {
    const clean =
      String(item || "")
        .trim()
        .toLowerCase();

    if (!clean) return load();

    const memory =
      load();

    const current =
      memory[bucket] || [];

    if (!current.includes(clean)) {
      current.push(clean);
    }

    memory[bucket] =
      current;

    return save(memory);
  }

  function removeItem(bucket, item) {
    const clean =
      String(item || "")
        .trim()
        .toLowerCase();

    const memory =
      load();

    memory[bucket] =
      (memory[bucket] || [])
        .filter(existing => existing !== clean);

    return save(memory);
  }

  function addFavoriteMeal(name, ingredients) {
    const memory =
      load();

    const mealName =
      String(name || "").trim();

    const mealIngredients =
      String(ingredients || "")
        .split(",")
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);

    if (!mealName || !mealIngredients.length) {
      return memory;
    }

    memory.favoriteMeals.push({
      name: mealName,
      ingredients: mealIngredients
    });

    return save(memory);
  }

  function getAvailableFoods() {
    const memory =
      load();

    return [
      ...(memory.pantry || []),
      ...(memory.freezer || []),
      ...(memory.extras || [])
    ];
  }

  function matchFavoriteMeals() {
    const memory =
      load();

    const available =
      getAvailableFoods();

    return (memory.favoriteMeals || []).map(meal => {
      const ingredients =
        meal.ingredients || [];

      const missing =
        ingredients.filter(item =>
          !available.includes(item)
        );

      return {
        ...meal,
        canMake:
          missing.length === 0,
        missing
      };
    });
  }

  return {
    getAll,
    save,
    updateBucket,
    addItem,
    removeItem,
    addFavoriteMeal,
    getAvailableFoods,
    matchFavoriteMeals
  };
})();