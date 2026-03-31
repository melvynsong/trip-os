import { NextRequest, NextResponse } from 'next/server'
import { buildPackingListPrompt } from '@/lib/ai/packing'
import { normalizePackingList } from '@/lib/ai/packing-normalizer'

export async function POST(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const body = await req.json();
  const prompt = buildPackingListPrompt(body);
  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful travel assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 800,
    }),
  });
  const aiJson = await aiResponse.json();
  const aiText = aiJson.choices?.[0]?.message?.content || '';
  let data;
  try {
    data = JSON.parse(aiText);
  } catch {
    return NextResponse.json({ error: 'AI response invalid' }, { status: 400 });
  }
  const packingList = normalizePackingList(data, body.days_count);
  return NextResponse.json(packingList);
}
