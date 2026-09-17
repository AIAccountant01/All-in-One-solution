import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Helia Product Loop orchestrator — runs User → PM → Coder → QA until V1 is signed off by all four roles, then unlocks app creation.",
  model: "openai/gpt-5.6-luna-fast",
});
