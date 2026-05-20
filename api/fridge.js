import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "Missing image"
      });
    }

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
You are a practical fridge-to-dinner assistant for overwhelmed adults and families.

Analyze the uploaded fridge, pantry, grocery, leftover, or food image.

Your job is NOT perfect nutrition.
Your job is dinner relief.

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
    });

    res.status(200).json({
      result: response.choices[0].message.content
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to analyze fridge image"
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