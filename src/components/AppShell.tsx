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
import { NudgeRail } from "@/components/NudgeRail";

const NAV: { id: Section; label: string; hint: string }[] = [
  { id: "today", label: "Today", hint: "Overview" },
  { id: "activity", label: "Activity", hint: "Steps & movement" },
  { id: "nutrition", label: "Nutrition", hint: "Food & calories" },
  { id: "labs", label: "Labs", hint: "Blood reports" },
  { id: "weekly", label: "Weekly", hint: "Summary" },
  { id: "connections", label: "Apps", hint: "Integrations" },
  { id: "assistant", label: "Assistant", hint: "Diet & nudges" },
];

const SECTION_IDS = new Set(NAV.map((n) => n.id));

function sectionFromHash(): Section {
  if (typeof window === "undefined") return "today";
  const raw = window.location.hash.replace(/^#/, "") as Section;
  return SECTION_IDS.has(raw) ? raw : "today";
}

export function AppShell() {
  const { state, hydrated, activeNudges } = useHealth();
  const [section, setSectionState] = useState<Section>("today");
  const [menuOpen, setMenuOpen] = useState(false);

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

  const connectedCount = useMemo(
    () => state.integrations.filter((i) => i.connected).length,
    [state.integrations]
  );

  if (!hydrated) {
    return (
      <div className="min-h-screen grid place-items-center p-8">
        <div className="panel px-8 py-6 text-center animate-pulse-ring">
          <p className="display text-3xl brand-shimmer">Helia</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Waking your health assistant…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4 md:px-6 md:py-6">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-[var(--line)] bg-[rgba(243,246,244,0.96)] p-5 backdrop-blur-xl transition md:static md:translate-x-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="panel flex h-full flex-col p-5 md:sticky md:top-6 md:h-[calc(100vh-3rem)]">
            <div className="mb-8">
              <p className="display text-4xl brand-shimmer">Helia</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Your autonomous health assistant
              </p>
            </div>

            <nav className="flex flex-1 flex-col gap-1">
              {NAV.map((item) => {
                const active = section === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-2xl px-3 py-3 text-left transition ${
                      active
                        ? "bg-[var(--brand)] text-white shadow-lg shadow-[rgba(15,107,92,0.25)]"
                        : "hover:bg-[var(--brand-soft)]"
                    }`}
                  >
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div
                      className={`text-xs ${
                        active ? "text-white/75" : "text-[var(--muted)]"
                      }`}
                    >
                      {item.hint}
                    </div>
                  </a>
                );
              })}
            </nav>

            <div className="mt-4 rounded-2xl bg-[var(--brand-soft)] p-4 text-sm">
              <p className="font-semibold text-[var(--brand-deep)]">
                Hi, {state.profile.name}
              </p>
              <p className="mt-1 text-[var(--ink-soft)]">
                {connectedCount} apps connected · {activeNudges.length} live nudges
              </p>
            </div>
          </div>
        </aside>

        {menuOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1 pb-10">
          <header className="mb-5 flex items-center justify-between gap-3 animate-rise">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="panel rounded-xl px-3 py-2 text-sm font-semibold md:hidden"
                onClick={() => setMenuOpen(true)}
              >
                Menu
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Personal health OS
                </p>
                <h1 className="display text-3xl md:text-4xl">
                  {NAV.find((n) => n.id === section)?.label}
                </h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-full bg-[var(--ok-soft)] px-3 py-1 text-xs font-semibold text-[var(--ok)]">
                Autonomous mode {state.profile.autonomousNudges ? "on" : "off"}
              </span>
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-5">
              {section === "today" && <TodayView onNavigate={setSection} />}
              {section === "activity" && <ActivityView />}
              {section === "nutrition" && <NutritionView />}
              {section === "labs" && <LabsView />}
              {section === "weekly" && <WeeklyView />}
              {section === "connections" && <ConnectionsView />}
              {section === "assistant" && <AssistantView />}
            </div>
            <NudgeRail />
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-[var(--muted)]">
            Helia is a wellness assistant, not a medical device. Blood-report insights are for
            education and lifestyle planning — always confirm with a clinician before changing
            treatment.
          </p>
        </main>
      </div>
    </div>
  );
}
