import { NextApiRequest, NextApiResponse } from "next";

import { buildPackingListPrompt } from "@/lib/ai/packing";
import { normalizePackingList } from "@/lib/ai/packing-normalizer";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { destination, start_date, end_date, number_of_days, weather, packing_style } = req.body;
    const prompt = buildPackingListPrompt({
      destination,
      start_date,
      end_date,
      number_of_days,
      weather,
      packing_style,
    });

    // Call OpenAI API (or your provider)
    const aiRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful travel assistant." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!aiRes.ok) {
      throw new Error("AI provider error");
    }
    const aiJson = await aiRes.json();
    const aiText = aiJson.choices?.[0]?.message?.content || "";
    let data;
    try {
      data = JSON.parse(aiText);
    } catch (e) {
      throw new Error("AI response was not valid JSON");
    }

    const packingList = normalizePackingList(data);
    res.status(200).json(packingList);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Packing list generation failed" });
  }
}
