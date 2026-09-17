import { defineTool } from "eve/tools";
import { z } from "zod";
import { listArtifactFiles } from "../lib/workspace.js";

export default defineTool({
  description: "List product-loop artifacts (feedback, roadmap, build notes, QA reports).",
  inputSchema: z.object({}),
  label: { start: () => "List artifacts" },
  async execute() {
    return { artifacts: listArtifactFiles() };
  },
});
