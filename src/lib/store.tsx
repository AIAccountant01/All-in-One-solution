"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createSeedState, todayKey } from "./seed";
import { evaluateNudges } from "./nudges";
import type {
  FoodEntry,
  HealthState,
  IntegrationId,
  MealType,
  Nudge,
  Profile,
} from "./types";

const STORAGE_KEY = "helia-health-v1";

type HealthContextValue = {
  state: HealthState;
  hydrated: boolean;
  toggleIntegration: (id: IntegrationId) => void;
  dismissNudge: (id: string) => void;
  addWater: (ml: number) => void;
  logMovement: () => void;
  addFood: (entry: Omit<FoodEntry, "id">) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  simulateTemperature: (temp: number) => void;
  resetDemo: () => void;
  activeNudges: Nudge[];
};

const HealthContext = createContext<HealthContextValue | null>(null);

function loadState(): HealthState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as HealthState;
    if (!parsed?.profile || !parsed?.days) return createSeedState();
    return parsed;
  } catch {
    return createSeedState();
  }
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function HealthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HealthState>(createSeedState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const run = () => {
      setState((prev) => {
        const fresh = evaluateNudges(prev);
        if (fresh.length === 0) {
          return { ...prev, lastNudgeCheck: new Date().toISOString() };
        }
        return {
          ...prev,
          nudges: [...fresh, ...prev.nudges].slice(0, 40),
          lastNudgeCheck: new Date().toISOString(),
        };
      });
    };

    run();
    const id = window.setInterval(run, 20000);
    return () => window.clearInterval(id);
  }, [hydrated]);

  const updateToday = useCallback(
    (mutator: (day: HealthState["days"][number]) => HealthState["days"][number]) => {
      setState((prev) => {
        const key = todayKey();
        const days = [...prev.days];
        const idx = days.findIndex((d) => d.date === key);
        if (idx >= 0) {
          days[idx] = mutator(days[idx]);
        } else {
          days.push(
            mutator({
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
            })
          );
        }
        return { ...prev, days };
      });
    },
    []
  );

  const toggleIntegration = useCallback((id: IntegrationId) => {
    setState((prev) => ({
      ...prev,
      integrations: prev.integrations.map((i) =>
        i.id === id
          ? {
              ...i,
              connected: !i.connected,
              lastSync: !i.connected ? new Date().toISOString() : i.lastSync,
            }
          : i
      ),
    }));
  }, []);

  const dismissNudge = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      nudges: prev.nudges.map((n) =>
        n.id === id ? { ...n, dismissed: true } : n
      ),
    }));
  }, []);

  const addWater = useCallback(
    (ml: number) => {
      updateToday((day) => ({ ...day, waterMl: day.waterMl + ml }));
      setState((prev) => ({
        ...prev,
        nudges: prev.nudges.map((n) =>
          n.type === "hydrate" || n.type === "temperature"
            ? { ...n, dismissed: true }
            : n
        ),
      }));
    },
    [updateToday]
  );

  const logMovement = useCallback(() => {
    updateToday((day) => ({
      ...day,
      steps: day.steps + 350,
      activeMinutes: day.activeMinutes + 5,
      sedentaryMinutes: 0,
      lastMovementAt: new Date().toISOString(),
    }));
    setState((prev) => ({
      ...prev,
      nudges: prev.nudges.map((n) =>
        n.type === "move" ? { ...n, dismissed: true } : n
      ),
    }));
  }, [updateToday]);

  const addFood = useCallback((entry: Omit<FoodEntry, "id">) => {
    setState((prev) => ({
      ...prev,
      foods: [{ ...entry, id: uid("food") }, ...prev.foods],
    }));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...patch },
    }));
  }, []);

  const simulateTemperature = useCallback((temp: number) => {
    setState((prev) => {
      const key = todayKey();
      const days = [...prev.days];
      const idx = days.findIndex((d) => d.date === key);
      const base =
        idx >= 0
          ? days[idx]
          : {
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
      const updated = { ...base, temperatureC: temp };
      if (idx >= 0) days[idx] = updated;
      else days.push(updated);

      const cleared = {
        ...prev,
        days,
        nudges: prev.nudges.map((n) =>
          n.type === "temperature" || n.type === "hydrate"
            ? { ...n, dismissed: true }
            : n
        ),
      };
      const fresh = evaluateNudges(cleared);
      return {
        ...cleared,
        nudges: [...fresh, ...cleared.nudges].slice(0, 40),
        lastNudgeCheck: new Date().toISOString(),
      };
    });
  }, []);

  const resetDemo = useCallback(() => {
    const seed = createSeedState();
    setState(seed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  }, []);

  const activeNudges = useMemo(
    () => state.nudges.filter((n) => !n.dismissed).slice(0, 8),
    [state.nudges]
  );

  const value = useMemo(
    () => ({
      state,
      hydrated,
      toggleIntegration,
      dismissNudge,
      addWater,
      logMovement,
      addFood,
      updateProfile,
      simulateTemperature,
      resetDemo,
      activeNudges,
    }),
    [
      state,
      hydrated,
      toggleIntegration,
      dismissNudge,
      addWater,
      logMovement,
      addFood,
      updateProfile,
      simulateTemperature,
      resetDemo,
      activeNudges,
    ]
  );

  return (
    <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
  );
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error("useHealth must be used within HealthProvider");
  return ctx;
}

export type { MealType };
