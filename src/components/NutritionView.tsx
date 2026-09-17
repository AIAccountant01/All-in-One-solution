"use client";

import { useState } from "react";
import { useHealth } from "@/lib/store";
import { getToday, macrosForDate, progressPct } from "@/lib/nudges";
import { todayKey } from "@/lib/seed";
import type { MealType } from "@/lib/types";

export function NutritionView() {
  const { state, addFood } = useHealth();
  const today = getToday(state);
  const macros = macrosForDate(state.foods, today.date);
  const todaysFoods = state.foods.filter((f) => f.date === today.date);

  const [name, setName] = useState("");
  const [meal, setMeal] = useState<MealType>("snack");
  const [calories, setCalories] = useState(200);
  const [protein, setProtein] = useState(10);

  return (
    <div className="space-y-5 animate-rise">
      <section className="panel p-6">
        <h3 className="display text-2xl">Calories & macros</h3>
        <p className="text-sm text-[var(--muted)]">
          Pulled from MyFitnessPal when connected, plus anything you log here
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          {[
            ["Calories", macros.calories, state.profile.goalCalories, "kcal"],
            ["Protein", macros.protein, state.profile.goalProtein, "g"],
            ["Carbs", macros.carbs, 220, "g"],
            ["Fat", macros.fat, 70, "g"],
          ].map(([label, value, goal, unit]) => (
            <div key={String(label)} className="rounded-2xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                {label}
              </p>
              <p className="display mt-1 text-3xl">
                {value}
                <span className="ml-1 text-base text-[var(--muted)]">{unit}</span>
              </p>
              <div className="progress-track mt-3">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progressPct(Number(value), Number(goal))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-6">
          <h3 className="display text-2xl">Log a meal</h3>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              addFood({
                date: todayKey(),
                meal,
                name: name.trim(),
                calories,
                protein,
                carbs: Math.round(calories * 0.45 / 4),
                fat: Math.round(calories * 0.3 / 9),
                source: "Manual",
              });
              setName("");
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What did you eat?"
              className="w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 outline-none focus:border-[var(--brand)]"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={meal}
                onChange={(e) => setMeal(e.target.value as MealType)}
                className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
                aria-label="Calories"
              />
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
                aria-label="Protein"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-2xl bg-[var(--brand)] py-3 text-sm font-semibold text-white"
            >
              Add to today
            </button>
          </form>
        </div>

        <div className="panel p-6">
          <h3 className="display text-2xl">Today&apos;s food</h3>
          <div className="mt-4 max-h-80 space-y-2 overflow-auto scroll-thin">
            {todaysFoods.length === 0 && (
              <p className="text-sm text-[var(--muted)]">No meals logged yet.</p>
            )}
            {todaysFoods.map((f) => (
              <div
                key={f.id}
                className="flex items-start justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{f.name}</p>
                  <p className="text-xs capitalize text-[var(--muted)]">
                    {f.meal} · {f.source}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{f.calories} kcal</p>
                  <p className="text-[var(--muted)]">{f.protein}g protein</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
