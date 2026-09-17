import { defineTool } from "eve/tools";
import { z } from "zod";
import { saveArtifactFile, readStatus, writeStatus } from "../../../lib/workspace.js";

export default defineTool({
  description: "Save the PM V1 roadmap markdown artifact.",
  inputSchema: z.object({ content: z.string().min(1) }),
  label: { start: () => "Save roadmap" },
  async execute({ content }) {
    const path = saveArtifactFile(
      "02-roadmap.md",
      `<!-- role: product_manager -->\n\n${content}`
    );
    const status = readStatus();
    status.phase = "awaiting_implementation";
    status.signoffs.product_manager = "approved";
    status.notes = "Roadmap ready; Coder implementation next.";
    writeStatus(status);
    return { ok: true, path };
  },
});
