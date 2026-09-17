import { defineTool } from "eve/tools";
import { z } from "zod";
import { readStatus, writeStatus, type Signoff } from "../../../lib/workspace.js";

export default defineTool({
  description: "Record the User role signoff decision.",
  inputSchema: z.object({
    decision: z.enum(["approved", "rejected", "pending"]),
    note: z.string().min(1),
  }),
  async execute({ decision, note }) {
    const status = readStatus();
    status.signoffs.user = decision as Signoff;
    status.notes = `user: ${decision} — ${note}`;
    return writeStatus(status);
  },
});
