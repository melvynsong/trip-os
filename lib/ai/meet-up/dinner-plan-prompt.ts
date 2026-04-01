import { MeetUpInput } from '../../meet-up/types';

export function buildDinnerPlanPrompt(input: MeetUpInput): string {
  return `
You are a helpful dinner party planner. Given the following event details, suggest a practical food plan for the group.

Event: ${input.eventName}
Date: ${input.date}
Time: ${input.time}
Location: ${input.location}
Host: ${input.host}
Pax: ${input.pax}
Theme: ${input.theme}
Notes: ${input.notes}

Suggest:
- Theme
- Number of mains, carbs, vegetables, sides, desserts, drinks
- Helpful notes
  `.trim();
}
