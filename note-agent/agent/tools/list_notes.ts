import { defineTool } from "eve/tools";
import { z } from "zod";

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "";

export default defineTool({
  description: "List all notes from the Convex database, ordered by most recent first.",
  inputSchema: z.object({
    limit: z.number().min(1).max(200).default(50).describe("Max notes to return"),
  }),
  async execute({ limit }) {
    if (!CONVEX_URL) {
      return { error: "CONVEX_URL not configured. Set CONVEX_URL or NEXT_PUBLIC_CONVEX_URL env var." };
    }
    const res = await fetch(`${CONVEX_URL}/api/query/notes:listNotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `Convex query failed (${res.status}): ${text}` };
    }
    const data = await res.json();
    const notes = Array.isArray(data) ? data.slice(0, limit) : [];
    return { notes, total: notes.length };
  },
});
