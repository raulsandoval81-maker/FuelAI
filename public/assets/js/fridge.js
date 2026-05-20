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
      wiseFlavor = "medium",
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

    const flavorGuide = {
      rare:
        "Rare tone: 90% practical, 10% personality. Be calm, direct, and minimal.",

      medium:
        "Medium tone: 80% practical, 20% personality. Add light warmth and a little human flavor, but stay useful.",

      welldone:
        "Well Done tone: 70% practical, 30% personality. Add occasional playful WiseGuy/WiseGal-style comments, but do not become a parody."
    };

    const selectedFlavor =
      flavorGuide[wiseFlavor] || flavorGuide.medium;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      temperature: 0.3,
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

Tone setting:
${selectedFlavor}

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

Rules:
- Give EXACTLY 3 suggestions total.
- Give EXACTLY 2 quick meals and EXACTLY 1 snack.
- Mark each suggestion with a "type" field: "meal" or "snack".
- Keep meals and snacks simple, realistic, and fast.
- Prioritize ingredients visible in the image.
- Prioritize minimal extra shopping.
- Prefer low-dishes, low-cleanup meals when possible.
- Avoid requiring more than 1–2 missing grocery items per suggestion.
- Grocery list should include ONLY missing items.
- Keep instructions short.
- Avoid health lectures.
- Avoid calorie/macros.
- Avoid gourmet recipes.
- Avoid overwhelming the user.
- If something is uncertain, put it in possibleItems or unclearItems.
- Do not pretend certainty.
- If the image is not a fridge/pantry/food image, still give practical help based on what is visible.
- Personality should show lightly in wording only.
- Do not use exaggerated accents.
- Do not use mafia parody.
- Do not make every line funny.
- Help first. Flavor second.
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
        error: "Invalid AI JSON returned",
      });
    }

    return res.status(200).json({
      result: parsed,
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