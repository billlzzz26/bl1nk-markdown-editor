"use client";

import { Edit3 } from "lucide-react";
import type { ReactNode } from "react";
import { ToolLayout } from "../tool-layout";
import type { UIMessage } from "ai";
import { Badge } from "@/components/ui/badge";

type ToolPart = UIMessage["parts"][number] & {
  type: "tool-update-note";
  toolName?: string;
  input?: { id?: string; title?: string; content?: string; tags?: string[] };
  result?: { success?: boolean; id?: string; title?: string; message?: string };
};

export function UpdateNoteRenderer({
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

  const summary: ReactNode = input?.id ? `Update note ${input.id}` : "Updating note...";

  const output: ReactNode = result ? (
    <div className="space-y-2">
      {result.success ? (
        <div className="flex items-center gap-2 text-green-600">
          <Edit3 className="h-4 w-4" />
          <span>{result.message || `Note "${result.title}" updated`}</span>
        </div>
      ) : (
        <div className="text-red-600">Update failed</div>
      )}
      {input && (
        <div className="mt-2 space-y-1 border-t pt-2">
          {input.title && (
            <div>
              <span className="font-semibold">New Title:</span> {input.title}
            </div>
          )}
          {input.tags && input.tags.length > 0 && (
            <div>
              <span className="font-semibold">New Tags:</span>{" "}
              {input.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="mr-1 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  ) : state.running ? (
    <div className="text-muted-foreground">Updating note...</div>
  ) : null;

  return (
    <ToolLayout
      name="update_note"
      icon={<Edit3 className="h-4 w-4" />}
      summary={summary}
      state={state}
      output={output}
      onApprove={onApprove}
      onDeny={onDeny}
      approvalId={approvalId}
    />
  );
}
