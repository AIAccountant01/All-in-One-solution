"use client";

import { useHealth } from "@/lib/store";
import { getToday, macrosForDate, progressPct } from "@/lib/nudges";
import { buildDietRecommendations } from "@/lib/dietitian";
import type { Section } from "@/lib/types";

function Ring({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, value);
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(18,32,28,0.08)" strokeWidth="10" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0a4a40" />
            <stop offset="100%" stopColor="#1aa58c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="-mt-16 text-center">
        <div className="text-lg font-bold">{pct}%</div>
      </div>
      <div className="mt-8 text-xs font-medium text-[var(--muted)]">{label}</div>
    </div>
  );
}

export function TodayView({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const { state, addWater, logMovement } = useHealth();
  const today = getToday(state);
  const macros = macrosForDate(state.foods, today.date);
  const rec = buildDietRecommendations(state)[0];

  return (
    <div className="space-y-5">
      <section className="panel relative overflow-hidden p-6 md:p-8 animate-rise">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[rgba(26,165,140,0.18)] blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[rgba(217,119,6,0.12)] blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
          Helia
        </p>
        <h2 className="display mt-2 max-w-2xl text-4xl leading-tight md:text-5xl">
          All your health signals, one clear picture.
        </h2>
        <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
          Steps, meals, labs, and connected apps flow into weekly insights — plus autonomous
          nudges when you should drink, move, or ease off.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => addWater(250)}
            className="rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
          >
            Log 250 ml water
          </button>
          <button
            type="button"
            onClick={logMovement}
            className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm font-semibold text-[var(--accent)]"
          >
            I just moved
          </button>
          <button
            type="button"
            onClick={() => onNavigate("weekly")}
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm font-semibold"
          >
            Open weekly summary
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-rise-delay-1">
        {[
          {
            label: "Steps",
            value: today.steps.toLocaleString(),
            meta: `${progressPct(today.steps, state.profile.goalSteps)}% of goal`,
          },
          {
            label: "Calories in",
            value: `${macros.calories}`,
            meta: `Goal ${state.profile.goalCalories}`,
          },
          {
            label: "Water",
            value: `${today.waterMl} ml`,
            meta: `Goal ${state.profile.goalWaterMl} ml`,
          },
          {
            label: "Temperature",
            value: `${today.temperatureC.toFixed(1)}°C`,
            meta: today.temperatureC >= 37.2 ? "Elevated — hydrate" : "In typical range",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="panel p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              {kpi.label}
            </p>
            <p className="display mt-2 text-3xl">{kpi.value}</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{kpi.meta}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] animate-rise-delay-2">
        <div className="panel p-6">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h3 className="display text-2xl">Today&apos;s progress</h3>
              <p className="text-sm text-[var(--muted)]">Goals vs live signals</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-around gap-4">
            <Ring value={progressPct(today.steps, state.profile.goalSteps)} label="Steps" />
            <Ring
              value={progressPct(macros.calories, state.profile.goalCalories)}
              label="Calories"
            />
            <Ring
              value={progressPct(today.waterMl, state.profile.goalWaterMl)}
              label="Hydration"
            />
            <Ring
              value={progressPct(macros.protein, state.profile.goalProtein)}
              label="Protein"
            />
          </div>
          <div className="mt-6 space-y-3">
            {[
              ["Active minutes", `${today.activeMinutes} min`],
              ["Sleep last night", `${today.sleepHours.toFixed(1)} h`],
              ["Resting HR", `${today.restingHr} bpm`],
              ["Sedentary streak", `${today.sedentaryMinutes} min`],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 text-sm"
              >
                <span className="text-[var(--muted)]">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <h3 className="display text-2xl">Dietitian pick</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{rec?.title}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ink-soft)]">{rec?.reason}</p>
          <ul className="mt-4 space-y-2">
            {rec?.meals.slice(0, 3).map((m) => (
              <li
                key={m}
                className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 text-sm text-[var(--brand-deep)]"
              >
                {m}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onNavigate("assistant")}
            className="mt-5 text-sm font-semibold text-[var(--brand)]"
          >
            See full recommendations →
          </button>
        </div>
      </section>
    </div>
  );
}
