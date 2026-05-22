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

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: {
  type: "json_object"
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

Adjust tone and feedback naturally based on the selected mode.

FuelWise should feel balanced and sustainable.

CutWise should encourage restraint and awareness without guilt or extreme dieting.

GainWise should encourage fueling, recovery, and performance support without reckless overeating.

Keep all guidance practical, calm, and simple.


- fuelwise =
balanced performance nutrition,
sustainable eating,
recovery support,
steady energy,
consistency,
and long-term healthy fuel guidance

- cutwise =
lighter choices,
leaner meal decisions,
portion awareness,
hydration awareness,
controlled bodyweight support,
and avoiding unnecessary overeating

- gainwise =
muscle growth,
performance fuel,
higher-calorie support,
recovery nutrition,
strength development,
and avoiding under-eating

Extra ingredients or notes:
${extraIngredients || "None provided"}
Analyze the uploaded food image visually.

If extra ingredients were provided,
briefly acknowledge them naturally.

Examples:
"Gotcha. Factoring that in."
"Noted. Sauces and oils can add up fast."
"10-4. Adding that into the estimate."

Keep it short.
One sentence maximum.

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

    const content = response.choices?.[0]?.message?.content;


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
    error: "AI formatting failed"
  });

}

return res.status(200).json({
  result: parsed,
});

  } catch (err) {
    console.error("ANALYZE ERROR:", err);

    return res.status(500).json({
      error: err.message || "Failed to analyze image",
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