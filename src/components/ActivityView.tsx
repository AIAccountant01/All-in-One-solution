"use client";

import { useMemo } from "react";
import { useHealth } from "@/lib/store";
import { getToday, progressPct } from "@/lib/nudges";

export function ActivityView() {
  const { state, logMovement } = useHealth();
  const today = getToday(state);
  const days = useMemo(
    () => [...state.days].sort((a, b) => a.date.localeCompare(b.date)).slice(-7),
    [state.days]
  );
  const maxSteps = Math.max(...days.map((d) => d.steps), 1);

  return (
    <div className="space-y-5 animate-rise">
      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="display text-2xl">Step & movement trail</h3>
            <p className="text-sm text-[var(--muted)]">
              Synced from Apple Health, Fitbit, and Oura when connected
            </p>
          </div>
          <button
            type="button"
            onClick={logMovement}
            className="rounded-2xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Log a short walk (+350)
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[var(--brand-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--brand-deep)]">Today</p>
            <p className="display mt-1 text-3xl">{today.steps.toLocaleString()}</p>
            <div className="progress-track mt-3">
              <div
                className="progress-fill"
                style={{ width: `${progressPct(today.steps, state.profile.goalSteps)}%` }}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              Active minutes
            </p>
            <p className="display mt-1 text-3xl">{today.activeMinutes}</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              Calories burned
            </p>
            <p className="display mt-1 text-3xl">{today.caloriesBurned}</p>
          </div>
        </div>

        <div className="mt-8 flex h-52 items-end gap-2">
          {days.map((d) => {
            const h = Math.max(18, Math.round((d.steps / maxSteps) * 180));
            const label = d.date.slice(5);
            const isToday = d.date === today.date;
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-2">
                <div
                  className={`w-full rounded-t-xl transition-all duration-700 ${
                    isToday
                      ? "bg-[linear-gradient(180deg,#1aa58c,#0a4a40)]"
                      : "bg-[rgba(15,107,92,0.28)]"
                  }`}
                  style={{ height: `${h}px` }}
                  title={`${d.steps} steps`}
                />
                <span className="text-[10px] text-[var(--muted)]">{label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel p-6">
        <h3 className="display text-2xl">Sedentary watch</h3>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Helia watches stillness and nudges you when movement drops. Last movement:{" "}
          <strong>{new Date(today.lastMovementAt).toLocaleTimeString()}</strong>
        </p>
        <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white/60 p-4 text-sm">
          Current sedentary estimate:{" "}
          <span className="font-semibold">{today.sedentaryMinutes} minutes</span>. Threshold for
          an autonomous &quot;move&quot; nudge is 45 minutes.
        </div>
      </section>
    </div>
  );
}
