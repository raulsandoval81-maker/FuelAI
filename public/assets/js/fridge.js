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
      wiseFlavor = "sweetspot",
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
      sweetspot:
        "Sweet Spot tone: calm, practical, lightly human. Useful first, personality second.",

      mafia:
        "Mafia tone: light funny movie flavor with playful confidence. Do not use threats, crime language, exaggerated accents, or offensive stereotypes. Keep it useful and family-friendly.",

      toughguy:
        "Tough Guy tone: direct coach energy. Clear, motivating, no excuses, but not mean, toxic, or shaming.",

      internet:
        "Internet tone: light meme/teen slang flavor. Keep it understandable, not cringe, not excessive, and still practical.",
    };

    const selectedFlavor =
      flavorGuide[wiseFlavor] || flavorGuide.sweetspot;

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
- Do not make every line funny.
- Help first. Flavor second.
- Never shame the user.
- Never insult the user.
- Never use profanity.
- Never use threatening language.
- Never use criminal language.
- Never use stereotypes.
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
      parsed =
        typeof content === "string"
          ? JSON.parse(content)
          : content;
    } catch (err) {
      console.error("FRIDGE JSON PARSE ERROR:", err);
      console.error("RAW FRIDGE RESULT:", content);

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
      error:
        err.message ||
        "Failed to analyze fridge image",
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