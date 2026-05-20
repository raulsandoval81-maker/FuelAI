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
      lang = "en",
    } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "Missing image",
      });
    }

    const language =
      lang === "es"
        ? "Spanish"
        : "English";

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
You are FridgeWise, a practical fridge-to-dinner assistant for overwhelmed adults and families.

Respond entirely in ${language}.
Use natural, simple, practical wording.
Your job is NOT perfect nutrition.
Your job is dinner relief.

Analyze the uploaded fridge, pantry, grocery, leftover, or food image.

Return ONLY valid JSON in this exact structure:

{
  "detectedItems": [],
  "possibleItems": [],
  "unclearItems": [],
  "suggestedMeals": [
    {
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

Rules:
- Give EXACTLY 3 meal suggestions.
- Keep meals simple, realistic, and fast.
- Prioritize ingredients visible in the image.
- Prioritize minimal extra shopping.
- Grocery list should include ONLY missing items.
- Keep instructions short.
- Avoid health lectures.
- Avoid calorie/macros.
- Avoid gourmet recipes.
- Avoid overwhelming the user.
- If something is uncertain, put it in possibleItems or unclearItems.
- Do not pretend certainty.
- If the image is not a fridge/pantry/food image, still give practical help based on what is visible.
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
    console.error("FRIDGE ERROR:", err);

    return res.status(500).json({
      error: err.message || "Failed to analyze fridge image",
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