export type Section =
  | "today"
  | "activity"
  | "nutrition"
  | "labs"
  | "weekly"
  | "connections"
  | "assistant"
  | "more";

export type IntegrationId =
  | "gabit"
  | "ultrahuman"
  | "apple_health"
  | "google_fit"
  | "fitbit"
  | "garmin"
  | "myfitnesspal"
  | "strava"
  | "withings"
  | "oura";

export type Integration = {
  id: IntegrationId;
  name: string;
  category: "activity" | "nutrition" | "vitals" | "sleep" | "ring";
  description: string;
  connected: boolean;
  lastSync: string | null;
  primary?: boolean;
  metrics?: string[];
  /** How the live connector authenticated */
  accountLabel?: string | null;
  /** Last connector note (oauth / import / hub) */
  syncNote?: string | null;
};

/** Core sources Helia is built around for you */
export const PRIMARY_INTEGRATION_IDS: IntegrationId[] = [
  "gabit",
  "ultrahuman",
  "google_fit",
  "apple_health",
];

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodEntry = {
  id: string;
  date: string;
  meal: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
};

export type DayMetrics = {
  date: string;
  steps: number;
  activeMinutes: number;
  caloriesBurned: number;
  waterMl: number;
  sleepHours: number;
  restingHr: number;
  temperatureC: number;
  sedentaryMinutes: number;
  lastMovementAt: string;
};

export type LabMarker = {
  name: string;
  value: number;
  unit: string;
  rangeMin: number;
  rangeMax: number;
  flag: "normal" | "low" | "high";
};

export type BloodReport = {
  id: string;
  title: string;
  lab: string;
  collectedAt: string;
  markers: LabMarker[];
  notes: string;
};

export type NudgePriority = "info" | "action" | "urgent";

export type Nudge = {
  id: string;
  type: "hydrate" | "move" | "temperature" | "nutrition" | "labs" | "rest";
  title: string;
  body: string;
  priority: NudgePriority;
  createdAt: string;
  dismissed: boolean;
};

export type DietRecommendation = {
  id: string;
  title: string;
  reason: string;
  meals: string[];
  focus: string[];
};

export type WeeklyInsight = {
  headline: string;
  summary: string;
  wins: string[];
  watchouts: string[];
  nextWeekFocus: string[];
  avgSteps: number;
  avgCaloriesIn: number;
  avgCaloriesOut: number;
  waterAdherence: number;
  movementScore: number;
};

export type Profile = {
  name: string;
  goalSteps: number;
  goalCalories: number;
  goalWaterMl: number;
  goalProtein: number;
  dietPreference: "balanced" | "high_protein" | "mediterranean" | "plant_forward";
  autonomousNudges: boolean;
};

export type HealthState = {
  profile: Profile;
  integrations: Integration[];
  days: DayMetrics[];
  foods: FoodEntry[];
  reports: BloodReport[];
  nudges: Nudge[];
  lastNudgeCheck: string | null;
};
