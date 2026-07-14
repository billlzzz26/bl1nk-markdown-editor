import { defineMcpClientConnection } from "eve/connections";

/**
 * ClickUp MCP connection.
 *
 * Setup:
 * 1. Get ClickUp API token: https://app.clickup.com/settings/apps
 * 2. Set CLICKUP_MCP_URL to your MCP server endpoint
 * 3. Set CLICKUP_API_KEY
 *
 * Or use the ClickUp REST API directly: https://clickup.com/api
 */

export default defineMcpClientConnection({
  url: process.env.CLICKUP_MCP_URL || "http://localhost:3100/mcp",
  description: "ClickUp workspace: tasks, lists, folders, spaces, docs, and goals.",
  headers: process.env.CLICKUP_API_KEY
    ? { Authorization: `Bearer ${process.env.CLICKUP_API_KEY}` }
    : undefined,
});
