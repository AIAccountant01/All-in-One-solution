import type {
  BloodReport,
  DietRecommendation,
  FoodEntry,
  HealthState,
  Profile,
  WeeklyInsight,
} from "./types";
import { caloriesForDate, getToday, macrosForDate } from "./nudges";

export function buildDietRecommendations(state: HealthState): DietRecommendation[] {
  const profile = state.profile;
  const today = getToday(state);
  const macros = macrosForDate(state.foods, today.date);
  const latest = state.reports[0];
  const recs: DietRecommendation[] = [];

  const highLdl = latest?.markers.find(
    (m) => m.name.toLowerCase().includes("ldl") && m.flag === "high"
  );
  const lowVitD = latest?.markers.find(
    (m) => m.name.toLowerCase().includes("vitamin d") && m.flag === "low"
  );
  const highTg = latest?.markers.find(
    (m) => m.name.toLowerCase().includes("trigly") && m.flag === "high"
  );

  if (highLdl || highTg) {
    recs.push({
      id: "diet_lipids",
      title: "Heart-forward plate pattern",
      reason:
        "Your latest lipids show elevated LDL/triglycerides. A Mediterranean-style pattern is the strongest lifestyle lever before medications.",
      meals: [
        "Breakfast: oats + walnuts + berries",
        "Lunch: chickpea salad with olive oil & greens",
        "Dinner: grilled fish or tofu, quinoa, steamed vegetables",
        "Snack: handful of almonds or roasted chana",
      ],
      focus: [
        "Swap refined carbs for whole grains",
        "Use olive oil / mustard oil instead of deep frying",
        "Aim 2+ fish or flax servings this week",
      ],
    });
  }

  if (lowVitD) {
    recs.push({
      id: "diet_vitd",
      title: "Vitamin D support foods",
      reason:
        "Vitamin D is below range. Food alone rarely fixes deficiency — pair sunlight, fortified foods, and clinician-guided supplementation.",
      meals: [
        "Fortified milk or plant milk with breakfast",
        "Egg yolks 3–4×/week",
        "Fatty fish (salmon/sardines) twice this week",
        "Mushrooms sautéed in sunlight-exposed batch if available",
      ],
      focus: [
        "10–15 min midday outdoor light when possible",
        "Ask your clinician about repletion dosing",
        "Recheck levels after the planned course",
      ],
    });
  }

  if (macros.protein < profile.goalProtein * 0.5) {
    recs.push({
      id: "diet_protein",
      title: "Raise protein without excess calories",
      reason: `You're at ${macros.protein}g protein today vs a ${profile.goalProtein}g target. Spreading protein across meals improves satiety and recovery.`,
      meals: [
        "Add Greek yogurt or paneer to breakfast",
        "Dal + curd at lunch",
        "Chicken, fish, tofu, or eggs at dinner",
        "Protein snack: buttermilk, roasted chana, or whey if used",
      ],
      focus: [
        `Target ~${Math.round(profile.goalProtein / 3)}g protein per main meal`,
        "Keep snacks purposeful, not grazing",
      ],
    });
  }

  if (profile.dietPreference === "plant_forward") {
    recs.push({
      id: "diet_plant",
      title: "Plant-forward day plan",
      reason: "Matched to your preference while covering iron, B12 awareness, and complete proteins.",
      meals: [
        "Moong chilla with mint chutney",
        "Buddha bowl: brown rice, beans, greens, tahini",
        "Tofu stir-fry with mixed vegetables",
        "Fruit + handful of seeds",
      ],
      focus: ["Combine legumes + grains", "Include B12-fortified foods or discuss supplements"],
    });
  } else if (profile.dietPreference === "high_protein") {
    recs.push({
      id: "diet_hp",
      title: "High-protein recovery day",
      reason: "Supports training days and step goals without cutting produce.",
      meals: [
        "Egg white omelette + whole-grain toast",
        "Chicken/fish bowl with vegetables",
        "Cottage cheese / paneer salad",
        "Protein smoothie with berries",
      ],
      focus: ["Vegetables on every plate", "Hydrate more on higher protein days"],
    });
  } else {
    recs.push({
      id: "diet_balanced",
      title: "Balanced Mediterranean day",
      reason: "Default Helia plan for energy, lipids, and sustainable adherence.",
      meals: [
        "Yogurt parfait with fruit & seeds",
        "Lentil soup + side salad",
        "Baked fish or grilled paneer, veggies, olive oil",
        "Fruit or dark chocolate square (small)",
      ],
      focus: ["Half plate vegetables", "Limit sugary drinks", "Finish kitchen 2–3h before sleep"],
    });
  }

  if (today.temperatureC >= 37.2) {
    recs.push({
      id: "diet_heat",
      title: "Cooling hydration menu",
      reason: "Elevated temperature — prioritize fluids and easy-to-digest meals.",
      meals: [
        "ORS or lemon water with a pinch of salt",
        "Light khichdi or broth-based soup",
        "Cucumber, watermelon, or buttermilk",
        "Avoid heavy fried meals until temperature settles",
      ],
      focus: ["Small frequent sips", "Rest and reassess if fever persists"],
    });
  }

  return recs.slice(0, 4);
}

export function buildWeeklyInsight(state: HealthState): WeeklyInsight {
  const days = [...state.days].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  const avg = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

  const avgSteps = avg(days.map((d) => d.steps));
  const avgCaloriesOut = avg(days.map((d) => d.caloriesBurned));
  const avgCaloriesIn = avg(
    days.map((d) => caloriesForDate(state.foods, d.date) || state.profile.goalCalories * 0.85)
  );
  const waterAdherence = avg(
    days.map((d) =>
      Math.min(100, Math.round((d.waterMl / state.profile.goalWaterMl) * 100))
    )
  );
  const movementScore = avg(
    days.map((d) =>
      Math.min(
        100,
        Math.round((d.steps / state.profile.goalSteps) * 70 + (d.activeMinutes / 45) * 30)
      )
    )
  );

  const wins: string[] = [];
  const watchouts: string[] = [];
  const nextWeekFocus: string[] = [];

  if (avgSteps >= state.profile.goalSteps * 0.85) {
    wins.push(`Averaged ${avgSteps.toLocaleString()} steps/day — close to your ${state.profile.goalSteps.toLocaleString()} goal.`);
  } else {
    watchouts.push(`Steps averaged ${avgSteps.toLocaleString()}; short weekday walks would close the gap.`);
    nextWeekFocus.push("Schedule two 20-minute walks after lunch");
  }

  if (waterAdherence >= 80) {
    wins.push(`Hydration adherence around ${waterAdherence}% of goal.`);
  } else {
    watchouts.push(`Hydration only ~${waterAdherence}% of goal — link water to each meal.`);
    nextWeekFocus.push("Keep a 500 ml bottle at your desk and finish 5 refills");
  }

  const sleepy = days.filter((d) => d.sleepHours > 0 && d.sleepHours < 6.5).length;
  if (sleepy >= 2) {
    watchouts.push(`${sleepy} nights under 6.5h sleep this week.`);
    nextWeekFocus.push("Set a fixed lights-out alarm 30 min earlier");
  } else {
    wins.push("Sleep mostly stayed in a workable range.");
  }

  if (movementScore >= 70) {
    wins.push(`Movement score ${movementScore}/100 — activity habit is taking shape.`);
  }

  wins.push("Connected apps kept steps, sleep, and food in one Helia summary.");

  const latest = state.reports[0];
  if (latest) {
    const flags = latest.markers.filter((m) => m.flag !== "normal");
    if (flags.length) {
      watchouts.push(
        `Open lab flags: ${flags.map((m) => m.name).join(", ")}. Diet plan is tuned for these.`
      );
      nextWeekFocus.push("Stay consistent with heart-forward meals for lipids / Vit D support");
    }
  }

  const hotDays = days.filter((d) => d.temperatureC >= 37.2).length;
  if (hotDays) {
    watchouts.push(`${hotDays} day(s) with elevated temperature — hydrate and rest when that repeats.`);
  }

  const headline =
    movementScore >= 75
      ? "Solid week — refine recovery & labs"
      : movementScore >= 55
        ? "Mixed week — consistency will unlock the summary you want"
        : "Reset week — start with water, steps, and protein";

  const summary = `Across the last 7 days you averaged ${avgSteps.toLocaleString()} steps, ~${avgCaloriesIn} kcal in and ~${avgCaloriesOut} kcal out, with ${waterAdherence}% water-goal adherence and a movement score of ${movementScore}/100. Helia used your connected apps, food log, and blood report to shape next week's focus.`;

  if (nextWeekFocus.length === 0) {
    nextWeekFocus.push("Maintain current habits and re-check lipids in your next panel");
  }

  return {
    headline,
    summary,
    wins: wins.slice(0, 4),
    watchouts: watchouts.slice(0, 4),
    nextWeekFocus: nextWeekFocus.slice(0, 4),
    avgSteps,
    avgCaloriesIn,
    avgCaloriesOut,
    waterAdherence,
    movementScore,
  };
}

export function labTrendNote(reports: BloodReport[]): string {
  if (reports.length < 2) return "Add another panel later to unlock trend comparisons.";
  const [latest, prev] = reports;
  const ldlNow = latest.markers.find((m) => m.name.toLowerCase().includes("ldl"));
  const ldlPrev = prev.markers.find((m) => m.name.toLowerCase().includes("ldl"));
  if (ldlNow && ldlPrev) {
    const delta = ldlNow.value - ldlPrev.value;
    if (delta < 0) {
      return `LDL improved by ${Math.abs(delta)} ${ldlNow.unit} since your previous report.`;
    }
    if (delta > 0) {
      return `LDL rose by ${delta} ${ldlNow.unit} vs prior panel — keep the lipid-focused meal plan.`;
    }
  }
  return "Markers compared across your two most recent reports.";
}

export function suggestDinner(profile: Profile, foods: FoodEntry[]): string {
  const today = foods.filter((f) => f.date === new Date().toISOString().slice(0, 10));
  const protein = today.reduce((s, f) => s + f.protein, 0);
  if (protein < profile.goalProtein * 0.6) {
    return "Dinner idea: grilled fish or paneer tikka with a large salad and olive oil.";
  }
  return "Dinner idea: vegetable khichdi with curd, or a light Mediterranean bowl.";
}
