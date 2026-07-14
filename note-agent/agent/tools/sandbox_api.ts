import { defineTool } from "eve/tools";
import { z } from "zod";

/**
 * Sandbox API tool.
 *
 * Manages the agent's local sandbox (the eve sandbox at /workspace).
 * Can run commands, manage files, and check sandbox status.
 *
 * This runs inside the app runtime and uses ctx.getSandbox() to
 * interact with the live sandbox session.
 */

export default defineTool({
  description: "Manage the agent's local sandbox environment — run commands, manage files, check status, and control network policy.",
  inputSchema: z.object({
    action: z.enum(["run", "write_file", "read_file", "status", "cleanup", "network"]).describe("Sandbox API action"),
    command: z.string().optional().describe("Shell command to run (for 'run' action)"),
    path: z.string().optional().describe("File path relative to /workspace"),
    content: z.string().optional().describe("File content (for 'write_file' action)"),
    networkPolicy: z.string().optional().describe("Network policy: 'allow-all' or 'deny-all'"),
  }),
  async execute(input, ctx) {
    try {
      const sandbox = await ctx.getSandbox();

      switch (input.action) {
        case "status": {
          return {
            sandboxId: sandbox.id,
            workspaceDir: "/workspace",
            backend: "auto-detected",
            status: "active",
          };
        }

        case "run": {
          if (!input.command) return { error: "command required for run action" };
          const result = await sandbox.run({ command: input.command });
          return {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
          };
        }

        case "write_file": {
          if (!input.path || input.content === undefined) {
            return { error: "path and content required for write_file action" };
          }
          await sandbox.writeTextFile({ path: input.path, content: input.content });
          return { success: true, path: input.path };
        }

        case "read_file": {
          if (!input.path) return { error: "path required for read_file action" };
          const content = await sandbox.readTextFile({ path: input.path });
          return { path: input.path, content };
        }

        case "cleanup": {
          // Remove temp files from /workspace
          await sandbox.run({ command: "rm -rf /workspace/tmp /workspace/.temp 2>/dev/null; mkdir -p /workspace/tmp" });
          return { success: true, message: "Workspace cleaned" };
        }

        case "network": {
          const policy = input.networkPolicy === "deny-all" ? "deny-all" : "allow-all";
          await sandbox.setNetworkPolicy(policy);
          return { success: true, networkPolicy: policy };
        }

        default:
          return { error: `Unknown action: ${input.action}` };
      }
    } catch (err) {
      return {
        error: `Sandbox operation failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});
