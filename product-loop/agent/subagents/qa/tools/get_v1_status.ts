import { defineTool } from "eve/tools";
import { z } from "zod";
import { listArtifactFiles, readStatus, writeStatus, type Signoff } from "../../../lib/workspace.js";

export default defineTool({
  description: "Get artifacts and V1 status for QA.",
  inputSchema: z.object({}),
  async execute() {
    return { artifacts: listArtifactFiles(), status: readStatus() };
  },
});
