import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, goal, height, weight, targetWeight, ageRange, gender } = req.body;

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
You are FuelWise AI, an image-based athlete nutrition assistant.

User context:
- Height: ${height}
- Current weight: ${weight}
- Target weight: ${targetWeight}
- Age range: ${ageRange}
- Gender: ${gender}
- Mode: ${goal}

Goal rules:
- fuelwise = balanced performance nutrition, sustainable eating habits, recovery support, and long-term athlete fuel guidance
- cutwise = lower calorie choices, weight-cut focused guidance, leaner meal decisions, hydration awareness, and controlled bodyweight management
- gainwise = muscle growth, recovery support, higher calorie performance fuel, strength development, and athletic recovery nutrition
- hydratewise = hydration awareness, sodium balance, recovery fluids, dehydration prevention, electrolyte support, and performance hydration guidance

Analyze the uploaded food image visually.

Return ONLY valid JSON:

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
`
            },
            {
              type: "image_url",
              image_url: { url: image }
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
    res.status(500).json({ error: "Failed to analyze image" });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
};