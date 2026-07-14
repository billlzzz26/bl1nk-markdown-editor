import { defineTool } from "eve/tools";
import { z } from "zod";

/**
 * Daytona Sandbox management tool.
 *
 * Daytona provides cloud-based sandboxes for running code securely.
 * This tool uses the Daytona REST API directly.
 *
 * Setup:
 * 1. Get a Daytona API key: https://app.daytona.io/settings
 * 2. Set DAYTONA_API_KEY env var
 * 3. Optionally set DAYTONA_API_URL (default: https://app.daytona.io/api)
 *
 * Docs: https://www.daytona.io/docs/en/sandboxes.md
 */

const API_BASE = process.env.DAYTONA_API_URL || "https://app.daytona.io/api";
const API_KEY = process.env.DAYTONA_API_KEY || "";

async function daytonaFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Daytona API ${res.status}: ${text}`);
  }
  return res.json();
}

export default defineTool({
  description: "Manage Daytona sandboxes — create, list, get, stop, and delete cloud sandbox environments. Daytona sandboxes are isolated VMs/containers for running code securely.",
  inputSchema: z.object({
    action: z.enum(["create", "list", "get", "stop", "delete"]).describe("Sandbox operation"),
    sandboxId: z.string().optional().describe("Sandbox ID (required for get/stop/delete)"),
    snapshot: z.string().optional().describe("Snapshot name for create (daytona-small, daytona-medium, daytona-large)"),
    image: z.string().optional().describe("Docker image for create"),
    cpu: z.number().optional().describe("vCPUs (1-4)"),
    memory: z.number().optional().describe("Memory in GiB (1-8)"),
    disk: z.number().optional().describe("Disk in GiB (1-10)"),
  }),
  async execute(input) {
    if (!API_KEY) {
      return {
        status: "not_configured",
        message: "DAYTONA_API_KEY not set. Get an API key from https://app.daytona.io/settings",
      };
    }

    try {
      switch (input.action) {
        case "list": {
          const data = await daytonaFetch("/sandbox");
          return {
            sandboxes: Array.isArray(data) ? data : [],
            total: Array.isArray(data) ? data.length : 0,
          };
        }

        case "get": {
          if (!input.sandboxId) return { error: "sandboxId required" };
          const data = await daytonaFetch(`/sandbox/${input.sandboxId}`);
          return { sandbox: data };
        }

        case "create": {
          const body: Record<string, unknown> = {};
          if (input.snapshot) body.snapshot = input.snapshot;
          if (input.image) body.image = input.image;
          if (input.cpu || input.memory || input.disk) {
            body.resources = {};
            if (input.cpu) (body.resources as Record<string, number>).cpu = input.cpu;
            if (input.memory) (body.resources as Record<string, number>).memory = input.memory;
            if (input.disk) (body.resources as Record<string, number>).disk = input.disk;
          }
          const data = await daytonaFetch("/sandbox", {
            method: "POST",
            body: JSON.stringify(body),
          });
          return { sandbox: data, message: "Sandbox created successfully" };
        }

        case "stop": {
          if (!input.sandboxId) return { error: "sandboxId required" };
          const data = await daytonaFetch(`/sandbox/${input.sandboxId}/stop`, {
            method: "POST",
          });
          return { success: true, sandboxId: input.sandboxId };
        }

        case "delete": {
          if (!input.sandboxId) return { error: "sandboxId required" };
          await daytonaFetch(`/sandbox/${input.sandboxId}`, {
            method: "DELETE",
          });
          return { success: true, sandboxId: input.sandboxId, message: "Sandbox deleted" };
        }

        default:
          return { error: `Unknown action: ${input.action}` };
      }
    } catch (err) {
      return {
        error: `Daytona operation failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});
