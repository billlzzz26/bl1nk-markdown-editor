import { tool } from "ai";
import { z } from "zod";
import { updateNote } from "@/lib/agent/lib/convex";

/**
 * Update an existing note.
 *
 * WHEN TO USE:
 * - When user wants to edit note content
 * - When user wants to add or remove tags
 * - When user wants to correct or enhance a note
 *
 * USAGE:
 * - id: Note ID (required)
 * - title: New title (optional, if provided updates the title)
 * - content: New content (optional, if provided updates the content)
 * - tags: New tags array (optional, if provided replaces existing tags)
 *
 * IMPORTANT: Only the provided fields are updated; others remain unchanged.
 */
export const updateNoteTool = tool({
  description: `Update an existing note.

WHEN TO USE:
- When user wants to edit note content
- When user wants to add or remove tags
- When user wants to correct or enhance a note

IMPORTANT: Only provided fields are updated; omitted fields keep current values.`,

  inputSchema: z.object({
    id: z.string().describe("ID of the note to update"),
    title: z.string().max(200).optional().describe("New title (if updating)"),
    content: z.string().optional().describe("New content (if updating)"),
    tags: z.array(z.string()).max(10).optional().describe("New tags array (if updating)"),
  }),

  execute: async ({ id, title, content, tags }) => {
    const updatedId = await updateNote(id, title, content, tags);
    return {
      success: true,
      id: updatedId,
      title: title || "Updated note",
      message: `Note updated successfully`,
    };
  },
});

export type UpdateNoteInput = z.infer<typeof updateNoteTool.inputSchema>;
