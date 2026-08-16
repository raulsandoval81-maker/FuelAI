import OpenAI from "openai";

import {
  MealWiseApiError,
  validateMealWiseRequest,
  validateMealWiseResult
} from "./_lib/mealwise-security.js";

import {
  authenticateMealWise,
  finalizeMealWiseScan,
  getMealWiseUsageResponse,
  reserveMealWiseScan
} from "./_lib/mealwise-metering.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Method not allowed."
      }
    });
  }

  let reservation = null;
  let providerUsage = null;

  try {
    const user =
      await authenticateMealWise(req);

    const input =
      validateMealWiseRequest(
        req.body
      );

    reservation =
      await reserveMealWiseScan({
        uid: user.uid,
        requestId:
          req.headers[
            "x-fuelai-request-id"
          ]
      });

    const {
      image,
      goal,
      height,
      weight,
      targetWeight,
      ageRange,
      gender,
      activityLevel,
      lang,
      extraIngredients
    } = input;

    const language =
      lang === "es"
        ? "Spanish"
        : "English";

    const response =
      await client.chat.completions.create({
        model: "gpt-4.1-mini",
        response_format: {
          type: "json_object",
        },
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
You are FuelAI, an image-based nutrition decision assistant.

Respond entirely in ${language}.
Use natural, simple, practical wording.
Keep the response useful for a normal person, not a bodybuilding spreadsheet.
Do not give medical advice.

User context:
- Height: ${height}
- Current weight: ${weight}
- Target weight: ${targetWeight || "not provided"}
- Age range: ${ageRange}
- Body type: ${gender}
- Activity level: ${activityLevel}
- Mode: ${goal}

Mode rules:
- fuelwise = balanced performance nutrition, sustainable eating, recovery support, steady energy, consistency, and long-term healthy fuel guidance.
- cutwise = lighter choices, leaner meal decisions, portion awareness, hydration awareness, controlled bodyweight support, and avoiding unnecessary overeating.
- gainwise = muscle growth, performance fuel, higher-calorie support, recovery nutrition, strength development, and avoiding under-eating.

Adjust tone and feedback naturally based on the selected mode:
- FuelWise should feel balanced and sustainable.
- CutWise should encourage restraint and awareness without guilt or extreme dieting.
- GainWise should encourage fueling, recovery, and performance support without reckless overeating.

Extra ingredients or notes:
${extraIngredients || "None provided"}

Extra note behavior:
- If extra ingredients were provided, briefly acknowledge the note without blindly agreeing with it.
- Most of the time, respond generally.
- Only mention a specific ingredient if it seems normal, useful, and believable.
- If the note seems unusual, mismatched, joking, or unclear, do not repeat it back.
- Never argue with the user.
- Never shame the user.
- Never make the app look gullible.
- Keep extraNoteResponse short.
- One sentence maximum.

Safe examples:
"Notes received. Factoring that into the estimate."
"Extra ingredients considered. Portion estimate adjusted."
"Got it. Adjusting the estimate with that note."

Specific examples only when normal:
"Extra sauce noted. Estimate adjusted."
"Cheese added into the estimate."
"Adjusting for dressing."

Bad examples:
Do not say "Steak in fruit salad noted."
Do not repeat strange combinations unless clearly useful.

Analyze the uploaded food image visually.

Return ONLY valid JSON with this exact shape:

{
  "mealName": "",
  "calories": "",
  "protein": "",
  "carbs": "",
  "fat": "",
  "score": "",
  "confidence": "",
  "feedback": "",
  "caution": "",
  "extraNoteResponse": ""
}
                `,
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        max_tokens: 900,
      }, {
        timeout: 30000,
      });

    providerUsage =
      response.usage || null;

    const content =
      response.choices?.[0]?.message?.content;

    if (!content) {
      throw new MealWiseApiError(
        502,
        "AI_PROVIDER_UNAVAILABLE",
        "MealWise could not complete this scan."
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw new MealWiseApiError(
        422,
        "AI_RESULT_INVALID",
        "MealWise could not read this result. Try another photo."
      );
    }

    const result =
      validateMealWiseResult(parsed);

    await finalizeMealWiseScan({
      reservation,
      succeeded: true,
      providerUsage
    });

    return res.status(200).json({
      result,
      usage:
        getMealWiseUsageResponse(
          reservation
        )
    });

  } catch (err) {
    console.error("ANALYZE ERROR:", err);

    if (reservation) {
      try {
        await finalizeMealWiseScan({
          reservation,
          succeeded: false,
          providerUsage,
          failureCode:
            err.code ||
            "AI_PROVIDER_UNAVAILABLE"
        });
      } catch (meteringError) {
        console.error(
          "MEALWISE METERING ERROR:",
          meteringError
        );
      }
    }

    const isSafeError =
      err instanceof MealWiseApiError;

    const statusCode =
      isSafeError
        ? err.statusCode
        : 500;

    const code =
      isSafeError
        ? err.code
        : "INTERNAL_ERROR";

    const message =
      isSafeError
        ? err.message
        : "MealWise could not complete this scan.";

    return res.status(statusCode).json({
      error: {
        code,
        message,
        ...(err.details || {})
      }
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};