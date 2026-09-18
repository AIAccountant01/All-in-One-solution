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
import {
  isVaultConfigured,
  isVaultUnlocked,
  loadEncryptedState,
  lockVault,
  saveEncryptedState,
  touchVaultActivity,
  wipeVault,
} from "./vault";

type HealthContextValue = {
  state: HealthState;
  hydrated: boolean;
  locked: boolean;
  vaultConfigured: boolean;
  completeUnlock: () => Promise<void>;
  lockNow: () => void;
  wipeAllData: () => void;
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

function mergeIntegrations(saved: HealthState): HealthState {
  const seed = createSeedState();
  const byId = new Map(saved.integrations?.map((i) => [i.id, i]));
  const integrations = seed.integrations.map((fresh) => {
    const prev = byId.get(fresh.id);
    if (!prev) return fresh;
    return {
      ...fresh,
      connected: prev.connected,
      lastSync: prev.connected
        ? prev.lastSync ?? fresh.lastSync
        : prev.lastSync,
    };
  });
  return { ...saved, integrations };
}

function normalizeState(parsed: HealthState | null): HealthState {
  if (!parsed?.profile || !parsed?.days) return createSeedState();
  return mergeIntegrations(parsed);
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function HealthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HealthState>(createSeedState);
  const [hydrated, setHydrated] = useState(false);
  const [locked, setLocked] = useState(true);
  const [vaultConfigured, setVaultConfigured] = useState(false);

  useEffect(() => {
    const configured = isVaultConfigured();
    setVaultConfigured(configured);
    if (configured && isVaultUnlocked()) {
      void (async () => {
        try {
          const data = await loadEncryptedState<HealthState>();
          setState(normalizeState(data));
          setLocked(false);
          setHydrated(true);
        } catch {
          lockVault();
          setLocked(true);
          setHydrated(false);
        }
      })();
    }
  }, []);

  useEffect(() => {
    const onLocked = () => {
      setLocked(true);
      setHydrated(false);
      setState(createSeedState());
    };
    window.addEventListener("helia:vault-locked", onLocked);
    return () => window.removeEventListener("helia:vault-locked", onLocked);
  }, []);

  useEffect(() => {
    if (!hydrated || locked) return;
    const bump = () => touchVaultActivity();
    window.addEventListener("pointerdown", bump);
    window.addEventListener("keydown", bump);
    window.addEventListener("touchstart", bump);
    return () => {
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("touchstart", bump);
    };
  }, [hydrated, locked]);

  useEffect(() => {
    if (!hydrated || locked || !isVaultUnlocked()) return;
    void saveEncryptedState(state).catch(() => {
      /* vault may have locked mid-write */
    });
  }, [state, hydrated, locked]);

  useEffect(() => {
    if (!hydrated || locked) return;

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
  }, [hydrated, locked]);

  const completeUnlock = useCallback(async () => {
    const data = await loadEncryptedState<HealthState>();
    setState(normalizeState(data));
    setVaultConfigured(true);
    setLocked(false);
    setHydrated(true);
  }, []);

  const lockNow = useCallback(() => {
    lockVault();
    setLocked(true);
    setHydrated(false);
    setState(createSeedState());
    window.dispatchEvent(new CustomEvent("helia:vault-locked"));
  }, []);

  const wipeAllData = useCallback(() => {
    wipeVault();
    setVaultConfigured(false);
    setLocked(true);
    setHydrated(false);
    setState(createSeedState());
  }, []);

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
    if (isVaultUnlocked()) {
      void saveEncryptedState(seed);
    }
  }, []);

  const activeNudges = useMemo(
    () => state.nudges.filter((n) => !n.dismissed).slice(0, 8),
    [state.nudges]
  );

  const value = useMemo(
    () => ({
      state,
      hydrated,
      locked,
      vaultConfigured,
      completeUnlock,
      lockNow,
      wipeAllData,
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
      locked,
      vaultConfigured,
      completeUnlock,
      lockNow,
      wipeAllData,
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
