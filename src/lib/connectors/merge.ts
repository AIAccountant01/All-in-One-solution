import type { SyncDayPatch } from "./types";

export function todayIso(): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/** Prefer higher activity / later vitals when merging connector patches into a day. */
export function mergeDayPatch(
  base: {
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
  },
  patch: SyncDayPatch
) {
  return {
    ...base,
    date: patch.date,
    steps: Math.max(base.steps, patch.steps ?? 0),
    activeMinutes: Math.max(base.activeMinutes, patch.activeMinutes ?? 0),
    caloriesBurned: Math.max(base.caloriesBurned, patch.caloriesBurned ?? 0),
    waterMl: Math.max(base.waterMl, patch.waterMl ?? 0),
    sleepHours:
      patch.sleepHours != null && patch.sleepHours > 0
        ? patch.sleepHours
        : base.sleepHours,
    restingHr:
      patch.restingHr != null && patch.restingHr > 0
        ? patch.restingHr
        : base.restingHr,
    temperatureC:
      patch.temperatureC != null && patch.temperatureC > 0
        ? patch.temperatureC
        : base.temperatureC,
    sedentaryMinutes:
      patch.sedentaryMinutes != null
        ? Math.min(base.sedentaryMinutes, patch.sedentaryMinutes)
        : base.sedentaryMinutes,
    lastMovementAt: patch.lastMovementAt ?? base.lastMovementAt,
  };
}

/** Deterministic demo live-sync when OAuth credentials are not configured. */
export function demoLiveSyncDays(sourceLabel: string): SyncDayPatch[] {
  const date = todayIso();
  const seed =
    [...sourceLabel].reduce((a, c) => a + c.charCodeAt(0), 0) +
    date.split("-").reduce((a, p) => a + Number(p), 0);
  const steps = 4500 + (seed % 5200);
  return [
    {
      date,
      steps,
      activeMinutes: 18 + (seed % 40),
      caloriesBurned: 1800 + (seed % 700),
      sleepHours: 6.2 + ((seed % 20) / 10),
      restingHr: 58 + (seed % 12),
      temperatureC: 36.4 + ((seed % 8) / 10),
      sedentaryMinutes: 30 + (seed % 90),
      lastMovementAt: new Date().toISOString(),
    },
  ];
}
