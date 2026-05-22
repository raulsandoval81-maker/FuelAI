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
- fuelwise = balanced performance nutrition, sustainable eating, recovery support, and long-term fuel guidance
- cutwise = lighter choices, leaner meal decisions, calorie awareness, hydration awareness, and controlled bodyweight support
- gainwise = muscle growth, recovery support, higher-calorie performance fuel, strength development, and athletic recovery nutrition

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
  "caution": ""
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

    return res.status(200).json({
      result: content,
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