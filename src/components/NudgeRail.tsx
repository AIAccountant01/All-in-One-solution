"use client";

import { useHealth } from "@/lib/store";
import { formatRelative } from "@/lib/nudges";

const priorityStyle = {
  info: "border-[rgba(18,32,28,0.08)] bg-white/80",
  action: "border-[rgba(217,119,6,0.25)] bg-[var(--accent-soft)]",
  urgent: "border-[rgba(180,35,24,0.25)] bg-[var(--danger-soft)]",
} as const;

const typeLabel: Record<string, string> = {
  hydrate: "Hydrate",
  move: "Move",
  temperature: "Temp",
  nutrition: "Fuel",
  labs: "Labs",
  rest: "Rest",
};

export function NudgeRail() {
  const { activeNudges, dismissNudge, addWater, logMovement } = useHealth();

  return (
    <aside className="space-y-4 animate-rise-delay-2 xl:sticky xl:top-6 xl:self-start">
      <div className="panel p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Live nudges
            </p>
            <h3 className="display text-2xl">Acting for you</h3>
          </div>
          <span className="animate-pulse-ring grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand-deep)]">
            {activeNudges.length}
          </span>
        </div>

        <div className="mt-4 max-h-[70vh] space-y-3 overflow-auto scroll-thin pr-1">
          {activeNudges.length === 0 && (
            <p className="rounded-2xl bg-white/70 px-4 py-5 text-sm text-[var(--muted)]">
              No urgent nudges right now. Helia keeps watching temperature, stillness, water, and
              protein in the background.
            </p>
          )}

          {activeNudges.map((nudge) => (
            <article
              key={nudge.id}
              className={`rounded-2xl border p-4 ${priorityStyle[nudge.priority]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">
                  <span className="mr-2 rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    {typeLabel[nudge.type] ?? "Note"}
                  </span>
                  {nudge.title}
                </p>
                <button
                  type="button"
                  onClick={() => dismissNudge(nudge.id)}
                  className="text-xs font-semibold text-[var(--muted)]"
                >
                  Dismiss
                </button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{nudge.body}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                {formatRelative(nudge.createdAt)} · {nudge.priority}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(nudge.type === "hydrate" || nudge.type === "temperature") && (
                  <button
                    type="button"
                    onClick={() => addWater(250)}
                    className="rounded-xl bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Drink 250 ml
                  </button>
                )}
                {nudge.type === "move" && (
                  <button
                    type="button"
                    onClick={logMovement}
                    className="rounded-xl bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Mark moved
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </aside>
  );
}
