"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  getConnector,
  makeConnectorContext,
} from "./connectors";
import { mergeDayPatch } from "./connectors/merge";
import {
  importAppleHealthFile,
} from "./connectors/appleHealth";
import { setProviderTokens, wipeConnectorTokens, getProviderTokens } from "./connectors/tokenStore";
import type { SyncResult } from "./connectors/types";

type HealthContextValue = {
  state: HealthState;
  hydrated: boolean;
  locked: boolean;
  vaultConfigured: boolean;
  completeUnlock: () => Promise<void>;
  lockNow: () => void;
  wipeAllData: () => void;
  toggleIntegration: (id: IntegrationId) => void;
  connectIntegration: (id: IntegrationId) => Promise<string | null>;
  disconnectIntegration: (id: IntegrationId) => Promise<void>;
  syncIntegration: (id: IntegrationId) => Promise<string | null>;
  importAppleHealth: (file: File) => Promise<string | null>;
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
      accountLabel: prev.accountLabel ?? null,
      syncNote: prev.syncNote ?? null,
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
  const latest = useRef(state);
  latest.current = state;

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
    wipeConnectorTokens();
    setVaultConfigured(false);
    setLocked(true);
    setHydrated(false);
    setState(createSeedState());
  }, []);

  const applySyncResult = useCallback((result: SyncResult) => {
    setState((prev) => {
      const days = [...prev.days];
      for (const patch of result.days) {
        const idx = days.findIndex((d) => d.date === patch.date);
        const base =
          idx >= 0
            ? days[idx]
            : {
                date: patch.date,
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
        const merged = mergeDayPatch(base, patch);
        if (idx >= 0) days[idx] = merged;
        else days.push(merged);
      }
      days.sort((a, b) => a.date.localeCompare(b.date));

      const foods: HealthState["foods"] = result.foods
        ? [
            ...result.foods.map((f) => ({ ...f, id: uid("food") })),
            ...prev.foods,
          ]
        : prev.foods;

      return {
        ...prev,
        days,
        foods,
        integrations: prev.integrations.map((i) =>
          i.id === result.source
            ? {
                ...i,
                connected: true,
                lastSync: result.syncedAt,
                syncNote: result.note ?? i.syncNote ?? null,
              }
            : i
        ),
      };
    });
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
    // Optional apps keep the simple toggle; primary apps use connectIntegration.
    setState((prev) => ({
      ...prev,
      integrations: prev.integrations.map((i) =>
        i.id === id
          ? {
              ...i,
              connected: !i.connected,
              lastSync: !i.connected ? new Date().toISOString() : i.lastSync,
              accountLabel: !i.connected ? i.accountLabel : null,
              syncNote: !i.connected ? i.syncNote : null,
            }
          : i
      ),
    }));
  }, []);

  const connectIntegration = useCallback(async (id: IntegrationId) => {
    const connector = getConnector(id);
    if (!connector) {
      toggleIntegration(id);
      return null;
    }

    const snapshotHubs = {
      apple_health: Boolean(
        latest.current.integrations.find((i) => i.id === "apple_health")
          ?.connected
      ),
      google_fit: Boolean(
        latest.current.integrations.find((i) => i.id === "google_fit")?.connected
      ),
    };

    const ctx = makeConnectorContext(snapshotHubs)(id);
    const result = await connector.connect(ctx);
    if (result.redirectUrl) {
      window.location.assign(result.redirectUrl);
      return result.note ?? "Redirecting…";
    }
    if (!result.connected) {
      return result.note ?? "Could not connect";
    }

    setState((prev) => ({
      ...prev,
      integrations: prev.integrations.map((i) =>
        i.id === id
          ? {
              ...i,
              connected: true,
              lastSync: new Date().toISOString(),
              accountLabel: result.accountLabel ?? null,
              syncNote: result.note ?? null,
            }
          : i
      ),
    }));

    try {
      const sync = await connector.sync(ctx);
      applySyncResult(sync);
      return sync.note ?? result.note ?? "Connected";
    } catch {
      return result.note ?? "Connected";
    }
  }, [applySyncResult, toggleIntegration]);

  const disconnectIntegration = useCallback(async (id: IntegrationId) => {
    const connector = getConnector(id);
    if (connector) {
      const ctx = makeConnectorContext({
        apple_health: false,
        google_fit: false,
      })(id);
      await connector.disconnect(ctx);
    } else {
      setProviderTokens(id, null);
    }
    setState((prev) => ({
      ...prev,
      integrations: prev.integrations.map((i) =>
        i.id === id
          ? {
              ...i,
              connected: false,
              lastSync: null,
              accountLabel: null,
              syncNote: null,
            }
          : i
      ),
    }));
  }, []);

  const syncIntegration = useCallback(
    async (id: IntegrationId) => {
      const connector = getConnector(id);
      if (!connector) return "No live connector for this app";

      const snapshotHubs = {
        apple_health: Boolean(
          latest.current.integrations.find((i) => i.id === "apple_health")
            ?.connected
        ),
        google_fit: Boolean(
          latest.current.integrations.find((i) => i.id === "google_fit")
            ?.connected
        ),
      };

      const ctx = makeConnectorContext(snapshotHubs)(id);
      if (!ctx.getTokens()) {
        return "Connect this app first";
      }
      const result = await connector.sync(ctx);
      applySyncResult(result);
      return result.note ?? "Synced";
    },
    [applySyncResult]
  );

  const importAppleHealth = useCallback(
    async (file: File) => {
      const result = await importAppleHealthFile(file);
      setProviderTokens("apple_health", {
        mode: "import",
        connectedAt: new Date().toISOString(),
        lastImportJson: JSON.stringify(result),
      });
      applySyncResult(result);
      setState((prev) => ({
        ...prev,
        integrations: prev.integrations.map((i) =>
          i.id === "apple_health"
            ? {
                ...i,
                connected: true,
                lastSync: result.syncedAt,
                accountLabel: "Health export import",
                syncNote: result.note ?? null,
              }
            : i
        ),
      }));
      return result.note ?? "Imported";
    },
    [applySyncResult]
  );

  // After Google OAuth return, tokens land in localStorage before React remounts.
  useEffect(() => {
    if (!hydrated || locked) return;
    const tokens = getProviderTokens("google_fit");
    if (!tokens?.access_token && tokens?.mode !== "demo_live") return;
    const already = latest.current.integrations.find((i) => i.id === "google_fit");
    if (already?.connected && already.accountLabel) return;
    setState((prev) => ({
      ...prev,
      integrations: prev.integrations.map((i) =>
        i.id === "google_fit"
          ? {
              ...i,
              connected: true,
              accountLabel:
                tokens.mode === "oauth" ? "Google account" : i.accountLabel,
              lastSync: i.lastSync ?? new Date().toISOString(),
            }
          : i
      ),
    }));
  }, [hydrated, locked]);

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
      connectIntegration,
      disconnectIntegration,
      syncIntegration,
      importAppleHealth,
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
      connectIntegration,
      disconnectIntegration,
      syncIntegration,
      importAppleHealth,
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
