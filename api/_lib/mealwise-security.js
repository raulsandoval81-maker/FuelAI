const VALID_GOALS = new Set([
  "fuelwise",
  "cutwise",
  "gainwise"
]);

const VALID_LANGUAGES = new Set([
  "en",
  "es"
]);

const VALID_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export const MAX_MEALWISE_IMAGE_BYTES =
  6 * 1024 * 1024;


export class MealWiseApiError extends Error {
  constructor(
    statusCode,
    code,
    message,
    details = {}
  ) {
    super(message);

    this.name = "MealWiseApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}


function boundedString(
  value,
  field,
  maximumLength
) {
  const normalized =
    String(value ?? "").trim();

  if (
    normalized.length >
    maximumLength
  ) {
    throw new MealWiseApiError(
      400,
      "INVALID_REQUEST",
      `${field} is too long.`
    );
  }

  return normalized;
}


function isValidImageSignature(
  bytes,
  mimeType
) {
  if (mimeType === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (mimeType === "image/png") {
    const signature = [
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a
    ];

    return signature.every(
      (byte, index) =>
        bytes[index] === byte
    );
  }

  if (mimeType === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.subarray(0, 4)
        .toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12)
        .toString("ascii") === "WEBP"
    );
  }

  return false;
}


function validateImageDataUrl(image) {
  const value =
    String(image ?? "").trim();

  const match =
    /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\r\n]+)$/i
      .exec(value);

  if (!match) {
    throw new MealWiseApiError(
      415,
      "UNSUPPORTED_IMAGE",
      "Choose a JPEG, PNG, or WebP image."
    );
  }

  const mimeType =
    match[1].toLowerCase();

  if (!VALID_IMAGE_TYPES.has(mimeType)) {
    throw new MealWiseApiError(
      415,
      "UNSUPPORTED_IMAGE",
      "Choose a JPEG, PNG, or WebP image."
    );
  }

  const base64 =
    match[2].replace(/\s/g, "");

  const bytes =
    Buffer.from(base64, "base64");

  if (!bytes.length) {
    throw new MealWiseApiError(
      415,
      "UNSUPPORTED_IMAGE",
      "The selected image could not be read."
    );
  }

  if (
    bytes.length >
    MAX_MEALWISE_IMAGE_BYTES
  ) {
    throw new MealWiseApiError(
      413,
      "IMAGE_TOO_LARGE",
      "Choose an image smaller than 6 MB."
    );
  }

  if (
    !isValidImageSignature(
      bytes,
      mimeType
    )
  ) {
    throw new MealWiseApiError(
      415,
      "UNSUPPORTED_IMAGE",
      "The image type does not match its contents."
    );
  }

  return value;
}


export function validateMealWiseRequest(
  body
) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    throw new MealWiseApiError(
      400,
      "INVALID_REQUEST",
      "A JSON request body is required."
    );
  }

  const goal =
    boundedString(
      body.goal || "fuelwise",
      "goal",
      32
    ).toLowerCase();

  if (!VALID_GOALS.has(goal)) {
    throw new MealWiseApiError(
      400,
      "INVALID_REQUEST",
      "Choose a valid MealWise goal."
    );
  }

  const lang =
    boundedString(
      body.lang || "en",
      "lang",
      8
    ).toLowerCase();

  if (!VALID_LANGUAGES.has(lang)) {
    throw new MealWiseApiError(
      400,
      "INVALID_REQUEST",
      "Choose a supported language."
    );
  }

  return {
    image:
      validateImageDataUrl(
        body.image
      ),
    goal,
    lang,
    height:
      boundedString(
        body.height,
        "height",
        64
      ),
    weight:
      boundedString(
        body.weight,
        "weight",
        64
      ),
    targetWeight:
      boundedString(
        body.targetWeight,
        "targetWeight",
        64
      ),
    ageRange:
      boundedString(
        body.ageRange,
        "ageRange",
        64
      ),
    gender:
      boundedString(
        body.gender,
        "gender",
        64
      ),
    activityLevel:
      boundedString(
        body.activityLevel,
        "activityLevel",
        96
      ),
    extraIngredients:
      boundedString(
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
  const normalized =
    String(value ?? "").trim();

  if (
    (required && !normalized) ||
    normalized.length > maximumLength
  ) {
    throw new MealWiseApiError(
      422,
      "AI_RESULT_INVALID",
      "MealWise returned an invalid result."
    );
  }

  return normalized;
}


export function validateMealWiseResult(
  result
) {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    throw new MealWiseApiError(
      422,
      "AI_RESULT_INVALID",
      "MealWise returned an invalid result."
    );
  }

  const confidence =
    resultString(
      result.confidence,
      "confidence",
      16
    ).toLowerCase();

  if (
    !new Set([
      "low",
      "medium",
      "high"
    ]).has(confidence)
  ) {
    throw new MealWiseApiError(
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
    throw new MealWiseApiError(
      422,
      "AI_RESULT_INVALID",
      "MealWise returned an invalid result."
    );
  }

  return {
    mealName:
      resultString(
        result.mealName,
        "mealName",
        120
      ),
    calories:
      resultString(
        result.calories,
        "calories",
        32
      ),
    protein:
      resultString(
        result.protein,
        "protein",
        32
      ),
    carbs:
      resultString(
        result.carbs,
        "carbs",
        32
      ),
    fat:
      resultString(
        result.fat ?? result.fats,
        "fat",
        32
      ),
    score:
      String(score),
    confidence,
    feedback:
      resultString(
        result.feedback,
        "feedback",
        1200
      ),
    caution:
      resultString(
        result.caution,
        "caution",
        500
      ),
    extraNoteResponse:
      resultString(
        result.extraNoteResponse,
        "extraNoteResponse",
        300,
        false
      )
  };
}


export function validateRequestId(
  value
) {
  const requestId =
    String(value ?? "").trim();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(requestId)
  ) {
    throw new MealWiseApiError(
      400,
      "INVALID_REQUEST",
      "A valid request ID is required."
    );
  }

  return requestId.toLowerCase();
}
