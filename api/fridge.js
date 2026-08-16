import OpenAI from "openai";

import {
  AiApiError
} from "./_lib/ai-security.js";

import {
  validateFridgeWiseRequest,
  validateFridgeWiseResult
} from "./_lib/fridgewise-security.js";

import {
  authenticateFridgeWise,
  finalizeFridgeWiseScan,
  finalizeSuccessfulFridgeWiseScan,
  getFridgeWiseUsageResponse,
  reserveFridgeWiseScan
} from "./_lib/fridgewise-metering.js";


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
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
      await authenticateFridgeWise(req);
    const input =
      validateFridgeWiseRequest(req.body);

    reservation =
      await reserveFridgeWiseScan({
        uid: user.uid,
        requestId:
          req.headers[
            "x-fuelai-request-id"
          ]
      });

    const {
      image,
      lang,
      wiseFlavor,
      pantry,
      pantryNotes
    } = input;

    const language =
      lang === "es"
        ? "Spanish"
        : "English";

    const flavorGuide = {
      sweetspot:
        "Sweet Spot tone: calm, practical, lightly human. Useful first, personality second.",
      mafia:
        "Mafia tone: light funny movie flavor with playful confidence. No threats, crime language, stereotypes, or exaggerated accents. Keep it family-friendly and useful.",
      toughguy:
        "Tough Guy tone: direct coach energy. Clear, motivating, practical, no excuses, but never mean, toxic, or shaming.",
      internet:
        "Internet tone: light meme/teen flavor. Understandable, not cringe, not excessive, and still practical."
    };

    const response =
      await client.chat.completions.create({
        model: "gpt-4.1-mini",
        response_format: {
          type: "json_object"
        },
        temperature: 0.3,
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
You are FridgeWise, a practical fridge-to-dinner assistant for overwhelmed adults, teens, and families.

Respond entirely in ${language}.
Use natural, simple, practical wording.
Your job is dinner relief, not perfect nutrition.

Tone setting:
${flavorGuide[wiseFlavor]}

Available pantry and freezer items:
${pantry.length ? pantry.join(", ") : "None provided"}

Extra pantry/freezer notes:
${pantryNotes || "None provided"}

Treat those items and notes as available ingredients. Do not add them to the grocery list. Grocery items must be missing from both the image and supplied kitchen context.

Analyze the uploaded fridge, pantry, grocery, leftover, or food image.

Return ONLY valid JSON in this exact structure:
{
  "detectedItems": [],
  "possibleItems": [],
  "unclearItems": [],
  "suggestedMeals": [
    {
      "type": "",
      "name": "",
      "time": "",
      "whyItWorks": "",
      "uses": [],
      "needs": [],
      "steps": []
    }
  ],
  "groceryList": []
}

Give exactly 3 suggestions: exactly 2 meals and 1 snack. Use "meal" or "snack" in each type field. Keep suggestions fast, realistic, low-cleanup, and based first on visible ingredients, then supplied pantry items. Require no more than 1–2 missing items per suggestion. Keep steps short. Avoid health lectures, calories, macros, gourmet recipes, shame, profanity, threats, criminal language, and stereotypes. Put uncertain items in possibleItems or unclearItems and do not pretend certainty. If the image is unusual, still provide practical help based only on what is visible. Help first; flavor second.
                `
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ]
      }, {
        timeout: 30000
      });

    providerUsage = response.usage || null;

    const content =
      response.choices?.[0]
        ?.message?.content;

    if (!content) {
      throw new AiApiError(
        502,
        "AI_PROVIDER_UNAVAILABLE",
        "FridgeWise could not complete this scan."
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw new AiApiError(
        422,
        "AI_RESULT_INVALID",
        "FridgeWise could not read this result. Try another photo."
      );
    }

    const result =
      validateFridgeWiseResult(parsed);

    await finalizeSuccessfulFridgeWiseScan({
      reservation,
      providerUsage
    });

    return res.status(200).json({
      result,
      usage:
        getFridgeWiseUsageResponse(
          reservation
        )
    });
  } catch (error) {
    console.error(
      "FRIDGEWISE ERROR:",
      error
    );

    if (reservation) {
      try {
        await finalizeFridgeWiseScan({
          reservation,
          succeeded: false,
          providerUsage,
          failureCode:
            error.code ||
            "AI_PROVIDER_UNAVAILABLE"
        });
      } catch (meteringError) {
        console.error(
          "FRIDGEWISE METERING ERROR:",
          meteringError
        );
      }
    }

    const isSafeError =
      error instanceof AiApiError;

    return res.status(
      isSafeError
        ? error.statusCode
        : 500
    ).json({
      error: {
        code:
          isSafeError
            ? error.code
            : "INTERNAL_ERROR",
        message:
          isSafeError
            ? error.message
            : "FridgeWise could not complete this scan.",
        ...(error.details || {})
      }
    });
  }
}


export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
};
