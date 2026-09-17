import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Product Manager — turns user feedback into a scoped V1 roadmap, priorities, and cut list for Helia.",
  model: "openai/gpt-5.6-luna-fast",
});
