import { defineTool } from "eve/tools";
import { z } from "zod";

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "";

export default defineTool({
  description: "Create a new note in the Convex database.",
  inputSchema: z.object({
    title: z.string().min(1).describe("Note title"),
    content: z.string().describe("Note content in markdown"),
    tags: z.array(z.string()).default([]).describe("Optional tags"),
    contentFormat: z.string().default("markdown").describe("Content format (markdown, plain)"),
  }),
  async execute(input) {
    if (!CONVEX_URL) {
      return { error: "CONVEX_URL not configured." };
    }
    const res = await fetch(`${CONVEX_URL}/api/mutation/notes:saveNote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `Convex mutation failed (${res.status}): ${text}` };
    }
    const noteId = await res.json();
    return { success: true, noteId };
  },
});
