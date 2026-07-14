import { defineAgent } from "eve";

export default defineAgent({
  description: "Investigate questions thoroughly by searching notes, researching externally, and cross-referencing information before the parent agent responds.",
  model: "anthropic/claude-sonnet-5",
});
