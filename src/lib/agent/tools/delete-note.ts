import { tool } from "ai";
import { z } from "zod";
import { deleteNote } from "@/lib/agent/lib/convex";

/**
 * Delete a note permanently.
 *
 * WHEN TO USE:
 * - When user explicitly requests deletion
 * - When cleaning up old or obsolete notes
 *
 * USAGE:
 * - id: Note ID to delete (required)
 *
 * BEHAVIOR:
 * - This is PERMANENT — confirm with the user label before executing
 * - Returns success status and confirmation message
 */
export const deleteNoteTool = tool({
  description: `Delete a note permanently.

WHEN TO USE:
- When user explicitly requests deletion
- When cleaning up old or obsolete notes

BEHAVIOR:
- This is PERMANENT — agent should confirm with the user before executing
- Returns success status and confirmation message`,

  inputSchema: z.object({
    id: z.string().describe("ID of the note to delete"),
  }),

  execute: async ({ id }) => {
    await deleteNote(id);
    return {
      success: true,
      id,
      message: `Note deleted successfully`,
    };
  },
});

export type DeleteNoteInput = z.infer<typeof deleteNoteTool.inputSchema>;
