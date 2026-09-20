import type {
  ConnectorContext,
  ConnectResult,
  HealthConnector,
  SyncDayPatch,
  SyncResult,
} from "./types";
import { todayIso } from "./merge";

function parseHealthExportXml(xml: string): SyncDayPatch[] {
  const byDate = new Map<string, SyncDayPatch>();

  const ensure = (date: string): SyncDayPatch => {
    let row = byDate.get(date);
    if (!row) {
      row = { date, steps: 0, activeMinutes: 0, caloriesBurned: 0 };
      byDate.set(date, row);
    }
    return row;
  };

  const recordRe =
    /<Record\b([^>]*?)\/>|<Record\b([^>]*)>([\s\S]*?)<\/Record>/g;
  let m: RegExpExecArray | null;
  while ((m = recordRe.exec(xml))) {
    const attrs = m[1] || m[2] || "";
    const typeMatch = attrs.match(/\btype="([^"]+)"/);
    const valueMatch = attrs.match(/\bvalue="([^"]+)"/);
    const startMatch =
      attrs.match(/\bstartDate="([^"]+)"/) || attrs.match(/\bendDate="([^"]+)"/);
    if (!typeMatch || !valueMatch || !startMatch) continue;
    const type = typeMatch[1];
    const value = Number(valueMatch[1]);
    if (!Number.isFinite(value)) continue;
    const date = new Date(startMatch[1]).toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const row = ensure(date);

    if (type.includes("StepCount")) {
      row.steps = (row.steps ?? 0) + value;
    } else if (type.includes("ActiveEnergyBurned") || type.includes("BasalEnergyBurned")) {
      row.caloriesBurned = (row.caloriesBurned ?? 0) + value;
    } else if (type.includes("AppleExerciseTime") || type.includes("ExerciseTime")) {
      row.activeMinutes = (row.activeMinutes ?? 0) + value;
    } else if (type.includes("HeartRate") && !type.includes("Variability")) {
      row.restingHr = value;
    } else if (type.includes("BodyTemperature") || type.includes("AppleSleepingWristTemperature")) {
      // Health exports often use °C already on modern phones; clamp wild Fahrenheit-looking values
      row.temperatureC = value > 45 ? ((value - 32) * 5) / 9 : value;
    } else if (type.includes("SleepAnalysis")) {
      // duration from start/end if present
      const endMatch = attrs.match(/\bendDate="([^"]+)"/);
      if (endMatch) {
        const hours =
          (new Date(endMatch[1]).getTime() - new Date(startMatch[1]).getTime()) /
          3600000;
        if (hours > 0 && hours < 16) {
          row.sleepHours = (row.sleepHours ?? 0) + hours;
        }
      }
    }
  }

  return [...byDate.values()]
    .map((d) => ({
      ...d,
      steps: Math.round(d.steps ?? 0),
      caloriesBurned: Math.round(d.caloriesBurned ?? 0),
      activeMinutes: Math.round(d.activeMinutes ?? 0),
      sleepHours: d.sleepHours ? Math.round(d.sleepHours * 10) / 10 : undefined,
      lastMovementAt: new Date().toISOString(),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);
}

async function readFileAsText(file: File): Promise<string> {
  if (file.name.endsWith(".zip") || file.type.includes("zip")) {
    const buf = await file.arrayBuffer();
    const { unzipSync, strFromU8 } = await import("fflate");
    const unzipped = unzipSync(new Uint8Array(buf));
    const entry =
      Object.keys(unzipped).find((k) => k.endsWith("export.xml")) ||
      Object.keys(unzipped).find((k) => k.endsWith(".xml"));
    if (!entry) throw new Error("No export.xml found inside the zip");
    return strFromU8(unzipped[entry]);
  }
  return file.text();
}

/** Called from UI after user picks an Apple Health export file. */
export async function importAppleHealthFile(file: File): Promise<SyncResult> {
  const xml = await readFileAsText(file);
  if (!xml.includes("<HealthData") && !xml.includes("<Record")) {
    throw new Error("That file does not look like an Apple Health export");
  }
  const days = parseHealthExportXml(xml);
  if (days.length === 0) {
    throw new Error("No step/heart/sleep records found in the export");
  }
  return {
    source: "apple_health",
    syncedAt: new Date().toISOString(),
    days,
    note: `Imported ${days.length} day(s) from Apple Health export`,
  };
}

export const appleHealthConnector: HealthConnector = {
  id: "apple_health",
  authMode: "health_import",
  label: "Apple Health",
  connectHint:
    "On iPhone: Health → profile → Export All Health Data, then import the zip here. Native HealthKit arrives with the App Store wrapper.",

  async connect(ctx: ConnectorContext): Promise<ConnectResult> {
    ctx.setTokens({
      mode: "import",
      connectedAt: new Date().toISOString(),
    });
    return {
      connected: true,
      accountLabel: "Health export import",
      note: "Connected. Use Import export to load Health data, or Sync after an import.",
    };
  },

  async disconnect(ctx) {
    ctx.setTokens(null);
  },

  async sync(ctx): Promise<SyncResult> {
    const tokens = ctx.getTokens();
    if (!tokens) throw new Error("Apple Health is not connected");
    if (tokens.lastImportJson) {
      return JSON.parse(tokens.lastImportJson) as SyncResult;
    }
    // Lightweight keep-alive sync when connected but no file yet
    return {
      source: "apple_health",
      syncedAt: new Date().toISOString(),
      days: [
        {
          date: todayIso(),
          lastMovementAt: new Date().toISOString(),
        },
      ],
      note: "Connected — import an Apple Health export to fill steps, heart, and sleep.",
    };
  },
};
