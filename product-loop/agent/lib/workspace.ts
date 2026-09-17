import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const WORKSPACE = join(process.cwd(), "workspace");
export const ARTIFACTS = join(WORKSPACE, "artifacts");
export const STATUS_PATH = join(WORKSPACE, "v1-status.json");

export type Role = "user" | "product_manager" | "coder" | "qa";
export type Phase =
  | "awaiting_user_feedback"
  | "awaiting_roadmap"
  | "awaiting_implementation"
  | "awaiting_qa"
  | "awaiting_user_acceptance"
  | "v1_approved";

export type Signoff = "pending" | "approved" | "rejected";

export type V1Status = {
  product: string;
  version: string;
  phase: Phase;
  loop_iteration: number;
  signoffs: Record<Role, Signoff>;
  gate_open: boolean;
  last_updated: string;
  notes: string;
};

export const PHASE_ORDER: Phase[] = [
  "awaiting_user_feedback",
  "awaiting_roadmap",
  "awaiting_implementation",
  "awaiting_qa",
  "awaiting_user_acceptance",
  "v1_approved",
];

export function ensureWorkspace() {
  mkdirSync(ARTIFACTS, { recursive: true });
  if (!existsSync(STATUS_PATH)) {
    const initial: V1Status = {
      product: "Helia",
      version: "1.0",
      phase: "awaiting_user_feedback",
      loop_iteration: 1,
      signoffs: {
        user: "pending",
        product_manager: "pending",
        coder: "pending",
        qa: "pending",
      },
      gate_open: false,
      last_updated: new Date().toISOString(),
      notes: "Loop not started. Collect user feedback first.",
    };
    writeFileSync(STATUS_PATH, JSON.stringify(initial, null, 2));
  }
}

export function readStatus(): V1Status {
  ensureWorkspace();
  return JSON.parse(readFileSync(STATUS_PATH, "utf8")) as V1Status;
}

export function writeStatus(status: V1Status) {
  ensureWorkspace();
  status.last_updated = new Date().toISOString();
  status.gate_open =
    status.signoffs.user === "approved" &&
    status.signoffs.product_manager === "approved" &&
    status.signoffs.coder === "approved" &&
    status.signoffs.qa === "approved";
  if (status.gate_open) status.phase = "v1_approved";
  writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
  return status;
}

export function listArtifactFiles() {
  ensureWorkspace();
  return readdirSync(ARTIFACTS)
    .filter((f) => !f.startsWith("."))
    .sort()
    .map((name) => {
      const path = join(ARTIFACTS, name);
      const body = readFileSync(path, "utf8");
      return { name, path, preview: body.slice(0, 240) };
    });
}

export function saveArtifactFile(name: string, content: string) {
  ensureWorkspace();
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = join(ARTIFACTS, safe);
  writeFileSync(path, content);
  return path;
}
