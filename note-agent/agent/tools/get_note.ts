import { defineTool } from "eve/tools";
import { z } from "zod";

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "";

export default defineTool({
  description: "Get a single note by its ID from the Convex database.",
  inputSchema: z.object({
    id: z.string().min(1).describe("The note ID to retrieve"),
  }),
  async execute({ id }) {
    if (!CONVEX_URL) {
      return { error: "CONVEX_URL not configured." };
    }
    const res = await fetch(`${CONVEX_URL}/api/query/notes:getNote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `Convex query failed (${res.status}): ${text}` };
    }
    const note = await res.json();
    if (!note) return { error: "Note not found." };
    return { note };
  },
});
