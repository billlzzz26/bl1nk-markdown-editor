---
name: eve-agent-builder
description: Build a full eve agent with tools, connections, skills, channels, subagents, sandbox — systematic scaffolding with known gotchas.
source: auto-skill
extracted_at: '2026-07-14T10:09:45.144Z'
---

# eve-agent-builder

Build or extend an eve agent systematically. This skill captures the order of operations and the edge cases discovered during real agent construction.

## Before starting

Run `npx eve info` to see what's already discovered. Fix any errors before adding new files.

## Build order

### 1. Instructions (`agent/instructions.md`)

The always-on system prompt. Keep it short and stable. Everything situational goes in skills.

**Gotcha:** You can have `instructions.md` OR `instructions.ts` at root level, not both (build error). A directory `instructions/` with multiple files is fine — they compose in alphabetical order.

### 2. Tools (`agent/tools/*.ts`)

One file per tool. The **filename** becomes the tool name the model sees: `agent/tools/list_notes.ts` → `list_notes`. Use snake_case ASCII.

```ts
import { defineTool } from "eve/tools";
import { z } from "zod";
export default defineTool({
  description: "...",
  inputSchema: z.object({ ... }),
  async execute(input, ctx) { ... },
});
```

**Pattern: custom API tool** — For services without an MCP server, create a tool wrapping `fetch()` calls to the REST API. Access keys from `process.env`. This is the path for services like Daytona whose MCP server uses stdio transport (not HTTP), making it incompatible with eve's MCP connection model.

**Pattern: ctx.getSandbox()** — For sandbox operations inside tools, use the `ctx` parameter: `const sandbox = await ctx.getSandbox()`. Then call `sandbox.run()`, `sandbox.writeTextFile()`, `sandbox.readTextFile()`, etc.

### 3. Connections (`agent/connections/*.ts`)

For MCP servers and OpenAPI APIs. The filename = connection name. Discovery exposes tools as `<connection>__<tool>`.

```ts
// MCP:
import { defineMcpClientConnection } from "eve/connections";
export default defineMcpClientConnection({ url: "...", description: "..." });

// OpenAPI:
import { defineOpenAPIConnection } from "eve/connections";
export default defineOpenAPIConnection({ spec: "...", baseUrl: "...", description: "..." });
```

**Gotcha: URL must be valid** — The `url` field on MCP connections **must be a valid URL**. An empty string from `process.env.SOMETHING || ""` fails discovery with "The url field must be a valid URL." Fix: provide a fallback placeholder URL: `process.env.CLICKUP_MCP_URL || "http://localhost:3100/mcp"`. The connection will be registered but fail at runtime when the server is unreachable — much better than failing at discovery time.

**Gotcha: MCP transport** — eve's MCP connections require Streamable HTTP or SSE transport. MCP servers that use stdio (subprocess-based, like Daytona's `daytona mcp start`) cannot be connected via `defineMcpClientConnection`. For those, create custom tools that call the REST API directly.

**Vercel Connect:** For OAuth-backed connections, `connect("provider/my-agent")` from `@vercel/connect/eve` handles browser consent, token storage, and refresh. Defaults to user-scoped; pass `{ connector: "...", principalType: "app" }` for agent-scoped.

### 4. Skills (`agent/skills/*.md`)

On-demand procedures the model loads via `load_skill`. Flat markdown is simplest:

```md
---
description: Trigger phrase for when the model should load this skill.
---

# Skill title

Instructions here...
```

Without `description` frontmatter, eve uses the first non-empty content line as the routing hint.

**Gotcha:** Skills are scoped per agent. A subagent cannot see the root's skills. Duplicate what a child needs.

### 5. Channels (`agent/channels/*.ts`)

Root-only. The built-in `eve` HTTP channel is available even without a file — add the file only to override auth.

| Channel | Setup |
|---|---|
| **eve (HTTP)** | Default. `eve init` scaffolds `eve.ts` with `[vercelOidc(), localDev(), placeholderAuth()]`. Remove `placeholderAuth()` before production. |
| **Slack** | `import { slackChannel } from "eve/channels/slack"` + Vercel Connect. Needs `@vercel/connect` package. |
| **Discord** | `import { discordChannel } from "eve/channels/discord"`. Needs env vars: `DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`, `DISCORD_BOT_TOKEN`. |

**Gotcha:** `placeholderAuth()` returns 401 in production. Replace it before deploying. For local dev, `[vercelOidc(), localDev()]` is sufficient.

### 6. Subagents (`agent/subagents/<id>/`)

Each subagent is its own directory with `agent.ts` (required, with `description`) and optional `instructions.md`, `tools/`, `skills/`, etc.

```
agent/subagents/researcher/
├── agent.ts            # required, must export description
├── instructions.md     # or instructions.ts, optional
├── tools/              # optional, child-only tools
└── skills/             # optional, child-only skills
```

**Critical gotcha: flat structure** — `instructions.md` goes **directly** under `subagents/researcher/`, NOT under `subagents/researcher/agent/`. Putting it under a nested `agent/` dir triggers `[warn] Ignoring unsupported directory "agent/" in the local subagent root.` — eve treats the directory as an unsupported slot and ignores it. The `agent.ts` also sits at the subagent root, not in a nested dir.

**Isolation rule:** A declared subagent inherits NOTHING from the parent. It has its own instructions, tools, connections, skills, sandbox. Duplicate shared content across children. The built-in `agent` tool (a copy of the parent) is the only exception — it inherits everything.

### 7. Sandbox (`agent/sandbox/sandbox.ts` or `agent/sandbox.ts`)

Use `defineSandbox` from `eve/sandbox`. Two layouts:

- **Shorthand** — `agent/sandbox.ts` (definition only, no seeded files)
- **Folder** — `agent/sandbox/sandbox.ts` + `agent/sandbox/workspace/**` (for seeded files)

```ts
import { defineSandbox, defaultBackend } from "eve/sandbox";

export default defineSandbox({
  backend: defaultBackend({ /* per-backend options */ }),
  revalidationKey: () => "v1",
  async bootstrap({ use }) { /* template-scoped setup */ },
  async onSession({ use, ctx }) { /* per-session setup + network policy */ },
});
```

**Backend priority:** `defaultBackend()` resolves: 1. Vercel Sandbox → 2. Docker → 3. microsandbox → 4. just-bash (pure JS, no real binaries).

**Network policy:** Default egress is `allow-all`. For production, set `networkPolicy: "deny-all"` or an explicit allow-list in `onSession`.

**Tool access:** Inside an authored tool, use `ctx.getSandbox()` to get the live sandbox handle. Exposes `run()`, `spawn()`, `readTextFile()`, `writeTextFile()`, `removePath()`, `setNetworkPolicy()`, `resolvePath()`.

### 8. Verify

```bash
npx eve info                  # check — 0 errors, 0 warnings
npx eve dev --no-ui           # headless dev server
# Test endpoints:
curl http://127.0.0.1:2000/eve/v1/health     # should respond
curl -X POST http://127.0.0.1:2000/eve/v1/session \
  -H 'content-type: application/json' \
  -d '{"message":"Hello"}'
```

## Patterns

### Pattern: Service-agnostic tool for CLI-based MCP

When a service provides an MCP server that uses stdio transport (not HTTP/SSE), you cannot use `defineMcpClientConnection`. Instead, create a custom tool that calls the service's REST API directly:

```ts
import { defineTool } from "eve/tools";
import { z } from "zod";

const API_BASE = process.env.SERVICE_API_URL || "https://api.example.com";
const API_KEY = process.env.SERVICE_API_KEY || "";

export default defineTool({
  description: "Manage service resources — create, list, get, delete.",
  inputSchema: z.object({
    action: z.enum(["create", "list", "get", "delete"]),
    id: z.string().optional(),
    // ... service-specific fields
  }),
  async execute(input) {
    if (!API_KEY) return { status: "not_configured", message: "API key not set." };
    // Switch on action, call fetch(), return result
  },
});
```

### Pattern: Optional connections

For services that may or may not be configured, use environment variables with a fallback placeholder URL. The connection is always registered but fails gracefully at runtime if the service is unreachable:

```ts
export default defineMcpClientConnection({
  url: process.env.SERVICE_URL || "http://localhost:3100/mcp",
  description: "...",
  headers: process.env.SERVICE_KEY ? { Authorization: `Bearer ${process.env.SERVICE_KEY}` } : undefined,
});
```

### Pattern: Moving tools from app agent to eve agent

When an app has its own agent system (e.g., `ToolLoopAgent` from `ai` SDK) and you want to migrate to eve:

1. Create equivalent tools in `note-agent/agent/tools/` using `defineTool` from `eve/tools`
2. Delete the old tool files from `src/lib/agent/tools/`
3. Update the old agent to use an empty `tools: {}` or remove the agent entirely
4. Clean up any orphaned utility files (e.g., `src/lib/agent/lib/tools.ts`)

The eve `defineTool` pattern and the AI SDK `tool()` pattern serve the same purpose but use different imports and conventions. They cannot be mixed.

## Platform issues (Termux/Android)

`eve dev` starts the server and health check passes (`GET /eve/v1/health`), but session creation fails with:

```
EACCES: permission denied, link '.../.workflow-data/runs/...json.tmp' -> '...json'
```

This is a **platform incompatibility**, not a code bug. The workflow engine uses `link()` for atomic file writes, which Android filesystems (FUSE-backed) do not support. Fix: deploy to Vercel or a Linux/Mac host. The agent code itself is correct (verified by `eve info` with 0 errors).

Additionally, `npx tsc --noEmit` fails on Android ARM64 because the TypeScript npm package has no prebuilt binary for that platform. Use `npx eve info` as the primary validation instead.

## Quick reference: what failed and why

| Symptom | Likely cause | Fix |
|---|---|---|
| `eve info` warns `unsupported directory` in subagent | instructions/tools in wrong nested dir | Move files to subagent root, not under `agent/` |
| `url` must be a valid URL | Empty string from env fallback | Provide a real placeholder URL |
| Channel handler failed / `EACCES: link` | Android filesystem | Deploy to Vercel or Linux/Mac |
| Tool not discovered | Wrong directory (`tools/` not `tool/`) or not a default export | Check path and export syntax |
| Connection `principal_required` | User-scoped `connect()` without authenticated session | Use `principalType: "app"` or add route auth |
| TypeScript `tsc` not found on Android | No ARM64 binary for TypeScript | Use `npx eve info` for validation instead |

## Appendix: App-to-eve connection pattern

When a Next.js app needs to call the eve agent (e.g., a chat UI that sends messages to the agent), create an API proxy route in the app that forwards requests to the eve agent's HTTP API.

### Architecture

```
browser (page.tsx) → /api/agent/notes (Next.js API route) → EVE_AGENT_URL (eve agent HTTP API)
```

### Setup

1. Set `EVE_AGENT_URL` env var (default: `http://127.0.0.1:2000`)
2. Create an API route that proxies messages to the eve agent
3. The page.tsx calls `/api/agent/notes` as before — no UI changes needed

### API route pattern

```ts
// src/app/api/agent/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateId, type UIMessage } from "ai";

const EVE_AGENT_URL = process.env.EVE_AGENT_URL || "http://127.0.0.1:2000";

// In-memory session store — maps thread/chat IDs to eve session tokens
const sessions = new Map<string, { sessionId: string; continuationToken: string }>();

export async function POST(req: NextRequest) {
  const { messages, threadId } = await req.json();

  // Find last user message
  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
  const userText = lastUserMsg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n");

  // Resume or create session
  const sessionKey = threadId || "default";
  const existing = sessions.get(sessionKey);

  const url = existing
    ? `${EVE_AGENT_URL}/eve/v1/session/${existing.sessionId}`
    : `${EVE_AGENT_URL}/eve/v1/session`;

  const body = existing
    ? { continuationToken: existing.continuationToken, message: userText }
    : { message: userText };

  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();

  // Store session for continuation
  if (data.continuationToken) {
    sessions.set(sessionKey, { sessionId: data.sessionId, continuationToken: data.continuationToken });
  }

  // Return as UIMessage for the frontend
  return NextResponse.json({
    message: { id: generateId(), role: "assistant", parts: [{ type: "text", text: data.text || "" }] },
    sessionId: data.sessionId,
  });
}
```

### Migrating from app agent to eve agent

When the app previously used its own agent (e.g., `ToolLoopAgent` from AI SDK):

1. Create equivalent tools in `note-agent/agent/tools/` using `defineTool` from `eve/tools`
2. Create the proxy API route (above) pointing at `EVE_AGENT_URL`
3. Delete old agent code: `src/lib/agent/tools/`, `agent.ts`, `system-prompt.ts`, `models.ts`, etc.
4. Move utility files (like `env.ts`) up to `src/lib/` if still used by other API routes
5. Update all imports from `@/lib/agent/lib/env` to `@/lib/env`
6. Verify: `grep -r "@/lib/agent" src/` returns nothing
7. Keep the old `/api/agent/notes` route name — the frontend doesn't need changes

The eve `defineTool` pattern and the AI SDK `tool()` pattern serve the same purpose but use different imports. They cannot be mixed in the same codebase — migrate all tools at once.

### Session management considerations

- **In-memory sessions** work for single-server dev but reset on restart. For production, persist session tokens in a database or use the Convex `threads` table.
- **Timeout**: Set a timeout on fetch to the eve agent (e.g., 30s) so the API route doesn't hang if the agent is down.
- **Fallback**: If session continuation fails (agent restarted, session expired), fall back to creating a new session with `callEveAgent(null, message)`.
- **Thread mapping**: Map `threadId` (from Convex threads table) to eve session IDs for multi-turn conversations.
