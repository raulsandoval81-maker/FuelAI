import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  MEAL_HISTORY_KEY,
  loadRecentMeals,
  renderRecentMeals,
  sanitizeMeal,
  saveRecentMeal
} from "../public/assets/js/fuel/meal-history.js";

import {
  activateAccountStorage,
  logoutAccountStorage
} from "../public/assets/js/core/account-storage.js";


const DAY_MS =
  24 * 60 * 60 * 1000;


class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return Array.from(
      this.values.keys()
    )[index] ?? null;
  }

  getItem(key) {
    return this.values.has(key)
      ? this.values.get(key)
      : null;
  }

  setItem(key, value) {
    this.values.set(
      String(key),
      String(value)
    );
  }

  removeItem(key) {
    this.values.delete(key);
  }
}


class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.className = "";
    this.textContent = "";
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  replaceChildren(...children) {
    this.children = children;
  }
}


class FakeDocument {
  createElement(tagName) {
    return new FakeElement(
      tagName,
      this
    );
  }
}


test(
  "analysis data is not stored until Commit Meal saves it",
  async () => {
    const storage = new MemoryStorage();

    sanitizeMeal({
      mealName: "Analyzed meal",
      calories: "500"
    });

    assert.equal(
      storage.getItem(MEAL_HISTORY_KEY),
      null
    );

    const appSource = await readFile(
      new URL(
        "../public/assets/js/fuel/app.js",
        import.meta.url
      ),
      "utf8"
    );
    const analyzeStart =
      appSource.indexOf(
        "analyzeBtn\n  ?.addEventListener"
      );
    const commitStart =
      appSource.indexOf(
        "commitMealBtn\n          ?.addEventListener"
      );

    assert.ok(analyzeStart >= 0);
    assert.ok(commitStart > analyzeStart);
    assert.equal(
      appSource
        .slice(analyzeStart, commitStart)
        .includes("saveParsedMeal("),
      false
    );
    assert.equal(
      appSource
        .slice(commitStart)
        .includes("saveParsedMeal("),
      true
    );
  }
);


test(
  "Commit Meal stores only structured fields and never photos or prompts",
  () => {
    const storage = new MemoryStorage();
    const now = Date.now();

    saveRecentMeal({
      mealName: "Rice bowl",
      calories: "620",
      protein: "42g",
      carbs: "71g",
      fats: "18g",
      goal: "fuelwise",
      confidence: "high",
      image: "data:image/jpeg;base64,SECRET",
      photo: "blob:SECRET",
      prompt: "private prompt",
      raw: { private: true }
    }, storage, now);

    const raw =
      storage.getItem(MEAL_HISTORY_KEY);
    const stored = JSON.parse(raw);

    assert.equal(stored.length, 1);
    assert.equal(
      stored[0].mealName,
      "Rice bowl"
    );
    assert.deepEqual(
      Object.keys(stored[0]).sort(),
      [
        "calories",
        "carbs",
        "confidence",
        "createdAt",
        "fats",
        "goal",
        "mealName",
        "protein"
      ].sort()
    );
    assert.doesNotMatch(raw, /base64|blob:|private prompt|SECRET/);
  }
);


test(
  "Recent Meals keeps at most five and removes meals older than 42 days",
  () => {
    const storage = new MemoryStorage();
    const now = Date.now();

    for (let index = 0; index < 7; index += 1) {
      saveRecentMeal({
        mealName: `Meal ${index}`,
        createdAt:
          new Date(
            now - index * DAY_MS
          ).toISOString()
      }, storage, now);
    }

    const five =
      loadRecentMeals(storage, now);

    assert.equal(five.length, 5);
    assert.equal(five[0].mealName, "Meal 0");

    storage.setItem(
      MEAL_HISTORY_KEY,
      JSON.stringify([
        {
          mealName: "Day 42",
          createdAt:
            new Date(
              now - 42 * DAY_MS + 1000
            ).toISOString()
        },
        {
          mealName: "Day 43",
          createdAt:
            new Date(
              now - 43 * DAY_MS
            ).toISOString()
        }
      ])
    );

    const boundary =
      loadRecentMeals(storage, now);

    assert.deepEqual(
      boundary.map(meal => meal.mealName),
      ["Day 42"]
    );
  }
);


test(
  "Recent Meals renders model text with safe DOM text nodes",
  () => {
    const documentRef =
      new FakeDocument();
    const container =
      new FakeElement(
        "div",
        documentRef
      );

    renderRecentMeals(
      container,
      [{
        mealName:
          "<img src=x onerror=alert(1)>",
        calories: "500",
        protein: "30g",
        carbs: "60g",
        fats: "15g",
        createdAt:
          new Date().toISOString()
      }],
      documentRef
    );

    assert.equal(container.children.length, 1);
    assert.deepEqual(
      container.children
        .flatMap(card => card.children)
        .map(child => child.tagName),
      ["h3", "p", "p"]
    );
    assert.equal(
      container.children[0]
        .children[0]
        .textContent,
      "<img src=x onerror=alert(1)>"
    );
  }
);


test(
  "User A cannot see User B MealWise history",
  () => {
    const storage = new MemoryStorage();

    activateAccountStorage(
      "user-a",
      storage
    );
    saveRecentMeal({
      mealName: "A meal"
    }, storage);

    logoutAccountStorage(
      "user-a",
      storage
    );
    activateAccountStorage(
      "user-b",
      storage
    );

    assert.deepEqual(
      loadRecentMeals(storage),
      []
    );

    saveRecentMeal({
      mealName: "B meal"
    }, storage);
    logoutAccountStorage(
      "user-b",
      storage
    );
    activateAccountStorage(
      "user-a",
      storage
    );

    assert.deepEqual(
      loadRecentMeals(storage)
        .map(meal => meal.mealName),
      ["A meal"]
    );
  }
);
