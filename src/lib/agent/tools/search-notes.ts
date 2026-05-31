import { tool } from "ai";
import { z } from "zod";
import { searchNotes } from "@/lib/agent/lib/convex";

/**
 * Search notes by content or title.
 *
 * WHEN TO USE:
 * - When user asks a question that might be answered by their notes
 * - When looking for specific information
 * - When user says "find" or "search"
 *
 * USAGE:
 * - search: Query string to search across note titles and content
 *
 * RETURNS:
 * - Array of matching notes with id, title, snippet, tags
 * - count of total matches
 *
 * IMPORTANT: Always search before claiming no data exists on a topic.
 */
export const searchNotesTool = tool({
  description: `Search notes by content or title.

WHEN TO USE:
- When user asks a question that might be answered by their notes
- When looking for specific information
- When user says "find" or "search"

IMPORTANT: Always search notes before claiming no data exists on a topic.`,

  inputSchema: z.object({
    search: z
      .string()
      .min(1)
      .max(200)
      .describe("Search query to match against note titles and content"),
  }),

  execute: async ({ search }) => {
    const notes = await searchNotes(search);
    return {
      success: true,
      notes: notes.map((n) => ({
        id: n._id,
        title: n.title,
        content: n.content,
        tags: n.tags,
        updatedAt: n.updatedAt,
      })),
      count: notes.length,
      message: `Found ${notes.length} note(s) matching "${search}"`,
    };
  },
});

export type SearchNotesInput = z.infer<typeof searchNotesTool.inputSchema>;
