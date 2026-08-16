import {
  AiApiError,
  boundedAiString,
  boundedAiStringArray,
  validateAiImageDataUrl
} from "./ai-security.js";


const VALID_LANGUAGES = new Set([
  "en",
  "es"
]);

const VALID_FLAVORS = new Set([
  "sweetspot",
  "mafia",
  "toughguy",
  "internet"
]);

export const MAX_FRIDGEWISE_IMAGE_BYTES =
  6 * 1024 * 1024;


function invalidResult() {
  return new AiApiError(
    422,
    "AI_RESULT_INVALID",
    "FridgeWise returned an invalid result."
  );
}


function resultString(
  value,
  field,
  maximumLength
) {
  if (typeof value !== "string") {
    throw invalidResult();
  }

  return boundedAiString(
    value,
    field,
    maximumLength,
    {
      required: true,
      statusCode: 422,
      errorCode: "AI_RESULT_INVALID",
      publicMessage:
        "FridgeWise returned an invalid result."
    }
  );
}


function resultArray(
  value,
  field,
  maximumItems,
  maximumItemLength
) {
  if (!Array.isArray(value)) {
    throw invalidResult();
  }

  if (value.length > maximumItems) {
    throw invalidResult();
  }

  return value.map(item =>
    resultString(
      item,
      field,
      maximumItemLength
    )
  );
}


export function validateFridgeWiseRequest(body) {
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

  const wiseFlavor = boundedAiString(
    body.wiseFlavor || "sweetspot",
    "wiseFlavor",
    24
  ).toLowerCase();

  if (!VALID_FLAVORS.has(wiseFlavor)) {
    throw new AiApiError(
      400,
      "INVALID_REQUEST",
      "Choose a valid FridgeWise tone."
    );
  }

  const pantryItems = boundedAiStringArray(
    body.pantryItems || [],
    "pantryItems",
    {
      maximumItems: 40,
      maximumItemLength: 80
    }
  );

  const pantryCompanion =
    boundedAiStringArray(
      body.pantryCompanion || [],
      "pantryCompanion",
      {
        maximumItems: 40,
        maximumItemLength: 80
      }
    );

  const pantry = [];
  const seen = new Set();

  for (const item of [
    ...pantryItems,
    ...pantryCompanion
  ]) {
    const key = item.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      pantry.push(item);
    }
  }

  if (pantry.length > 60) {
    throw new AiApiError(
      400,
      "INVALID_REQUEST",
      "Too many pantry items were provided."
    );
  }

  return {
    image: validateAiImageDataUrl(
      body.image,
      {
        maximumBytes:
          MAX_FRIDGEWISE_IMAGE_BYTES,
        toolLabel: "FridgeWise"
      }
    ),
    lang,
    wiseFlavor,
    pantry,
    pantryNotes: boundedAiString(
      body.pantryNotes,
      "pantryNotes",
      500
    )
  };
}


export function validateFridgeWiseResult(result) {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    throw invalidResult();
  }

  if (
    !Array.isArray(result.suggestedMeals) ||
    result.suggestedMeals.length !== 3
  ) {
    throw invalidResult();
  }

  const suggestedMeals =
    result.suggestedMeals.map(meal => {
      if (
        !meal ||
        typeof meal !== "object" ||
        Array.isArray(meal)
      ) {
        throw invalidResult();
      }

      const type = resultString(
        meal.type,
        "type",
        16
      ).toLowerCase();

      if (!["meal", "snack"].includes(type)) {
        throw invalidResult();
      }

      return {
        type,
        name: resultString(
          meal.name,
          "name",
          120
        ),
        time: resultString(
          meal.time,
          "time",
          40
        ),
        whyItWorks: resultString(
          meal.whyItWorks,
          "whyItWorks",
          500
        ),
        uses: resultArray(
          meal.uses,
          "uses",
          15,
          80
        ),
        needs: resultArray(
          meal.needs,
          "needs",
          10,
          80
        ),
        steps: resultArray(
          meal.steps,
          "steps",
          8,
          240
        )
      };
    });

  const mealCount =
    suggestedMeals.filter(
      meal => meal.type === "meal"
    ).length;
  const snackCount =
    suggestedMeals.filter(
      meal => meal.type === "snack"
    ).length;

  if (mealCount !== 2 || snackCount !== 1) {
    throw invalidResult();
  }

  return {
    detectedItems: resultArray(
      result.detectedItems,
      "detectedItems",
      30,
      80
    ),
    possibleItems: resultArray(
      result.possibleItems,
      "possibleItems",
      20,
      80
    ),
    unclearItems: resultArray(
      result.unclearItems,
      "unclearItems",
      20,
      120
    ),
    suggestedMeals,
    groceryList: resultArray(
      result.groceryList,
      "groceryList",
      20,
      80
    )
  };
}
