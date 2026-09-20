"use client";

import { useMemo, useRef, useState } from "react";
import { useHealth } from "@/lib/store";
import { formatRelative } from "@/lib/nudges";
import { PRIMARY_INTEGRATION_IDS, type IntegrationId } from "@/lib/types";
import { getConnector } from "@/lib/connectors";

const categoryLabel = {
  activity: "Activity",
  nutrition: "Nutrition",
  vitals: "Vitals",
  sleep: "Sleep",
  ring: "Smart ring",
} as const;

function authModeLabel(id: IntegrationId) {
  const c = getConnector(id);
  if (!c) return "Toggle";
  switch (c.authMode) {
    case "oauth":
      return "Google OAuth";
    case "health_import":
      return "Health export";
    case "hub_bridge":
      return "Via Health hub";
    default:
      return "Manual";
  }
}

export function ConnectionsView() {
  const {
    state,
    toggleIntegration,
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
    importAppleHealth,
    resetDemo,
  } = useHealth();
  const [busyId, setBusyId] = useState<IntegrationId | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { primary, other } = useMemo(() => {
    const primarySet = new Set(PRIMARY_INTEGRATION_IDS);
    const primary = PRIMARY_INTEGRATION_IDS.map(
      (id) => state.integrations.find((i) => i.id === id)!
    ).filter(Boolean);
    const other = state.integrations.filter((i) => !primarySet.has(i.id));
    return { primary, other };
  }, [state.integrations]);

  const primaryConnected = primary.filter((p) => p.connected).length;
  const hubsReady =
    primary.find((p) => p.id === "apple_health")?.connected ||
    primary.find((p) => p.id === "google_fit")?.connected;

  async function onConnect(id: IntegrationId) {
    setBusyId(id);
    setBanner(null);
    try {
      const note = await connectIntegration(id);
      if (note) setBanner(note);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onDisconnect(id: IntegrationId) {
    setBusyId(id);
    setBanner(null);
    try {
      await disconnectIntegration(id);
      setBanner("Disconnected");
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onSync(id: IntegrationId) {
    setBusyId(id);
    setBanner(null);
    try {
      const note = await syncIntegration(id);
      if (note) setBanner(note);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onImportFile(file: File | undefined) {
    if (!file) return;
    setBusyId("apple_health");
    setBanner(null);
    try {
      const note = await importAppleHealth(file);
      if (note) setBanner(note);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusyId(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-5 animate-rise">
      <section className="panel p-6">
        <h3 className="display text-2xl">Connect your apps</h3>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
          Start with <strong>Google Fit</strong> or <strong>Apple Health</strong>, then link{" "}
          <strong>Gabit</strong> and <strong>Ultrahuman</strong> through those hubs.{" "}
          {primaryConnected}/4 priority sources connected.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-[var(--muted)]">
          <li>Connect Google Fit (OAuth) and/or import an Apple Health export</li>
          <li>Connect Gabit & Ultrahuman so ring vitals flow via the hubs</li>
          <li>Tap Sync to refresh Today&apos;s steps, sleep, and vitals</li>
        </ol>
      </section>

      {banner && (
        <p className="rounded-2xl bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand-deep)]">
          {banner}
        </p>
      )}

      <section className="grid gap-3">
        {primary.map((app) => {
          const connector = getConnector(app.id);
          const busy = busyId === app.id;
          const isRing = app.id === "gabit" || app.id === "ultrahuman";
          const ringBlocked = isRing && !hubsReady && !app.connected;

          return (
            <div
              key={app.id}
              className="panel flex flex-col p-5 ring-1 ring-[rgba(15,107,92,0.28)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    {categoryLabel[app.category]} · {authModeLabel(app.id)}
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
              <p className="mt-3 text-sm text-[var(--ink-soft)]">{app.description}</p>
              {connector && (
                <p className="mt-2 text-xs text-[var(--muted)]">{connector.connectHint}</p>
              )}
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
                {app.accountLabel ? ` · ${app.accountLabel}` : ""}
              </p>
              {app.syncNote && (
                <p className="mt-1 text-xs text-[var(--brand)]">{app.syncNote}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {!app.connected ? (
                  <button
                    type="button"
                    disabled={busy || ringBlocked}
                    onClick={() => onConnect(app.id)}
                    className="rounded-2xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busy ? "Working…" : ringBlocked ? "Connect a hub first" : "Connect"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onSync(app.id)}
                      className="rounded-2xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {busy ? "Syncing…" : "Sync now"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDisconnect(app.id)}
                      className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </>
                )}
                {app.id === "apple_health" && (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".zip,.xml,application/zip,text/xml"
                      className="hidden"
                      onChange={(e) => onImportFile(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => fileRef.current?.click()}
                      className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                    >
                      Import export
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className="panel p-6">
        <h3 className="display text-xl">Optional apps</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Extra sources Helia can fold into the same summary (toggle for now).
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {other.map((app) => (
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
            Restores seed meals, labs, and vitals. Does not wipe your PIN vault.
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
