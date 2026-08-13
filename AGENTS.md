# AGENTS.md - bl1nk-markdown-editor Project Map

## 🎯 Vision (Director's Intent)
สร้าง Markdown Editor ที่ใช้งานง่ายและสามารถรวมเข้ากับ App หรือ Web App ได้อย่างรวดเร็วและมีประสิทธิภาพ โดยเน้นความเป็น Agentic และความพึงพอใจของนักพัฒนา

## 🏗️ Architecture Overview
- **Framework**: Next.js 16 (App Router)
- **Database/Backend**: Convex
- **Editor**: CodeMirror 6 (replacing Monaco)
- **AI Integration**: eve framework (found in `note-agent/`)
- **UI Components**: Tailwind CSS v4 / shadcn/ui

## 🚦 Current Status
- **Phase**: Phase 2: Architecture Transformation (Monorepo & CodeMirror 6)
- **Active Wave**: Wave 2
- **Health**: 🟢 Healthy (Monorepo Initialized, SPEC.md Created)

## 🛠️ Infrastructure
- **Docs**: `docs/` (Architecture, Decisions)
- **Tools**: `tools/` (To be developed)
- **Memory**: `learnings.md`

## 📝 Recent Learnings
- **Monorepo Migration**: ย้ายโค้ดเดิมไปที่ `apps/web` และเตรียม `packages/editor` สำหรับ Editor ตัวใหม่
- **Editor Pivot**: ตัดสินใจเปลี่ยนจาก Monaco เป็น CodeMirror 6 เพื่อความยืดหยุ่นในการทำ Plugin และน้ำหนักเบา
- **AI Focus**: เน้นการทำ Autocomplete และ Custom Rules เป็นลำดับแรกในด้าน AI
- **Infrastructure**: ใช้ `pnpm workspaces` ในการกำหนดโครงสร้าง Monorepo แต่ใช้ `bun` เป็นเครื่องมือหลักในการรันคำสั่ง (install, build, test) เพื่อประสิทธิภาพสูงสุด

---

## Project Overview

AI-powered notebook app: Next.js 16 (App Router), React 19, Convex backend, Tailwind CSS v4, TypeScript 5.9, shadcn/ui components, Vitest testing.

---

## Build / Lint / Test Commands

| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies |
| `bun build` | Production build (Next.js) |
| `bun lint` | ESLint (eslint-config-next) |
| `bun typecheck` | TypeScript type check (`tsc --noEmit`) |
| `bun test` | Vitest in watch mode |
| `bun test:run` | Run tests once and exit |
| `bun test:ui` | Vitest with interactive UI |

### Running a Single Test

```bash
# By test name
bun test:run -t "renders create mode"

# By file
bun test:run src/components/ui/note-editor.test.tsx
```

### Pre-commit Checklist

Always run before committing:

```bash
bun typecheck && bun lint
```

### Convex Backend

```bash
npx convex dev          # Start Convex dev server
```

**Never run `next dev` or `bun dev`** — the sandbox handles this automatically.

---

## Code Style

### TypeScript

- **Strict mode** enabled (`tsconfig.json` → `"strict": true`)
- Use explicit types for function parameters and return values
- Prefer `interface` over `type` for object shapes; use `type` for unions/intersections
- Use `React.ReactNode` for children props, not `JSX.Element`
- Path alias: `@/*` maps to `./src/*`

### React / Next.js

- Use **Server Components** by default; add `"use client"` only when needed (state, effects, event handlers)
- Use `next/image` for images, `next/link` for navigation
- Use `error.tsx` for error boundaries, `not-found.tsx` for 404s
- Hooks: prefer `useCallback`/`useMemo` for stable references passed to children
- State: `useState` for local, consider lifting or context for shared state

### Imports

```tsx
// 1. React / Next.js
import { useState, useCallback } from "react";

// 2. Third-party libraries
import { clsx } from "clsx";

// 3. Internal components (shadcn/ui)
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// 4. Utilities
import { cn } from "@/lib/utils";

// 5. Types
import type { Note } from "@/components/ui/note-editor";
```

Use `import type` for type-only imports.

### Naming Conventions

- **Files**: kebab-case (`note-editor.tsx`, `notes-panel.tsx`)
- **Components**: PascalCase (`NoteEditorDialog`, `NotesList`)
- **Functions/variables**: camelCase (`handleSaveNote`, `fetchNotes`)
- **Types/Interfaces**: PascalCase (`Note`, `SyncState`, `NoteEditorProps`)
- **Constants**: UPPER_SNAKE_CASE for true constants; camelCase for config objects
- **Test files**: `*.test.tsx` co-located with source

### Styling (Tailwind CSS v4)

- **Mobile-first**: base styles = mobile, add `sm:` `md:` `lg:` for larger screens
- Touch targets: minimum `min-h-[44px] min-w-[44px]` on mobile
- Use `cn()` from `@/lib/utils` for conditional class merging
- shadcn/ui components use CSS variables defined in `globals.css` under `@theme`
- Dark theme: project uses a black/teal/aurora color palette

```tsx
// Good — mobile-first, responsive, merged
<div className="w-full px-4 sm:px-6 md:px-8">
  <Button className="min-h-[44px] sm:min-h-[28px]">Action</Button>
</div>
```

### Error Handling

- API routes: return `NextResponse.json({ error: "..." }, { status: 500 })` with appropriate codes
- Convex mutations: throw `Error` with descriptive messages; use `CONFLICT:` prefix for version mismatches
- Client fetches: wrap in try/catch, log errors with `console.error`
- Never swallow errors silently — at minimum log them

### shadcn/ui Components

- Add new components: `npx shadcn@latest add [component]`
- Components live in `src/components/ui/`
- Import via `@/components/ui/[name]`
- Variants use `class-variance-authority`; merge with `cn()`

---

## Project Structure

```
src/
  app/
    page.tsx                  # Main three-panel layout
    globals.css               # Tailwind + shadcn theme tokens
    components/
      notes-panel.tsx         # Notes panel with CRUD
      thread-sidebar.tsx      # Thread navigation
      note-tool-renderers.tsx # Tool result display
      agents/                 # AI agent logic
    api/
      notes/route.ts          # Notes API proxy
  components/
    ui/                       # shadcn/ui + custom components
      note-editor.tsx         # Markdown editor (primary editor file)
      note-editor.test.tsx    # Editor tests
  lib/
    utils.ts                  # cn() utility
convex/
  schema.ts                   # Database schema (notes, threads)
  notes.ts                    # CRUD mutations and queries
```

---

## Key Patterns

### Convex Data Flow

- Schema defined in `convex/schema.ts` with typed validators
- Mutations (`saveNote`, `updateNote`, `deleteNote`) in `convex/notes.ts`
- `updateNote` supports optimistic concurrency via `expectedVersion`
- Client calls go through `/api/notes` proxy (not direct Convex URLs)

### Note Sync Metadata

Notes include: `contentFormat`, `contentVersion`, `lastSyncedAt`, `updatedByClientId` — all optional for backward compatibility with legacy plain-text notes.

### Component Testing (Vitest + Testing Library)

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";

it("calls onSave when clicking save", async () => {
  const onSave = vi.fn();
  render(<NoteEditorDialog onSave={onSave} isOpen={true} />);
  fireEvent.click(screen.getByRole("button", { name: /create/i }));
  await waitFor(() => expect(onSave).toHaveBeenCalled());
});
```

Setup file: `src/setup-test.ts` (auto-cleanup after each test).

---

## Constraints

- **Package manager**: `bun` only — never use `npm` or `yarn` (Note: `pnpm` is used only for workspace definition in `pnpm-workspace.yaml`, but all execution must be via `bun`)
- **No `next dev`**: sandbox handles dev server
- **Commit workflow**: `bun typecheck && bun lint && git add -A && git commit -m "message" && git push`
- **Windows note**: some Turbopack/shiki features may have junction issues — avoid unstable paths like `shiki/streamdown`

---

## Optional Feature Guides

When users request features beyond the base project scope, check for available recipes in `.kilocode/recipes/`.

### Available Recipes

| Recipe       | File                                | When to Use                                           |
| ------------ | ----------------------------------- | ----------------------------------------------------- |
| Add Database | `.kilocode/recipes/add-database.md` | When user needs data persistence (users, posts, etc.) |

### How to Use Recipes

1. Read the recipe file when the user requests the feature
2. Follow the step-by-step instructions
3. Update the memory bank after implementing the feature

## Memory Bank Maintenance

After completing any task, update the relevant memory bank files:

- `.kilocode/rules/memory-bank/context.md` - Current state and recent changes
- Other memory bank files as needed when architecture, tech stack, or project goals change

## Agent skills

### Issue tracker

GitHub Issues — PRs from external contributors are also triaged as request surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — CONTEXT.md + ADRs at repo root. See `docs/agents/domain.md`.
