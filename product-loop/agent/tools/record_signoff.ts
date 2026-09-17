import { defineTool } from "eve/tools";
import { z } from "zod";
import { readStatus, writeStatus, type Role } from "../lib/workspace.js";

export default defineTool({
  description:
    "Record a role's V1 signoff (approved / rejected / pending) with a short note.",
  inputSchema: z.object({
    role: z.enum(["user", "product_manager", "coder", "qa"]),
    decision: z.enum(["approved", "rejected", "pending"]),
    note: z.string().min(1),
  }),
  label: {
    start: ({ role, decision }) => `Signoff ${role}: ${decision}`,
  },
  async execute({ role, decision, note }) {
    const status = readStatus();
    status.signoffs[role as Role] = decision;
    status.notes = `${role}: ${decision} — ${note}`;
    if (decision === "rejected") {
      status.gate_open = false;
      if (role === "user" || role === "qa") {
        status.phase =
          role === "user" ? "awaiting_roadmap" : "awaiting_implementation";
      }
    }
    const next = writeStatus(status);
    return next;
  },
});
