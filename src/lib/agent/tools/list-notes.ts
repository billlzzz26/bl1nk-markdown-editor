import { tool } from "ai";
import { z } from "zod";
import { listNotes } from "@/lib/agent/lib/convex";

/**
 * List all notes, sorted by most recent first.
 *
 * WHEN TO USE:
 * - When user wants to see all their notes
 * - When user asks "what notes do I have?"
 * - As a fallback when search has no criteria
 *
 * RETURNS:
 * - Array of all notes with metadata (id, title, tags, createdAt, updatedAt)
 * - count of total notes
 */
export const listNotesTool = tool({
  description: `List all notes, sorted by most recent.

WHEN TO USE:
- When user wants to see all their notes
- When user asks "what notes do I have?"
- As a fallback when search has no criteria

RETURNS:
- Array of all notes with metadata, tags, and timestamps
- count of total notes`,

  inputSchema: z.object({}),

  execute: async () => {
    const notes = await listNotes();
    return {
      success: true,
      notes: notes.map((n) => ({
        id: n._id,
        title: n.title,
        tags: n.tags,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
      count: notes.length,
      message: `You have ${notes.length} note(s)`,
    };
  },
});

export type ListNotesInput = z.infer<typeof listNotesTool.inputSchema>;
