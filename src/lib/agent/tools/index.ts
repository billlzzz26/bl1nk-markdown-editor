export { saveNoteTool, type SaveNoteInput } from "./save-note";
export { searchNotesTool, type SearchNotesInput } from "./search-notes";
export { listNotesTool, type ListNotesInput } from "./list-notes";
export { updateNoteTool, type UpdateNoteInput } from "./update-note";
export { deleteNoteTool, type DeleteNoteInput } from "./delete-note";

import { saveNoteTool } from "./save-note";
import { searchNotesTool } from "./search-notes";
import { listNotesTool } from "./list-notes";
import { updateNoteTool } from "./update-note";
import { deleteNoteTool } from "./delete-note";

/**
 * Tool set for the Notes Agent.
 * Matches open-agent's tools object pattern for ToolLoopAgent.
 */
export const tools = {
  save_note: saveNoteTool,
  search_notes: searchNotesTool,
  list_notes: listNotesTool,
  update_note: updateNoteTool,
  delete_note: deleteNoteTool,
} satisfies import("ai").ToolSet;
