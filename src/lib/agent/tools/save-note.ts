import { tool } from "ai";
import { z } from "zod";
import { saveNote } from "@/lib/agent/lib/convex";

/**
 * Save a new note with title, content, and optional tags.
 *
 * WHEN TO USE:
 * - When user wants to capture information
 * - When creating a new note from scratch
 * - When saving a thought, idea, or meeting notes
 *
 * USAGE:
 * - title: Clear, descriptive title (required)
 * - content: Full note body, supports markdown
 * - tags: Optional array of tags for organization (e.g., ["work", "meeting"])
 *
 * EXAMPLE:
 * save_note({ title: "Team sync", content: "Discussed Q3 goals...", tags: ["meeting", "work"] })
 */
export const saveNoteTool = tool({
  description: `Save a new note with title, content, and optional tags.

WHEN TO USE:
- When user wants to capture information
- When creating a new note from scratch
- When saving a thought, idea, or meeting notes

USAGE:
- title: Clear, descriptive title (required, max 200 chars)
- content: Full note body, supports markdown (required)
- tags: Optional array of tags for organization (e.g., ["work", "meeting"])

EXAMPLE:
save_note({ title: "Team sync", content: "Discussed Q3 goals...", tags: ["meeting", "work"] })`,

  inputSchema: z.object({
    title: z
      .string()
      .min(1)
      .max(200)
      .describe("Clear, descriptive title for the note"),
    content: z.string().min(1).describe("Full note content (markdown supported)"),
    tags: z.array(z.string()).max(10).optional().describe("Tags for categorization"),
  }),

  execute: async ({ title, content, tags }) => {
    const id = await saveNote(title, content, tags || []);
    return {
      success: true,
      id,
      title,
      message: `Note "${title}" saved successfully`,
    };
  },
});

export type SaveNoteInput = z.infer<typeof saveNoteTool.inputSchema>;
