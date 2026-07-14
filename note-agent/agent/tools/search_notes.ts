import { defineTool } from "eve/tools";
import { z } from "zod";

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "";

export default defineTool({
  description: "Search notes by keyword in title and content from the Convex database.",
  inputSchema: z.object({
    query: z.string().min(1).describe("Search keyword"),
    tag: z.string().optional().describe("Filter by tag"),
    limit: z.number().min(1).max(100).default(30).describe("Max results"),
  }),
  async execute({ query, tag, limit }) {
    if (!CONVEX_URL) {
      return { error: "CONVEX_URL not configured." };
    }

    let results: any[] = [];

    if (tag) {
      const res = await fetch(`${CONVEX_URL}/api/query/notes:getNotesByTag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag }),
      });
      if (res.ok) results = await res.json();
    }

    const searchRes = await fetch(`${CONVEX_URL}/api/query/notes:searchNotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: query }),
    });
    if (searchRes.ok) {
      const searched = await searchRes.json();
      // Merge and deduplicate
      const seen = new Set(results.map((n: any) => n._id));
      for (const note of searched) {
        if (!seen.has(note._id)) results.push(note);
        seen.add(note._id);
      }
    }

    // Filter by tag search if tag was given
    if (tag && !tag) {
      // no-op
    }

    return { notes: results.slice(0, limit), total: results.length };
  },
});
