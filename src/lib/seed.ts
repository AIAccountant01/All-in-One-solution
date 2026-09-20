import type {
  BloodReport,
  DayMetrics,
  FoodEntry,
  HealthState,
  Integration,
} from "./types";

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

const INTEGRATIONS: Integration[] = [
  {
    id: "gabit",
    name: "Gabit Ring",
    category: "ring",
    description:
      "Smart ring for recovery, sleep, HR/HRV, skin temperature, steps, stress, and nutrition via the Gabit app.",
    connected: false,
    lastSync: null,
    primary: true,
    metrics: ["Sleep", "HRV", "Temp", "Steps", "Recovery", "Stress"],
  },
  {
    id: "ultrahuman",
    name: "Ultrahuman",
    category: "ring",
    description:
      "Ring AIR recovery index, sleep stages, temperature, HRV, movement — plus CGM when you use Ultrahuman M1.",
    connected: false,
    lastSync: null,
    primary: true,
    metrics: ["Recovery", "Sleep", "HRV", "Temp", "Glucose"],
  },
  {
    id: "google_fit",
    name: "Google Fit",
    category: "activity",
    description:
      "Android activity hub — steps, workouts, and Heart Points. Bridges Health Connect sources on Android.",
    connected: false,
    lastSync: null,
    primary: true,
    metrics: ["Steps", "Workouts", "Calories"],
  },
  {
    id: "apple_health",
    name: "Apple Health",
    category: "activity",
    description:
      "iPhone HealthKit hub — pulls Watch, Gabit, Ultrahuman, and other apps into one permissioned stream.",
    connected: false,
    lastSync: null,
    primary: true,
    metrics: ["Steps", "Heart", "Sleep", "Workouts"],
  },
  {
    id: "fitbit",
    name: "Fitbit",
    category: "activity",
    description: "Steps, sleep stages, and resting heart rate.",
    connected: false,
    lastSync: null,
  },
  {
    id: "garmin",
    name: "Garmin",
    category: "activity",
    description: "Training load, VO₂, and outdoor activities.",
    connected: false,
    lastSync: null,
  },
  {
    id: "myfitnesspal",
    name: "MyFitnessPal",
    category: "nutrition",
    description: "Food diary, calories, and macros.",
    connected: true,
    lastSync: hoursAgo(0.8),
  },
  {
    id: "strava",
    name: "Strava",
    category: "activity",
    description: "Runs, rides, and outdoor workouts.",
    connected: false,
    lastSync: null,
  },
  {
    id: "withings",
    name: "Withings",
    category: "vitals",
    description: "Weight, blood pressure, and body composition.",
    connected: false,
    lastSync: null,
  },
  {
    id: "oura",
    name: "Oura",
    category: "sleep",
    description: "Sleep score, readiness, and temperature trends.",
    connected: false,
    lastSync: null,
  },
];

function buildDays(): DayMetrics[] {
  const patterns = [
    { steps: 8200, active: 38, burn: 2100, water: 1800, sleep: 6.8, hr: 62, temp: 36.6, sed: 52 },
    { steps: 10400, active: 55, burn: 2350, water: 2200, sleep: 7.4, hr: 60, temp: 36.5, sed: 28 },
    { steps: 6100, active: 22, burn: 1950, water: 1400, sleep: 6.2, hr: 64, temp: 36.9, sed: 78 },
    { steps: 9800, active: 48, burn: 2280, water: 2500, sleep: 7.1, hr: 59, temp: 36.4, sed: 35 },
    { steps: 11200, active: 62, burn: 2480, water: 2600, sleep: 7.8, hr: 58, temp: 36.5, sed: 20 },
    { steps: 7400, active: 30, burn: 2050, water: 1600, sleep: 6.5, hr: 63, temp: 37.2, sed: 65 },
    { steps: 5600, active: 18, burn: 1880, water: 1200, sleep: 6.0, hr: 65, temp: 37.4, sed: 95 },
  ];

  return patterns.map((p, i) => {
    const daysAgo = 6 - i;
    return {
      date: isoDaysAgo(daysAgo),
      steps: p.steps,
      activeMinutes: p.active,
      caloriesBurned: p.burn,
      waterMl: p.water,
      sleepHours: p.sleep,
      restingHr: p.hr,
      temperatureC: p.temp,
      sedentaryMinutes: p.sed,
      lastMovementAt: hoursAgo(daysAgo === 0 ? 1.4 : 8),
    };
  });
}

function buildFoods(): FoodEntry[] {
  const today = isoDaysAgo(0);
  const yesterday = isoDaysAgo(1);
  return [
    {
      id: "f1",
      date: today,
      meal: "breakfast",
      name: "Greek yogurt bowl with berries",
      calories: 320,
      protein: 24,
      carbs: 38,
      fat: 8,
      source: "MyFitnessPal",
    },
    {
      id: "f2",
      date: today,
      meal: "lunch",
      name: "Grilled chicken salad",
      calories: 480,
      protein: 42,
      carbs: 22,
      fat: 24,
      source: "MyFitnessPal",
    },
    {
      id: "f3",
      date: today,
      meal: "snack",
      name: "Apple + peanut butter",
      calories: 210,
      protein: 6,
      carbs: 24,
      fat: 12,
      source: "Manual",
    },
    {
      id: "f4",
      date: yesterday,
      meal: "breakfast",
      name: "Oatmeal with almonds",
      calories: 380,
      protein: 14,
      carbs: 52,
      fat: 14,
      source: "MyFitnessPal",
    },
    {
      id: "f5",
      date: yesterday,
      meal: "lunch",
      name: "Dal, rice & vegetables",
      calories: 560,
      protein: 22,
      carbs: 78,
      fat: 16,
      source: "MyFitnessPal",
    },
    {
      id: "f6",
      date: yesterday,
      meal: "dinner",
      name: "Salmon with quinoa",
      calories: 620,
      protein: 38,
      carbs: 45,
      fat: 28,
      source: "MyFitnessPal",
    },
    {
      id: "f7",
      date: isoDaysAgo(2),
      meal: "breakfast",
      name: "Egg scramble & toast",
      calories: 410,
      protein: 26,
      carbs: 28,
      fat: 22,
      source: "MyFitnessPal",
    },
    {
      id: "f8",
      date: isoDaysAgo(2),
      meal: "dinner",
      name: "Paneer stir-fry",
      calories: 540,
      protein: 28,
      carbs: 32,
      fat: 32,
      source: "Manual",
    },
  ];
}

function buildReports(): BloodReport[] {
  return [
    {
      id: "br1",
      title: "Comprehensive Metabolic Panel",
      lab: "Thyrocare",
      collectedAt: isoDaysAgo(12),
      notes: "Fasting sample. Compare with prior panel in 8–12 weeks.",
      markers: [
        {
          name: "Fasting Glucose",
          value: 98,
          unit: "mg/dL",
          rangeMin: 70,
          rangeMax: 99,
          flag: "normal",
        },
        {
          name: "HbA1c",
          value: 5.6,
          unit: "%",
          rangeMin: 4.0,
          rangeMax: 5.6,
          flag: "normal",
        },
        {
          name: "LDL Cholesterol",
          value: 138,
          unit: "mg/dL",
          rangeMin: 0,
          rangeMax: 100,
          flag: "high",
        },
        {
          name: "HDL Cholesterol",
          value: 48,
          unit: "mg/dL",
          rangeMin: 40,
          rangeMax: 60,
          flag: "normal",
        },
        {
          name: "Triglycerides",
          value: 162,
          unit: "mg/dL",
          rangeMin: 0,
          rangeMax: 150,
          flag: "high",
        },
        {
          name: "Vitamin D",
          value: 22,
          unit: "ng/mL",
          rangeMin: 30,
          rangeMax: 100,
          flag: "low",
        },
        {
          name: "Vitamin B12",
          value: 410,
          unit: "pg/mL",
          rangeMin: 200,
          rangeMax: 900,
          flag: "normal",
        },
        {
          name: "Hemoglobin",
          value: 13.8,
          unit: "g/dL",
          rangeMin: 12.0,
          rangeMax: 16.0,
          flag: "normal",
        },
        {
          name: "TSH",
          value: 2.4,
          unit: "mIU/L",
          rangeMin: 0.4,
          rangeMax: 4.0,
          flag: "normal",
        },
      ],
    },
    {
      id: "br2",
      title: "Lipid Follow-up",
      lab: "Dr Lal PathLabs",
      collectedAt: isoDaysAgo(90),
      notes: "Baseline lipids before lifestyle changes.",
      markers: [
        {
          name: "LDL Cholesterol",
          value: 152,
          unit: "mg/dL",
          rangeMin: 0,
          rangeMax: 100,
          flag: "high",
        },
        {
          name: "HDL Cholesterol",
          value: 44,
          unit: "mg/dL",
          rangeMin: 40,
          rangeMax: 60,
          flag: "normal",
        },
        {
          name: "Triglycerides",
          value: 178,
          unit: "mg/dL",
          rangeMin: 0,
          rangeMax: 150,
          flag: "high",
        },
      ],
    },
  ];
}

export function createSeedState(): HealthState {
  return {
    profile: {
      name: "Raghav",
      goalSteps: 10000,
      goalCalories: 2200,
      goalWaterMl: 2500,
      goalProtein: 110,
      dietPreference: "mediterranean",
      autonomousNudges: true,
    },
    integrations: INTEGRATIONS,
    days: buildDays(),
    foods: buildFoods(),
    reports: buildReports(),
    nudges: [],
    lastNudgeCheck: null,
  };
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
