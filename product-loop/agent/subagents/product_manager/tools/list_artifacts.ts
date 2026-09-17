import { defineTool } from "eve/tools";
import { z } from "zod";
import { listArtifactFiles, readStatus, writeStatus, type Signoff } from "../../../lib/workspace.js";

export default defineTool({
  description: "List artifacts and current V1 status.",
  inputSchema: z.object({}),
  async execute() {
    return { artifacts: listArtifactFiles(), status: readStatus() };
  },
});
