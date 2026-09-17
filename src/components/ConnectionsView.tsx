"use client";

import { useMemo } from "react";
import { useHealth } from "@/lib/store";
import { formatRelative } from "@/lib/nudges";
import { PRIMARY_INTEGRATION_IDS } from "@/lib/types";

const categoryLabel = {
  activity: "Activity",
  nutrition: "Nutrition",
  vitals: "Vitals",
  sleep: "Sleep",
  ring: "Smart ring",
} as const;

function IntegrationCard({
  app,
  featured,
  onToggle,
}: {
  app: ReturnType<typeof useHealth>["state"]["integrations"][number];
  featured?: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`panel flex flex-col p-5 ${
        featured ? "ring-1 ring-[rgba(15,107,92,0.28)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            {categoryLabel[app.category]}
            {featured ? " · Priority" : ""}
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
      {app.metrics && app.metrics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {app.metrics.map((m) => (
            <span
              key={m}
              className="rounded-lg bg-[var(--brand-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-deep)]"
            >
              {m}
            </span>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-[var(--muted)]">
        Last sync: {formatRelative(app.lastSync)}
      </p>
      <button
        type="button"
        onClick={onToggle}
        className={`mt-4 rounded-2xl px-4 py-2.5 text-sm font-semibold ${
          app.connected
            ? "border border-[var(--line)] bg-white/80"
            : "bg-[var(--brand)] text-white"
        }`}
      >
        {app.connected ? "Disconnect" : "Connect"}
      </button>
    </div>
  );
}

export function ConnectionsView() {
  const { state, toggleIntegration, resetDemo } = useHealth();

  const { primary, other } = useMemo(() => {
    const primarySet = new Set(PRIMARY_INTEGRATION_IDS);
    const primary = PRIMARY_INTEGRATION_IDS.map(
      (id) => state.integrations.find((i) => i.id === id)!
    ).filter(Boolean);
    const other = state.integrations.filter((i) => !primarySet.has(i.id));
    return { primary, other };
  }, [state.integrations]);

  const primaryConnected = primary.filter((p) => p.connected).length;

  return (
    <div className="space-y-5 animate-rise">
      <section className="panel p-6">
        <h3 className="display text-2xl">Your core connections</h3>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
          Helia prioritizes <strong>Gabit Ring</strong>, <strong>Ultrahuman</strong>,{" "}
          <strong>Google Fit</strong>, and <strong>Apple Health</strong> so ring vitals and phone
          activity land in one weekly brief. {primaryConnected}/4 priority sources are connected.
        </p>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Demo mode simulates OAuth/HealthKit sync. Production would use Apple HealthKit, Google
          Health Connect / Fit APIs, Ultrahuman partner OAuth, and Gabit via HealthKit/Health
          Connect (or partner API when available).
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {primary.map((app) => (
          <IntegrationCard
            key={app.id}
            app={app}
            featured
            onToggle={() => toggleIntegration(app.id)}
          />
        ))}
      </section>

      <section className="panel p-6">
        <h3 className="display text-xl">Optional apps</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Extra sources Helia can fold into the same summary when you need them.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {other.map((app) => (
          <IntegrationCard
            key={app.id}
            app={app}
            onToggle={() => toggleIntegration(app.id)}
          />
        ))}
      </section>

      <section className="panel flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h4 className="font-semibold">Reset demo data</h4>
          <p className="text-sm text-[var(--muted)]">
            Restores seed meals, labs, vitals, and priority connections.
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
