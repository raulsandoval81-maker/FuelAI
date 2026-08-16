import {
  AiApiError,
  boundedAiString,
  validateAiImageDataUrl,
  validateAiRequestId
} from "./ai-security.js";


const VALID_GOALS = new Set([
  "fuelwise",
  "cutwise",
  "gainwise"
]);

const VALID_LANGUAGES = new Set([
  "en",
  "es"
]);

export const MAX_MEALWISE_IMAGE_BYTES =
  6 * 1024 * 1024;

export {
  AiApiError as MealWiseApiError,
  validateAiRequestId as validateRequestId
};


export function validateMealWiseRequest(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    throw new AiApiError(
      400,
      "INVALID_REQUEST",
      "A JSON request body is required."
    );
  }

  const goal = boundedAiString(
    body.goal || "fuelwise",
    "goal",
    32
  ).toLowerCase();

  if (!VALID_GOALS.has(goal)) {
    throw new AiApiError(
      400,
      "INVALID_REQUEST",
      "Choose a valid MealWise goal."
    );
  }

  const lang = boundedAiString(
    body.lang || "en",
    "lang",
    8
  ).toLowerCase();

  if (!VALID_LANGUAGES.has(lang)) {
    throw new AiApiError(
      400,
      "INVALID_REQUEST",
      "Choose a supported language."
    );
  }

  return {
    image: validateAiImageDataUrl(
      body.image,
      {
        maximumBytes:
          MAX_MEALWISE_IMAGE_BYTES,
        toolLabel: "MealWise"
      }
    ),
    goal,
    lang,
    height: boundedAiString(
      body.height,
      "height",
      64
    ),
    weight: boundedAiString(
      body.weight,
      "weight",
      64
    ),
    targetWeight: boundedAiString(
      body.targetWeight,
      "targetWeight",
      64
    ),
    ageRange: boundedAiString(
      body.ageRange,
      "ageRange",
      64
    ),
    gender: boundedAiString(
      body.gender,
      "gender",
      64
    ),
    activityLevel: boundedAiString(
      body.activityLevel,
      "activityLevel",
      96
    ),
    extraIngredients: boundedAiString(
      body.extraIngredients,
      "extraIngredients",
      500
    )
  };
}


function resultString(
  value,
  field,
  maximumLength,
  required = true
) {
  return boundedAiString(
    value,
    field,
    maximumLength,
    {
      required,
      statusCode: 422,
      errorCode: "AI_RESULT_INVALID",
      publicMessage:
        "MealWise returned an invalid result."
    }
  );
}


export function validateMealWiseResult(result) {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    throw new AiApiError(
      422,
      "AI_RESULT_INVALID",
      "MealWise returned an invalid result."
    );
  }

  const confidence = resultString(
    result.confidence,
    "confidence",
    16
  ).toLowerCase();

  if (
    !["low", "medium", "high"]
      .includes(confidence)
  ) {
    throw new AiApiError(
      422,
      "AI_RESULT_INVALID",
      "MealWise returned an invalid result."
    );
  }

  const score =
    Number.parseFloat(result.score);

  if (
    !Number.isFinite(score) ||
    score < 1 ||
    score > 10
  ) {
    throw new AiApiError(
      422,
      "AI_RESULT_INVALID",
      "MealWise returned an invalid result."
    );
  }

  return {
    mealName: resultString(
      result.mealName,
      "mealName",
      120
    ),
    calories: resultString(
      result.calories,
      "calories",
      32
    ),
    protein: resultString(
      result.protein,
      "protein",
      32
    ),
    carbs: resultString(
      result.carbs,
      "carbs",
      32
    ),
    fat: resultString(
      result.fat ?? result.fats,
      "fat",
      32
    ),
    score: String(score),
    confidence,
    feedback: resultString(
      result.feedback,
      "feedback",
      1200
    ),
    caution: resultString(
      result.caution,
      "caution",
      500
    ),
    extraNoteResponse: resultString(
      result.extraNoteResponse,
      "extraNoteResponse",
      300,
      false
    )
  };
}
