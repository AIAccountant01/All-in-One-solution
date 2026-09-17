"use client";

import { useMemo } from "react";
import { useHealth } from "@/lib/store";
import { buildWeeklyInsight } from "@/lib/dietitian";

export function WeeklyView() {
  const { state } = useHealth();
  const insight = useMemo(() => buildWeeklyInsight(state), [state]);

  return (
    <div className="space-y-5 animate-rise">
      <section className="panel overflow-hidden p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
          Weekly brief
        </p>
        <h3 className="display mt-2 text-4xl leading-tight">{insight.headline}</h3>
        <p className="mt-4 max-w-3xl text-[var(--ink-soft)]">{insight.summary}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Avg steps", insight.avgSteps.toLocaleString()],
            ["Avg kcal in", String(insight.avgCaloriesIn)],
            ["Avg kcal out", String(insight.avgCaloriesOut)],
            ["Water adherence", `${insight.waterAdherence}%`],
            ["Movement score", `${insight.movementScore}/100`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{k}</p>
              <p className="display mt-1 text-2xl">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-6">
          <h4 className="display text-xl">Wins</h4>
          <ul className="mt-3 space-y-2">
            {insight.wins.map((w) => (
              <li key={w} className="rounded-xl bg-[var(--ok-soft)] px-3 py-2 text-sm text-[var(--ok)]">
                {w}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-6">
          <h4 className="display text-xl">Watchouts</h4>
          <ul className="mt-3 space-y-2">
            {insight.watchouts.map((w) => (
              <li
                key={w}
                className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]"
              >
                {w}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-6">
          <h4 className="display text-xl">Next week focus</h4>
          <ul className="mt-3 space-y-2">
            {insight.nextWeekFocus.map((w) => (
              <li
                key={w}
                className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 text-sm text-[var(--brand-deep)]"
              >
                {w}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
