import { defineAgent } from "eve";

export default defineAgent({
  description: "Edit, format, and polish note content. Improve clarity, structure, and consistency while preserving the author's voice.",
  model: "anthropic/claude-sonnet-5",
});
