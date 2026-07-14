import { defineTool } from "eve/tools";
import { z } from "zod";

/**
 * Craft is an Apple-native note-taking app (macOS/iOS).
 * It uses Apple CloudKit for sync and does not expose a public HTTP API.
 *
 * To integrate with Craft:
 * 1. macOS only — requires a running Craft app and Apple Shortcuts or x-callback-url
 * 2. Use Craft's x-callback-url scheme: craftx://...
 * 3. Or set up the Craft Local HTTP Server plugin
 *
 * For now, this tool documents what's needed. The actual integration
 * requires a macOS environment.
 */

export default defineTool({
  description: "Interact with Craft notes (Apple-native app). Requires macOS with Craft installed. Supports reading recent notes, creating new notes, and searching.",
  inputSchema: z.object({
    action: z.enum(["list", "search", "get", "create"]).describe("Operation to perform"),
    query: z.string().optional().describe("Search query (for 'search' action)"),
    noteId: z.string().optional().describe("Note ID (for 'get' action)"),
    title: z.string().optional().describe("Note title (for 'create' action)"),
    content: z.string().optional().describe("Note content (for 'create' action)"),
  }),
  async execute(input) {
    return {
      status: "not_available",
      message: "Craft integration requires macOS with the Craft app and Craft Local HTTP Server plugin. See docs/craft-setup.md for setup instructions.",
      requestedAction: input.action,
    };
  },
});
