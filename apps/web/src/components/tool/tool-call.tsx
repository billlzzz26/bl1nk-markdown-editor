"use client";

import { cn } from "@/lib/utils";
import type { ToolRenderState } from "./tool-layout";
import { ToolLayout } from "./tool-layout";
import type { UIMessage } from "ai";

// Import renderers (created in next step)
import { SaveNoteRenderer } from "./renderers/save-note-renderer";
import { SearchNotesRenderer } from "./renderers/search-notes-renderer";
import { ListNotesRenderer } from "./renderers/list-notes-renderer";
import { UpdateNoteRenderer } from "./renderers/update-note-renderer";
import { DeleteNoteRenderer } from "./renderers/delete-note-renderer";

export type ToolCallProps = {
  part: any;
  activeApprovalId?: string | null;
  isStreaming?: boolean;
  onApprove?: (id: string) => void;
  onDeny?: (id: string, reason?: string) => void;
  state: ToolRenderState;
  className?: string;
};

/**
 * ToolCall dispatcher — routes to the correct renderer based on part.type.
 *
 * Matches open-agent pattern from apps/web/components/tool-call/tool-call.tsx
 *
 * Tool part types:
 * - "tool-save-note" → SaveNoteRenderer
 * - "tool-search-notes" → SearchNotesRenderer
 * - "tool-list-notes" → ListNotesRenderer
 * - "tool-update-note" → UpdateNoteRenderer
 * - "tool-delete-note" → DeleteNoteRenderer
 */
export function ToolCall({
  part,
  activeApprovalId = null,
  isStreaming = false,
  onApprove,
  onDeny,
  state,
  className,
}: ToolCallProps) {
  // Determine approval ID if state indicates approval requested
  const approvalId =
    state.approvalRequested && activeApprovalId ? activeApprovalId : undefined;

  // Base props shared across renderers
  const commonProps = {
    part,
    state,
    onApprove,
    onDeny,
    approvalId,
  };

  switch (part.type) {
    case "tool-save-note":
      return <SaveNoteRenderer {...commonProps} />;
    case "tool-search-notes":
      return <SearchNotesRenderer {...commonProps} />;
    case "tool-list-notes":
      return <ListNotesRenderer {...commonProps} />;
    case "tool-update-note":
      return <UpdateNoteRenderer {...commonProps} />;
    case "tool-delete-note":
      return <DeleteNoteRenderer {...commonProps} />;
    default:
      return (
        <ToolLayout
          name={part.type}
          summary="Unknown tool type"
          state={state}
          className={className}
        />
      );
  }
}
