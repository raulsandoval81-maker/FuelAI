import assert from "node:assert/strict";
import test from "node:test";

import {
  MealWiseApiError,
  validateMealWiseRequest,
  validateMealWiseResult,
  validateRequestId
} from "../api/_lib/mealwise-security.js";

import {
  normalizeMealWisePlan
} from "../api/_lib/mealwise-metering.js";


const REQUEST_ID =
  "123e4567-e89b-42d3-a456-426614174000";

const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgo=";

test(
  "preserves the legacy Basic plan as Standard",
  () => {
    assert.equal(
      normalizeMealWisePlan("basic"),
      "standard"
    );

    assert.equal(
      normalizeMealWisePlan("BASIC"),
      "standard"
    );
  }
);


test(
  "accepts a valid request ID",
  () => {
    assert.equal(
      validateRequestId(REQUEST_ID),
      REQUEST_ID
    );
  }
);


test(
  "rejects a malformed request ID",
  () => {
    assert.throws(
      () => validateRequestId("retry-1"),
      error =>
        error instanceof
          MealWiseApiError &&
        error.code ===
          "INVALID_REQUEST"
    );
  }
);


test(
  "validates and normalizes a MealWise request",
  () => {
    const request =
      validateMealWiseRequest({
        image: PNG_DATA_URL,
        goal: "CUTWISE",
        lang: "ES",
        extraIngredients:
          " salsa "
      });

    assert.equal(
      request.goal,
      "cutwise"
    );

    assert.equal(request.lang, "es");

    assert.equal(
      request.extraIngredients,
      "salsa"
    );
  }
);


test(
  "rejects a forged image MIME type",
  () => {
    assert.throws(
      () => validateMealWiseRequest({
        image:
          "data:image/jpeg;base64,iVBORw0KGgo=",
        goal: "fuelwise"
      }),
      error =>
        error instanceof
          MealWiseApiError &&
        error.code ===
          "UNSUPPORTED_IMAGE"
    );
  }
);


test(
  "rejects unsupported goals",
  () => {
    assert.throws(
      () => validateMealWiseRequest({
        image: PNG_DATA_URL,
        goal: "hydratewise"
      }),
      error =>
        error instanceof
          MealWiseApiError &&
        error.code ===
          "INVALID_REQUEST"
    );
  }
);


test(
  "accepts a bounded MealWise result",
  () => {
    const result =
      validateMealWiseResult({
        mealName: "Chicken bowl",
        calories: 640,
        protein: "42g",
        carbs: "70g",
        fat: "18g",
        score: 8,
        confidence: "HIGH",
        feedback: "Balanced fuel.",
        caution: "Portions are estimated.",
        extraNoteResponse: "Salsa included."
      });

    assert.equal(
      result.calories,
      "640"
    );

    assert.equal(
      result.confidence,
      "high"
    );
  }
);


test(
  "rejects an out-of-range score",
  () => {
    assert.throws(
      () => validateMealWiseResult({
        mealName: "Meal",
        calories: "500",
        protein: "30g",
        carbs: "50g",
        fat: "15g",
        score: 11,
        confidence: "medium",
        feedback: "Feedback",
        caution: "Caution"
      }),
      error =>
        error instanceof
          MealWiseApiError &&
        error.code ===
          "AI_RESULT_INVALID"
    );
  }
);
