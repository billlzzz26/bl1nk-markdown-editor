import { defineTool } from "eve/tools";
import { z } from "zod";

/**
 * Obsidian integration requires the Obsidian Local REST API plugin
 * (community plugin) running on the local machine.
 *
 * Setup:
 * 1. Install "Local REST API" plugin in Obsidian
 * 2. Enable it and set a port (default: 27123)
 * 3. Set OBSIDIAN_API_KEY env var to the plugin's API key
 * 4. Set OBSIDIAN_VAULT_PATH if accessing from this agent
 */

const OBSIDIAN_BASE = process.env.OBSIDIAN_URL || "http://127.0.0.1:27123";
const OBSIDIAN_KEY = process.env.OBSIDIAN_API_KEY || "";

export default defineTool({
  description: "Interact with Obsidian vault: search, read, create, and update notes. Requires Obsidian with Local REST API plugin.",
  inputSchema: z.object({
    action: z.enum(["list", "search", "read", "create", "update"]).describe("Operation"),
    path: z.string().optional().describe("File path within vault (for read/update)"),
    query: z.string().optional().describe("Search query (for search action)"),
    content: z.string().optional().describe("Note content (for create/update)"),
    filename: z.string().optional().describe("Filename (for create action)"),
  }),
  async execute(input) {
    if (!OBSIDIAN_KEY) {
      return {
        status: "not_configured",
        message: "OBSIDIAN_API_KEY not set. Install the Obsidian Local REST API plugin and set the env var.",
      };
    }

    const headers = {
      Authorization: `Bearer ${OBSIDIAN_KEY}`,
      "Content-Type": "application/json",
    };

    try {
      switch (input.action) {
        case "list": {
          const res = await fetch(`${OBSIDIAN_BASE}/vault/`, { headers });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const files = await res.json();
          return { files: Array.isArray(files) ? files.filter((f: any) => f.endsWith?.(".md")) : [] };
        }
        case "search": {
          const res = await fetch(`${OBSIDIAN_BASE}/search/simple/`, {
            method: "POST",
            headers,
            body: JSON.stringify({ query: input.query }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return { results: await res.json() };
        }
        case "read": {
          if (!input.path) return { error: "path required for read" };
          const res = await fetch(`${OBSIDIAN_BASE}/vault/${encodeURIComponent(input.path)}`, { headers });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return { content: await res.text() };
        }
        case "create": {
          if (!input.filename) return { error: "filename required for create" };
          const res = await fetch(`${OBSIDIAN_BASE}/vault/${encodeURIComponent(input.filename)}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ content: input.content || "" }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return { success: true };
        }
        default:
          return { error: `Unknown action: ${input.action}` };
      }
    } catch (err) {
      return { error: `Obsidian connection failed: ${err}. Make sure the Local REST API plugin is running.` };
    }
  },
});
