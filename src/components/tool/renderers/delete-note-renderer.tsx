"use client";

import { Trash2 } from "lucide-react";
import type { UIMessage } from "ai";
import { ToolLayout } from "../tool-layout";

type ToolPart = UIMessage["parts"][number] & {
  type: "tool-delete-note";
  toolName?: string;
  input?: { id?: string };
  result?: { success?: boolean; id?: string; message?: string };
};

export function DeleteNoteRenderer({
  part,
  state,
  approvalId,
  onApprove,
  onDeny,
}: {
  part: ToolPart;
  state: import("../tool-layout").ToolRenderState;
  approvalId?: string;
  onApprove?: (id: string) => void;
  onDeny?: (id: string, reason?: string) => void;
}) {
  const { input, result } = part;

  const summary = input?.id ? `Delete note ${input.id}` : "Deleting note...";

  const output = result ? (
    <div className="space-y-2">
      {result.success ? (
        <div className="flex items-center gap-2 text-green-600">
          <Trash2 className="h-4 w-4" />
          <span>{result.message || "Note deleted successfully"}</span>
        </div>
      ) : (
        <div className="text-red-600">Delete failed</div>
      )}
    </div>
  ) : state.running ? (
    <div className="text-muted-foreground">Deleting note...</div>
  ) : null;

  return (
    <ToolLayout
      name="delete_note"
      icon={<Trash2 className="h-4 w-4" />}
      summary={summary}
      state={state}
      output={output}
      onApprove={onApprove}
      onDeny={onDeny}
      approvalId={approvalId}
    />
  );
}
