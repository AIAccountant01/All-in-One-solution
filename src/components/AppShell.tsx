"use client";

import { useEffect, useMemo, useState } from "react";
import type { Section } from "@/lib/types";
import { useHealth } from "@/lib/store";
import { TodayView } from "@/components/TodayView";
import { ActivityView } from "@/components/ActivityView";
import { NutritionView } from "@/components/NutritionView";
import { LabsView } from "@/components/LabsView";
import { WeeklyView } from "@/components/WeeklyView";
import { ConnectionsView } from "@/components/ConnectionsView";
import { AssistantView } from "@/components/AssistantView";
import { NudgeSheet } from "@/components/NudgeSheet";

const TAB_BAR: { id: Section; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "activity", label: "Move" },
  { id: "nutrition", label: "Eat" },
  { id: "weekly", label: "Week" },
  { id: "more", label: "More" },
];

const MORE_LINKS: { id: Section; label: string; hint: string }[] = [
  { id: "assistant", label: "Assistant", hint: "Diet & autonomous nudges" },
  { id: "connections", label: "Apps", hint: "Gabit, Ultrahuman, Fit, Health" },
  { id: "labs", label: "Labs", hint: "Blood reports" },
];

const ALL_SECTIONS = new Set<Section>([
  "today",
  "activity",
  "nutrition",
  "labs",
  "weekly",
  "connections",
  "assistant",
  "more",
]);

function sectionFromHash(): Section {
  if (typeof window === "undefined") return "today";
  const raw = window.location.hash.replace(/^#/, "") as Section;
  return ALL_SECTIONS.has(raw) ? raw : "today";
}

function TabIcon({ id, active }: { id: Section; active: boolean }) {
  const stroke = active ? "var(--brand)" : "var(--muted)";
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (id) {
    case "today":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      );
    case "activity":
      return (
        <svg {...common}>
          <path d="M4 14h3l2.5-6 3 10 2.5-6H20" />
        </svg>
      );
    case "nutrition":
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M7 8c0-3 2.2-5 5-5s5 2 5 5c0 4-5 6-5 10" />
        </svg>
      );
    case "weekly":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.4" fill={stroke} stroke="none" />
          <circle cx="12" cy="12" r="1.4" fill={stroke} stroke="none" />
          <circle cx="18" cy="12" r="1.4" fill={stroke} stroke="none" />
        </svg>
      );
  }
}

export function AppShell() {
  const { state, hydrated, activeNudges } = useHealth();
  const [section, setSectionState] = useState<Section>("today");
  const [nudgesOpen, setNudgesOpen] = useState(false);

  useEffect(() => {
    setSectionState(sectionFromHash());
    const onHash = () => setSectionState(sectionFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setSection = (next: Section) => {
    setSectionState(next);
    if (typeof window !== "undefined") {
      window.location.hash = next;
    }
  };

  const title = useMemo(() => {
    const map: Record<Section, string> = {
      today: "Today",
      activity: "Move",
      nutrition: "Eat",
      labs: "Labs",
      weekly: "This week",
      connections: "Apps",
      assistant: "Assistant",
      more: "More",
    };
    return map[section];
  }, [section]);

  const activeTab: Section =
    section === "labs" || section === "connections" || section === "assistant"
      ? "more"
      : section === "more"
        ? "more"
        : section;

  if (!hydrated) {
    return (
      <div className="mobile-stage">
        <div className="phone-shell grid place-items-center">
          <div className="text-center animate-pulse-ring px-8">
            <p className="display text-4xl brand-shimmer">Helia</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Opening your health app…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-stage">
      <div className="phone-shell">
        <div className="phone-notch" aria-hidden />

        <header className="app-topbar">
          <div>
            <p className="display text-[1.65rem] leading-none brand-shimmer">Helia</p>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              Hi {state.profile.name} · mobile health OS
            </p>
          </div>
          <button
            type="button"
            className="nudge-pill"
            onClick={() => setNudgesOpen(true)}
            aria-label="Open live nudges"
          >
            <span className="nudge-dot" />
            {activeNudges.length}
          </button>
        </header>

        <div className="app-scroll scroll-thin">
          <div className="px-4 pb-3 pt-1">
            <h1 className="display text-[1.85rem]">{title}</h1>
            {state.profile.autonomousNudges && (
              <p className="mt-0.5 text-xs font-medium text-[var(--brand)]">
                Autonomous mode on
              </p>
            )}
          </div>

          <div className="space-y-4 px-4 pb-6">
            {section === "today" && <TodayView onNavigate={setSection} />}
            {section === "activity" && <ActivityView />}
            {section === "nutrition" && <NutritionView />}
            {section === "labs" && <LabsView />}
            {section === "weekly" && <WeeklyView />}
            {section === "connections" && <ConnectionsView />}
            {section === "assistant" && <AssistantView />}
            {section === "more" && (
              <div className="space-y-3 animate-rise">
                {MORE_LINKS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className="panel flex w-full items-center justify-between px-4 py-4 text-left"
                  >
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-xs text-[var(--muted)]">{item.hint}</p>
                    </div>
                    <span className="text-[var(--brand)]">→</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setNudgesOpen(true)}
                  className="panel flex w-full items-center justify-between px-4 py-4 text-left"
                >
                  <div>
                    <p className="font-semibold">Live nudges</p>
                    <p className="text-xs text-[var(--muted)]">
                      {activeNudges.length} active alerts
                    </p>
                  </div>
                  <span className="rounded-lg bg-[var(--brand-soft)] px-2 py-1 text-xs font-bold text-[var(--brand-deep)]">
                    {activeNudges.length}
                  </span>
                </button>
              </div>
            )}

            <p className="px-1 pb-2 text-center text-[10px] leading-relaxed text-[var(--muted)]">
              Helia is a wellness app, not a medical device. Confirm labs with a clinician.
            </p>
          </div>
        </div>

        <nav className="tab-bar" aria-label="Primary">
          {TAB_BAR.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSection(tab.id)}
                className={`tab-item ${active ? "tab-item-active" : ""}`}
              >
                <TabIcon id={tab.id} active={active} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <NudgeSheet open={nudgesOpen} onClose={() => setNudgesOpen(false)} />
      </div>
    </div>
  );
}
