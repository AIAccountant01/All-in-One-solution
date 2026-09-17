import { defineTool } from "eve/tools";
import { z } from "zod";
import { listArtifactFiles, readStatus } from "../../../lib/workspace.js";

export default defineTool({
  description: "List product-loop artifacts.",
  inputSchema: z.object({}),
  async execute() {
    return { artifacts: listArtifactFiles(), status: readStatus() };
  },
});
