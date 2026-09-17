import { defineTool } from "eve/tools";
import { z } from "zod";
import { saveArtifactFile } from "../lib/workspace.js";

export default defineTool({
  description:
    "Save a markdown/text artifact from a role (e.g. 01-user-feedback.md, 02-roadmap.md).",
  inputSchema: z.object({
    filename: z
      .string()
      .min(1)
      .describe("Filename only, e.g. 01-user-feedback.md"),
    content: z.string().min(1),
    role: z.enum(["user", "product_manager", "coder", "qa", "orchestrator"]),
  }),
  label: {
    start: ({ filename, role }) => `Save ${filename} (${role})`,
  },
  async execute({ filename, content, role }) {
    const stamped = `<!-- role: ${role} | saved: ${new Date().toISOString()} -->\n\n${content}`;
    const path = saveArtifactFile(filename, stamped);
    return { ok: true, path };
  },
});
