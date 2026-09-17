import { defineTool } from "eve/tools";
import { z } from "zod";
import { saveArtifactFile, readStatus, writeStatus } from "../../../lib/workspace.js";

export default defineTool({
  description: "Save Coder build notes for the current slice.",
  inputSchema: z.object({ content: z.string().min(1) }),
  label: { start: () => "Save build note" },
  async execute({ content }) {
    const status = readStatus();
    const name = `03-build-notes-iter-${status.loop_iteration}.md`;
    const path = saveArtifactFile(name, `<!-- role: coder -->\n\n${content}`);
    status.phase = "awaiting_qa";
    status.signoffs.coder = "approved";
    status.notes = "Build notes saved; QA next.";
    writeStatus(status);
    return { ok: true, path };
  },
});
