"use client";

import { useHealth } from "@/lib/store";
import { labTrendNote } from "@/lib/dietitian";

const flagStyle = {
  normal: "bg-[var(--ok-soft)] text-[var(--ok)]",
  low: "bg-[var(--accent-soft)] text-[var(--accent)]",
  high: "bg-[var(--danger-soft)] text-[var(--danger)]",
} as const;

export function LabsView() {
  const { state } = useHealth();
  const [latest, ...rest] = state.reports;

  return (
    <div className="space-y-5 animate-rise">
      <section className="panel p-6">
        <h3 className="display text-2xl">Blood reports</h3>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Upload-ready structure with demo panels. Helia flags out-of-range markers for lifestyle
          planning only — this is <strong>not medical advice or a diagnosis</strong>. Confirm with a
          clinician before changing treatment.
        </p>
        <p className="mt-4 rounded-2xl bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand-deep)]">
          {labTrendNote(state.reports)}
        </p>
      </section>

      {latest && (
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="display text-2xl">{latest.title}</h3>
              <p className="text-sm text-[var(--muted)]">
                {latest.lab} · collected {latest.collectedAt}
              </p>
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">
              Latest
            </span>
          </div>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">{latest.notes}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {latest.markers.map((m) => (
              <div key={m.name} className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{m.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${flagStyle[m.flag]}`}
                  >
                    {m.flag}
                  </span>
                </div>
                <p className="display mt-2 text-3xl">
                  {m.value}
                  <span className="ml-1 text-sm text-[var(--muted)]">{m.unit}</span>
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Ref {m.rangeMin}–{m.rangeMax} {m.unit}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {rest.map((report) => (
        <section key={report.id} className="panel p-6">
          <h3 className="display text-xl">{report.title}</h3>
          <p className="text-sm text-[var(--muted)]">
            {report.lab} · {report.collectedAt}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {report.markers.map((m) => (
              <span
                key={m.name}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${flagStyle[m.flag]}`}
              >
                {m.name}: {m.value}
              </span>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
