import { defineTool } from "eve/tools";
import { z } from "zod";

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "";

export default defineTool({
  description: "Update an existing note's title, content, tags, or mark it as a newer version.",
  inputSchema: z.object({
    id: z.string().min(1).describe("The note ID to update"),
    title: z.string().optional().describe("New title"),
    content: z.string().optional().describe("New content"),
    tags: z.array(z.string()).optional().describe("New tags array"),
    expectedVersion: z.number().optional().describe("Optimistic concurrency version check"),
  }),
  async execute(input) {
    if (!CONVEX_URL) {
      return { error: "CONVEX_URL not configured." };
    }
    const res = await fetch(`${CONVEX_URL}/api/mutation/notes:updateNote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const text = await res.text();
      if (text.includes("CONFLICT")) {
        return { error: "Version conflict: note was modified by another client. Re-fetch and retry." };
      }
      return { error: `Convex mutation failed (${res.status}): ${text}` };
    }
    return { success: true, noteId: await res.json() };
  },
});
