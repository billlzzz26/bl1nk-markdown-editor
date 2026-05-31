# Track: Fix TypeScript Errors from AI SDK v6 Migration

## Objective
Resolve all 50+ TypeScript errors identified after the dependency update. This involves migrating to AI SDK v6 patterns, fixing missing imports, and addressing type mismatches in internal components.

## Background
The project was recently updated with security overrides and some dependency bumps. AI SDK v6 introduces significant changes to `UIMessage`, `ToolLoopAgent`, and how React hooks are exported.

## Key Files & Context
- `src/lib/agent/agent.ts`: Core agent logic using `ToolLoopAgent`.
- `src/app/api/agent/notes/route.ts`: Agent API endpoint.
- `src/app/page.tsx`: Main chat interface.
- `src/app/components/agents/note-taker.tsx`: Secondary agent interface.
- `src/components/tool-call/`: Tool rendering components.
- `package.json`: Dependency management.

## Proposed Solution
Systematically update each file to align with AI SDK v6 and project-specific type definitions.

### Phase 1: Dependency Correction
- Add `@ai-sdk/react` to `package.json`.
- (Optional) Install `@types/monaco-editor`.

### Phase 2: Core Agent & API Migration
- **Agent:** Update `ToolLoopAgent` usage. Fix `AgentMessage` and `ModelMessage` mismatch.
- **Context:** Fix headers type in `addCacheControl`.
- **API:** Update `UIMessage` construction and conversion. Fix property access on `GenerateTextResult`.

### Phase 3: UI & Component Fixes
- **Imports:** Fix `useChat` import and relative path imports in `note-taker.tsx`.
- **UIMessage:** Update components to handle `parts` instead of (or in addition to) `content`.
- **Tool Rendering:** Fix `part` type in `ToolCallProps`. Remove non-existent `warning` prop from `DeleteNoteRenderer`.
- **Missing Imports:** Add `Button` import to `tool-layout.tsx`.

### Phase 4: Miscellaneous Fixes
- **Monaco:** Add types for `onMount` and other callbacks in `MonacoEditor`.
- **Convex:** Fix return object access in `update-note.ts`.

## Verification & Testing
1. Run `npm run typecheck` to confirm all errors are resolved.
2. Run `npm run test:run` to ensure existing tests pass.
3. Manually verify chat and note editing functionality.
