"use client";

import { useHealth } from "@/lib/store";
import { formatRelative } from "@/lib/nudges";

const categoryLabel = {
  activity: "Activity",
  nutrition: "Nutrition",
  vitals: "Vitals",
  sleep: "Sleep",
} as const;

export function ConnectionsView() {
  const { state, toggleIntegration, resetDemo } = useHealth();

  return (
    <div className="space-y-5 animate-rise">
      <section className="panel p-6">
        <h3 className="display text-2xl">Connected health apps</h3>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
          Helia is built to unify Apple Health, Google Fit, Fitbit, Garmin, MyFitnessPal, Strava,
          Withings, and Oura. This demo uses realistic sync states — toggle connections to see how
          your assistant surface changes.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {state.integrations.map((app) => (
          <div key={app.id} className="panel flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {categoryLabel[app.category]}
                </p>
                <h4 className="display mt-1 text-2xl">{app.name}</h4>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                  app.connected
                    ? "bg-[var(--ok-soft)] text-[var(--ok)]"
                    : "bg-[rgba(18,32,28,0.06)] text-[var(--muted)]"
                }`}
              >
                {app.connected ? "Connected" : "Off"}
              </span>
            </div>
            <p className="mt-3 flex-1 text-sm text-[var(--ink-soft)]">{app.description}</p>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Last sync: {formatRelative(app.lastSync)}
            </p>
            <button
              type="button"
              onClick={() => toggleIntegration(app.id)}
              className={`mt-4 rounded-2xl px-4 py-2.5 text-sm font-semibold ${
                app.connected
                  ? "border border-[var(--line)] bg-white/80"
                  : "bg-[var(--brand)] text-white"
              }`}
            >
              {app.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </section>

      <section className="panel flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h4 className="font-semibold">Reset demo data</h4>
          <p className="text-sm text-[var(--muted)]">
            Restores seed meals, labs, and vitals for a clean walkthrough.
          </p>
        </div>
        <button
          type="button"
          onClick={resetDemo}
          className="rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold"
        >
          Reset
        </button>
      </section>
    </div>
  );
}
