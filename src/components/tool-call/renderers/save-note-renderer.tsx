"use client";

import { FileText, Save } from "lucide-react";
import type { ReactNode } from "react";
import { ToolLayout } from "../tool-layout";
import type { UIMessage } from "ai";

type ToolPart = UIMessage["parts"][number] & {
  type: "tool-save-note";
  toolName?: string;
  input?: { title?: string; content?: string; tags?: string[] };
  result?: { success?: boolean; title?: string; message?: string };
};

export function SaveNoteRenderer({
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

  // Build summary from input
  const summary: ReactNode = input?.title || "Saving note...";

  // Build output from result
  const output: ReactNode = result ? (
    <div className="space-y-2">
      {result.success ? (
        <div className="flex items-center gap-2 text-green-600">
          <Save className="h-4 w-4" />
          <span>{result.message || `Note saved: "${result.title}"`}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-600">
          <span>Failed to save note</span>
        </div>
      )}
      {input && (
        <div className="mt-2 space-y-1 border-t pt-2">
          <div>
            <span className="font-semibold">Title:</span> {input.title}
          </div>
          {input.tags && input.tags.length > 0 && (
            <div>
              <span className="font-semibold">Tags:</span>{" "}
              {input.tags.map((tag) => (
                <span
                  key={tag}
                  className="mr-1 inline-block rounded bg-secondary px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  ) : state.running ? (
    <div className="text-muted-foreground">Saving note...</div>
  ) : null;

  return (
    <ToolLayout
      name="save_note"
      icon={<FileText className="h-4 w-4" />}
      summary={summary}
      state={state}
      output={output}
      onApprove={onApprove}
      onDeny={onDeny}
      approvalId={approvalId}
    />
  );
}
