import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Coder — implements the current roadmap slice for Helia and documents what changed for QA.",
  model: "openai/gpt-5.6-luna-fast",
});
