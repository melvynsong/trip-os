import { MeetUpInput, MeetUpPlan } from './types';

const THEME_MAP: Record<string, string> = {
  Japanese: 'Japanese',
  Local: 'Local',
  Peranakan: 'Peranakan',
  Western: 'Western',
  Vegetarian: 'Vegetarian',
  Potluck: 'Potluck',
  'No preference': 'Sharing Meal',
};

export function fallbackPlan(input: MeetUpInput): MeetUpPlan {
  const pax = Math.max(2, Math.min(30, input.pax));
  // Simple logic: 1 main per 2-3 pax, 1 carb per 4, 1 veg per 4, 1 side per 5, 1 dessert per 6, 1 drink per pax
  return {
    theme: THEME_MAP[input.theme] || 'Sharing Meal',
    mains: Math.max(1, Math.round(pax / 3)),
    carbs: Math.max(1, Math.round(pax / 4)),
    vegetables: Math.max(1, Math.round(pax / 4)),
    sides: Math.max(1, Math.round(pax / 5)),
    desserts: Math.max(1, Math.round(pax / 6)),
    drinks: pax,
    notes: `Plan for a warm, inclusive meal. Adjust for dietary needs. ${input.theme !== 'No preference' ? `Theme: ${input.theme}.` : ''}`,
  };
}
