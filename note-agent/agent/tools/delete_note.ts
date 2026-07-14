import { defineTool } from "eve/tools";
import { z } from "zod";

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "";

export default defineTool({
  description: "Permanently delete a note by its ID from the Convex database.",
  inputSchema: z.object({
    id: z.string().min(1).describe("The note ID to delete"),
  }),
  async execute({ id }) {
    if (!CONVEX_URL) {
      return { error: "CONVEX_URL not configured." };
    }
    const res = await fetch(`${CONVEX_URL}/api/mutation/notes:deleteNote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `Convex mutation failed (${res.status}): ${text}` };
    }
    return { success: true, deletedId: await res.json() };
  },
});
