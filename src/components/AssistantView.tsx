"use client";

import { useMemo } from "react";
import { useHealth } from "@/lib/store";
import { buildDietRecommendations, suggestDinner } from "@/lib/dietitian";
import { getToday } from "@/lib/nudges";
import type { Profile } from "@/lib/types";

export function AssistantView() {
  const { state, updateProfile, simulateTemperature, addWater, logMovement } = useHealth();
  const recs = useMemo(() => buildDietRecommendations(state), [state]);
  const today = getToday(state);
  const dinner = suggestDinner(state.profile, state.foods);

  return (
    <div className="space-y-5 animate-rise">
      <section className="panel p-6">
        <h3 className="display text-2xl">Autonomous assistant</h3>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Helia watches temperature, stillness, hydration, protein, sleep, and labs — then
          interrupts gently when action helps. No waiting for you to open a dashboard.
        </p>

        <label className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-[var(--brand-soft)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--brand-deep)]">
            Autonomous nudges
          </span>
          <input
            type="checkbox"
            checked={state.profile.autonomousNudges}
            onChange={(e) => updateProfile({ autonomousNudges: e.target.checked })}
            className="h-5 w-5 accent-[var(--brand)]"
          />
        </label>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => simulateTemperature(37.5)}
            className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-left text-sm font-semibold text-[var(--danger)]"
          >
            Simulate high temperature → water nudge
          </button>
          <button
            type="button"
            onClick={() => simulateTemperature(36.0)}
            className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-left text-sm font-semibold text-[var(--accent)]"
          >
            Simulate low temperature
          </button>
          <button
            type="button"
            onClick={logMovement}
            className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-left text-sm font-semibold"
          >
            Clear move nudge (I moved)
          </button>
          <button
            type="button"
            onClick={() => addWater(300)}
            className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-left text-sm font-semibold"
          >
            Drink water (+300 ml)
          </button>
        </div>

        <p className="mt-4 text-xs text-[var(--muted)]">
          Current temp {today.temperatureC.toFixed(1)}°C · sedentary ~{today.sedentaryMinutes} min
          · water {today.waterMl} ml
        </p>
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="display text-2xl">Dietitian recommendations</h3>
            <p className="text-sm text-[var(--muted)]">
              Tuned to labs, today&apos;s macros, and your preference
            </p>
          </div>
          <select
            value={state.profile.dietPreference}
            onChange={(e) =>
              updateProfile({
                dietPreference: e.target.value as Profile["dietPreference"],
              })
            }
            className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
          >
            <option value="mediterranean">Mediterranean</option>
            <option value="balanced">Balanced</option>
            <option value="high_protein">High protein</option>
            <option value="plant_forward">Plant forward</option>
          </select>
        </div>

        <p className="mt-4 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
          {dinner}
        </p>

        <div className="mt-5 space-y-4">
          {recs.map((rec) => (
            <article key={rec.id} className="rounded-2xl border border-[var(--line)] bg-white/70 p-5">
              <h4 className="display text-xl">{rec.title}</h4>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">{rec.reason}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Meals
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {rec.meals.map((m) => (
                      <li key={m}>• {m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Focus
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {rec.focus.map((m) => (
                      <li key={m}>• {m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
