export type MeetUpInput = {
  eventName: string;
  date: string;
  time: string;
  location: string;
  host: string;
  pax: number;
  theme: string;
  notes: string;
};

export type MeetUpPlan = {
  theme: string;
  mains: number;
  carbs: number;
  vegetables: number;
  sides: number;
  desserts: number;
  drinks: number;
  notes: string;
};
