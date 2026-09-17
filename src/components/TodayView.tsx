"use client";

import { useHealth } from "@/lib/store";
import { getToday, macrosForDate, progressPct } from "@/lib/nudges";
import { buildDietRecommendations } from "@/lib/dietitian";
import type { Section } from "@/lib/types";

function Ring({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, value);
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <svg width="76" height="76" className="-rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(18,32,28,0.08)" strokeWidth="8" />
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="8"
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
      <div className="-mt-12 text-center">
        <div className="text-sm font-bold">{pct}%</div>
      </div>
      <div className="mt-6 text-[10px] font-medium text-[var(--muted)]">{label}</div>
    </div>
  );
}

export function TodayView({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const { state, addWater, logMovement } = useHealth();
  const today = getToday(state);
  const macros = macrosForDate(state.foods, today.date);
  const rec = buildDietRecommendations(state)[0];
  const priority = ["gabit", "ultrahuman", "google_fit", "apple_health"] as const;
  const syncSources = priority
    .map((id) => state.integrations.find((i) => i.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <section className="panel relative overflow-hidden p-5 animate-rise">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[rgba(26,165,140,0.18)] blur-2xl" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Your day
        </p>
        <h2 className="display mt-1 text-[1.75rem] leading-tight">
          Health in one glance
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Gabit, Ultrahuman, Google Fit &amp; Apple Health — plus nudges when you should drink or move.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {syncSources.map((src) => (
            <button
              key={src!.id}
              type="button"
              onClick={() => onNavigate("connections")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                src!.connected
                  ? "bg-[var(--ok-soft)] text-[var(--ok)]"
                  : "bg-white/70 text-[var(--muted)]"
              }`}
            >
              {src!.name.split(" ")[0]}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => addWater(250)}
            className="rounded-2xl bg-[var(--brand)] px-3 py-3 text-sm font-semibold text-white"
          >
            +250 ml water
          </button>
          <button
            type="button"
            onClick={logMovement}
            className="rounded-2xl bg-[var(--accent-soft)] px-3 py-3 text-sm font-semibold text-[var(--accent)]"
          >
            I just moved
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 animate-rise-delay-1">
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
          <div key={kpi.label} className="panel p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
              {kpi.label}
            </p>
            <p className="display mt-1 text-2xl">{kpi.value}</p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">{kpi.meta}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3 animate-rise-delay-2">
        <div className="panel p-5">
          <h3 className="display text-xl">Today&apos;s progress</h3>
          <p className="text-xs text-[var(--muted)]">Goals vs live signals</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
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
          <div className="mt-4 space-y-2">
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

        <div className="panel p-5">
          <h3 className="display text-xl">Dietitian pick</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{rec?.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">{rec?.reason}</p>
          <ul className="mt-3 space-y-2">
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
            className="mt-4 text-sm font-semibold text-[var(--brand)]"
          >
            See full recommendations →
          </button>
        </div>
      </section>
    </div>
  );
}
