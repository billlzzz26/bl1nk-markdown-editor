---
name: convex-crud-page
description: Scaffold a full CRUD page with Convex schema, queries/mutations, API proxy route, and shadcn/ui React components.
source: auto-skill
---

# convex-crud-page

Create a complete CRUD feature page in a Next.js + Convex + shadcn/ui app. Follows the proxy pattern: Client → API route → Convex HTTP endpoint.

## Structure

```
convex/
  schema.ts              — add table definition
  <entity>.ts            — queries + mutations
src/app/api/<entity>/route.ts  — API proxy
src/components/<entity>/       — React UI components
src/app/<entity>/page.tsx      — page route
```

## Step 1: Convex schema

Add a table to `convex/schema.ts`:

```ts
<entity>: defineTable({
  field1: v.string(),
  field2: v.number(),
  // ...
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_createdAt", ["createdAt"])
```

Use `v.id("otherTable")` for foreign keys, `v.optional()` for nullable fields.

## Step 2: Convex queries/mutations

Create `convex/<entity>.ts`:

```ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Queries (read, no side effects)
export const list = query({ args: {}, handler: async (ctx) => { ... } });
export const get = query({ args: { id: v.id("<entity>") }, handler: async (ctx, args) => { ... } });
export const search = query({ args: { query: v.string() }, handler: async (ctx, args) => { ... } });

// Mutations (write)
export const save = mutation({ args: { ... }, handler: async (ctx, args) => { ... } });
export const remove = mutation({ args: { id: v.id("<entity>") }, handler: async (ctx, args) => { ... } });
```

**Key:** The function name (e.g., `list`) maps to the Convex HTTP endpoint path (`/api/list`). The full path used in the proxy is `/api/<entity>FunctionName`.

## Step 3: API proxy route

Create `src/app/api/<entity>/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { CONVEX_URL } from "@/lib/agent/lib/env";

const ACTION_ENDPOINTS = {
  list: "/api/list",
  get: "/api/get",
  search: "/api/search",
  save: "/api/save",
  remove: "/api/delete",
} as const;

type Action = keyof typeof ACTION_ENDPOINTS;

export async function POST(request: NextRequest) {
  try {
    const { action, args } = await request.json();
    if (!CONVEX_URL) return NextResponse.json({ error: "CONVEX_URL not configured" }, { status: 500 });
    if (!(action in ACTION_ENDPOINTS)) return NextResponse.json({ error: "Unsupported action" }, { status: 400 });

    const res = await fetch(new URL(ACTION_ENDPOINTS[action as Action], CONVEX_URL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) return NextResponse.json({ error: `Convex error: ${await res.text()}` }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Naming:** The action keys in `ACTION_ENDPOINTS` must match the query/mutation function names in `convex/<entity>.ts`. The endpoint URL format is `{CONVEX_URL}/api/<functionName>`.

## Step 4: React UI components

Create `src/components/<entity>/`. Common patterns:

### List component (`<entity>-list.tsx`)

- Fetch on mount with `useEffect(() => { fetch("/api/<entity>", { method: "POST", body: JSON.stringify({ action: "list", args: {} }) }) }, [])`
- Search input + filter chips
- Render list with delete action
- Loading skeleton with `animate-pulse`
- Empty state with icon + text
- Footer showing "X of Y items"

### Card component (`<entity>-card.tsx`)

- Icon based on type (use `lucide-react`)
- Info display (name, metadata, timestamps)
- Action buttons (view/download/delete) with hover reveal

### Uploader component (`<entity>-uploader.tsx`)

- Drag & drop zone with `onDragEnter/onDragLeave/onDrop`
- Click to select via hidden `<input type="file">`
- File validation (size, type)
- Selected file preview + upload/cancel buttons
- Visual states: idle, dragover (highlighted), selected, uploading

Use Tailwind classes from the dark theme:
- Container: `rounded-xl border border-glass-border bg-glass`
- Interactive: `hover:border-neutral-700 transition-all`
- Primary action: `bg-accent-teal text-black hover:bg-accent-teal-dim`
- Secondary: `border border-glass-border`
- Text: `text-white`, `text-neutral-300`, `text-neutral-400`, `text-neutral-500`
- Dangerous: `hover:text-aurora-red`

## Step 5: Page route

Create `src/app/<entity>/page.tsx`:

```tsx
"use client";

export default function EntityPage() {
  // State: items[], loading, showUpload
  // fetchItems() via /api/<entity> POST
  // handleCreate/Update/Delete wrappers
  // return full-page layout with header + content
}
```

Include a back button (`Link href="/"` with `ArrowLeft` icon) in the header.

## Step 6: Navigation

Add a link to the new page from the main page:

```tsx
<Link href="/<entity>" className="..." aria-label="<Entity>">
  <Icon className="size-4" />
</Link>
```

## Gotchas

- **`CONVEX_URL` must be set** — the proxy returns 500 if missing. Set `NEXT_PUBLIC_CONVEX_URL` in env.
- **Function names must match** — the action string in `ACTION_ENDPOINTS` must be the exact Convex function name (e.g., `listFiles` not `list` if that's what's in `convex/files.ts`).
- **Zod on queries** — Convex query args are validated by Convex. The proxy passes them through as JSON. No additional Zod needed on the proxy side.
- **TypeScript on Android** — `npx tsc` won't work on Android ARM64. Validate by running `bun typecheck` on a real machine.
- **File size** — Data URL upload is fine for small files (<1MB). For production, use a proper upload API that returns a URL.
