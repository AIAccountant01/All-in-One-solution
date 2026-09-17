import { defineTool } from "eve/tools";
import { z } from "zod";
import { PHASE_ORDER, readStatus, writeStatus, type Phase } from "../lib/workspace.js";

export default defineTool({
  description:
    "Advance (or set) the product-loop phase after a role completes their turn.",
  inputSchema: z.object({
    phase: z.enum([
      "awaiting_user_feedback",
      "awaiting_roadmap",
      "awaiting_implementation",
      "awaiting_qa",
      "awaiting_user_acceptance",
      "v1_approved",
    ]),
    bump_iteration: z.boolean().optional(),
    note: z.string().optional(),
  }),
  label: {
    start: ({ phase }) => `Advance phase → ${phase}`,
  },
  async execute({ phase, bump_iteration, note }) {
    const status = readStatus();
    if (!PHASE_ORDER.includes(phase as Phase)) {
      throw new Error(`Unknown phase: ${phase}`);
    }
    status.phase = phase as Phase;
    if (bump_iteration) status.loop_iteration += 1;
    if (note) status.notes = note;
    if (phase !== "v1_approved") status.gate_open = false;
    return writeStatus(status);
  },
});
