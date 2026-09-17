import { defineAgent } from "eve";

export default defineAgent({
  description:
    "User role — captures end-user feedback, pain points, must-haves, and V1 acceptance criteria for Helia.",
  model: "openai/gpt-5.6-luna-fast",
});
