import { defineAgent } from "eve";

export default defineAgent({
  description:
    "QA — verifies Helia against V1 acceptance criteria, files defects, and blocks ship until checks pass.",
  model: "openai/gpt-5.6-luna-fast",
});
