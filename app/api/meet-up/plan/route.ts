import { NextRequest, NextResponse } from 'next/server';
import { MeetUpInput, MeetUpPlan } from '../../../../lib/meet-up/types';
import { fallbackPlan } from '../../../../lib/meet-up/plan-logic';

export async function POST(req: NextRequest) {
  try {
    const input: MeetUpInput = await req.json();

    // Validate input
    if (
      !input ||
      typeof input.eventName !== 'string' ||
      typeof input.date !== 'string' ||
      typeof input.time !== 'string' ||
      typeof input.pax !== 'number' ||
      input.pax < 2 ||
      input.pax > 30
    ) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Phase-1: fallback logic only
    const plan: MeetUpPlan = fallbackPlan(input);

    return NextResponse.json({ plan });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}
