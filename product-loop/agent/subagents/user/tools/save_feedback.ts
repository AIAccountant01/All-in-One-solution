import { defineTool } from "eve/tools";
import { z } from "zod";
import { saveArtifactFile, readStatus, writeStatus } from "../../../lib/workspace.js";

export default defineTool({
  description: "Save the User feedback markdown artifact.",
  inputSchema: z.object({ content: z.string().min(1) }),
  label: { start: () => "Save user feedback" },
  async execute({ content }) {
    const path = saveArtifactFile(
      "01-user-feedback.md",
      `<!-- role: user -->\n\n${content}`
    );
    const status = readStatus();
    status.phase = "awaiting_roadmap";
    status.notes = "User feedback saved; PM roadmap next.";
    writeStatus(status);
    return { ok: true, path };
  },
});
