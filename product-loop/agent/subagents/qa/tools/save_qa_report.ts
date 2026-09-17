import { defineTool } from "eve/tools";
import { z } from "zod";
import { saveArtifactFile, readStatus, writeStatus } from "../../../lib/workspace.js";

export default defineTool({
  description: "Save the QA report for the current iteration.",
  inputSchema: z.object({
    content: z.string().min(1),
    passed: z.boolean(),
  }),
  label: { start: ({ passed }) => (passed ? "Save QA pass" : "Save QA fail") },
  async execute({ content, passed }) {
    const status = readStatus();
    const name = `04-qa-report-iter-${status.loop_iteration}.md`;
    const path = saveArtifactFile(name, `<!-- role: qa -->\n\n${content}`);
    status.signoffs.qa = passed ? "approved" : "rejected";
    status.phase = passed ? "awaiting_user_acceptance" : "awaiting_implementation";
    status.notes = passed
      ? "QA approved; awaiting User acceptance."
      : "QA rejected; return to Coder.";
    writeStatus(status);
    return { ok: true, path, status: readStatus() };
  },
});
