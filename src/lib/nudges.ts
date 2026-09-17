import type { DayMetrics, FoodEntry, HealthState, Nudge, Profile } from "./types";
import { todayKey } from "./seed";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getToday(state: HealthState): DayMetrics {
  const key = todayKey();
  const found = state.days.find((d) => d.date === key);
  if (found) return found;
  return {
    date: key,
    steps: 0,
    activeMinutes: 0,
    caloriesBurned: 0,
    waterMl: 0,
    sleepHours: 0,
    restingHr: 60,
    temperatureC: 36.6,
    sedentaryMinutes: 0,
    lastMovementAt: new Date().toISOString(),
  };
}

export function caloriesForDate(foods: FoodEntry[], date: string): number {
  return foods
    .filter((f) => f.date === date)
    .reduce((sum, f) => sum + f.calories, 0);
}

export function macrosForDate(foods: FoodEntry[], date: string) {
  return foods
    .filter((f) => f.date === date)
    .reduce(
      (acc, f) => ({
        protein: acc.protein + f.protein,
        carbs: acc.carbs + f.carbs,
        fat: acc.fat + f.fat,
        calories: acc.calories + f.calories,
      }),
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );
}

export function evaluateNudges(state: HealthState, now = new Date()): Nudge[] {
  if (!state.profile.autonomousNudges) return [];

  const today = getToday(state);
  const macros = macrosForDate(state.foods, today.date);
  const existingTypes = new Set(
    state.nudges.filter((n) => !n.dismissed).map((n) => n.type)
  );
  const next: Nudge[] = [];

  const sedentaryMs = now.getTime() - new Date(today.lastMovementAt).getTime();
  const sedentaryMin = Math.max(
    today.sedentaryMinutes,
    Math.floor(sedentaryMs / 60000)
  );

  if (today.temperatureC >= 37.2 && today.waterMl < state.profile.goalWaterMl * 0.7) {
    if (!existingTypes.has("temperature") && !existingTypes.has("hydrate")) {
      next.push({
        id: uid("nudge"),
        type: "temperature",
        title: "Body temperature is elevated",
        body: `You're at ${today.temperatureC.toFixed(1)}°C with only ${today.waterMl} ml logged. Drink a full glass of water now and ease activity until you cool down.`,
        priority: "urgent",
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }
  } else if (today.temperatureC <= 36.2 && today.waterMl < 800) {
    if (!existingTypes.has("temperature")) {
      next.push({
        id: uid("nudge"),
        type: "temperature",
        title: "Temperature running low",
        body: `Reading ${today.temperatureC.toFixed(1)}°C. Warm up with light movement, a warm drink, and check you're not undereating today.`,
        priority: "action",
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }
  }

  if (sedentaryMin >= 45 && !existingTypes.has("move")) {
    next.push({
      id: uid("nudge"),
      type: "move",
      title: "You've been still for a while",
      body: `About ${sedentaryMin} minutes without meaningful movement. Take a 5-minute walk or stretch break — your weekly step goal needs this.`,
      priority: sedentaryMin >= 75 ? "urgent" : "action",
      createdAt: now.toISOString(),
      dismissed: false,
    });
  }

  const hour = now.getHours();
  const expectedWater =
    state.profile.goalWaterMl * Math.min(1, Math.max(0.15, (hour - 7) / 14));
  if (
    hour >= 10 &&
    today.waterMl < expectedWater * 0.65 &&
    !existingTypes.has("hydrate") &&
    !next.some((n) => n.type === "temperature")
  ) {
    next.push({
      id: uid("nudge"),
      type: "hydrate",
      title: "Hydration is behind schedule",
      body: `You've logged ${today.waterMl} ml; by this time of day aim nearer ${Math.round(expectedWater)} ml. Sip 250 ml in the next 10 minutes.`,
      priority: "action",
      createdAt: now.toISOString(),
      dismissed: false,
    });
  }

  if (
    hour >= 15 &&
    macros.protein < state.profile.goalProtein * 0.45 &&
    !existingTypes.has("nutrition")
  ) {
    next.push({
      id: uid("nudge"),
      type: "nutrition",
      title: "Protein intake is lagging",
      body: `Only ${macros.protein}g protein so far vs ${state.profile.goalProtein}g goal. Add eggs, dal, paneer, yogurt, or lean meat at your next meal.`,
      priority: "info",
      createdAt: now.toISOString(),
      dismissed: false,
    });
  }

  const latest = state.reports[0];
  if (latest && !existingTypes.has("labs")) {
    const flagged = latest.markers.filter((m) => m.flag !== "normal");
    if (flagged.length > 0 && hour === 9) {
      next.push({
        id: uid("nudge"),
        type: "labs",
        title: "Lab markers need lifestyle attention",
        body: `${flagged.map((m) => m.name).join(", ")} are outside range on your latest report. Your diet plan already targets these — stay consistent this week.`,
        priority: "info",
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }
  }

  if (today.sleepHours > 0 && today.sleepHours < 6.5 && hour < 11 && !existingTypes.has("rest")) {
    next.push({
      id: uid("nudge"),
      type: "rest",
      title: "Short sleep last night",
      body: `You got ${today.sleepHours.toFixed(1)}h. Keep caffeine earlier, protect an earlier wind-down, and avoid stacking hard workouts today.`,
      priority: "info",
      createdAt: now.toISOString(),
      dismissed: false,
    });
  }

  return next;
}

export function progressPct(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function defaultFood(
  profile: Profile
): Omit<FoodEntry, "id"> {
  return {
    date: todayKey(),
    meal: "snack",
    name: "",
    calories: 150,
    protein: 8,
    carbs: 15,
    fat: 6,
    source: "Manual",
  };
}
