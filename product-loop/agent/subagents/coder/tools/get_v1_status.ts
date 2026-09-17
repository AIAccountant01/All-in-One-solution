import { defineTool } from "eve/tools";
import { z } from "zod";
import { listArtifactFiles, readStatus, writeStatus, type Signoff } from "../../../lib/workspace.js";

export default defineTool({
  description: "Get V1 status and artifacts before coding.",
  inputSchema: z.object({}),
  async execute() {
    return { artifacts: listArtifactFiles(), status: readStatus() };
  },
});
