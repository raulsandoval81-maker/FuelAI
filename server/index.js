import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/analyze", async (req, res) => {
  try {
    const { image, goal } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",

      response_format: {
        type: "json_object",
      },

      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",

              text: `
You are FuelAI, an image-based meal analysis assistant.

Analyze the uploaded meal image visually.
Only estimate ingredients and portions that are actually visible.

User goal: ${goal}

Goal rules:

- fuelwise = balanced performance nutrition, sustainable eating habits, recovery support, and long-term athlete fuel guidance

- cutwise = lower calorie choices, weight-cut focused guidance, leaner meal decisions, hydration awareness, and controlled bodyweight management

- gainwise = muscle growth, recovery support, higher calorie performance fuel, strength development, and athletic recovery nutrition

- hydratewise = hydration awareness, sodium balance, recovery fluids, dehydration prevention, electrolyte support, and performance hydration guidance
Return ONLY valid JSON in this exact structure:

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

Rules:
- mealName should be short
- calories should be a number only
- protein/carbs/fat should include grams like "45g"
- score should be 1-10
- confidence should be "low", "medium", or "high"
- feedback should be 1 short paragraph based on the goal
- caution should be 1 short sentence
- return ONLY JSON
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

    res.json({
      result: response.choices[0].message.content,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to analyze image",
    });
  }
});

app.listen(3000, () => {
  console.log("FuelAI server running on port 3000");
});