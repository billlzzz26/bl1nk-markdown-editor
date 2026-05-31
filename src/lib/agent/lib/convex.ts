/**
 * Convex client wrapper for the Notes Agent.
 * Re-exports Convex API functions from the existing implementation
 * to avoid duplication. All calls go through /api/convex proxy.
 */

export {
  listNotes,
  getNote,
  searchNotes,
  getNotesByTag,
  saveNote,
  updateNote,
  deleteNote,
  listThreads,
  getThread,
  createThread,
  addMessageToThread,
} from "@/app/components/agents/lib/convex";
