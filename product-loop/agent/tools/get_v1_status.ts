import { defineTool } from "eve/tools";
import { z } from "zod";
import { listArtifactFiles, readStatus, ensureWorkspace } from "../lib/workspace.js";

export default defineTool({
  description: "Read current V1 loop phase, signoffs, and whether the app-creation gate is open.",
  inputSchema: z.object({}),
  label: { start: () => "Check V1 status" },
  async execute() {
    ensureWorkspace();
    return readStatus();
  },
});
