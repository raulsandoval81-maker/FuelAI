import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const {
      image,
      goal = "fuelwise",
      height = "",
      weight = "",
      targetWeight = "",
      ageRange = "",
      gender = "",
      lang = "en",
      extraIngredients = "",
    } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "Missing image",
      });
    }

    const safeImage =
      String(image || "").trim();

    if (!safeImage.startsWith("data:image/")) {
      return res.status(400).json({
        error: "Invalid image format",
      });
    }

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
                  url: safeImage,
                },
              },
            ],
          },
        ],
      });

    const content =
      response.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({
        error: "No AI response returned",
      });
    }

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(500).json({
        error: "AI formatting failed",
      });
    }

    return res.status(200).json({
      result: parsed,
    });

  } catch (err) {
    console.error("ANALYZE ERROR:", err);

    return res.status(500).json({
      error:
        err.message ||
        "Failed to analyze image",
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