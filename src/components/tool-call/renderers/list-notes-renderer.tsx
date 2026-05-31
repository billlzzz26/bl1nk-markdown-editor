"use client";

import { ListTodo } from "lucide-react";
import type { ReactNode } from "react";
import { ToolLayout } from "../tool-layout";
import type { UIMessage } from "ai";
import { Badge } from "@/components/ui/badge";

type ToolPart = UIMessage["parts"][number] & {
  type: "tool-list-notes";
  toolName?: string;
  result?: {
    success?: boolean;
    notes?: Array<{
      id: string;
      title: string;
      tags: string[];
      createdAt: number;
      updatedAt: number;
    }>;
    count: number;
    message?: string;
  };
};

export function ListNotesRenderer({
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
  const { result } = part;

  const summary: ReactNode = `List all notes`;

  const output: ReactNode = result ? (
    <div className="space-y-3">
      {result.success ? (
        <>
          <div className="text-sm">
            You have <span className="font-semibold">{result.count}</span> note(s)
          </div>
          {result.notes && result.notes.length > 0 ? (
            <div className="space-y-2">
              {result.notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded border p-3 text-sm hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{note.title}</span>
                    <div className="flex gap-1">
                      {note.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Updated: {new Date(note.updatedAt * 1000).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No notes yet — create your first note!</div>
          )}
        </>
      ) : (
        <div className="text-red-600">Failed to list notes</div>
      )}
    </div>
  ) : state.running ? (
    <div className="text-muted-foreground">Loading notes...</div>
  ) : null;

  return (
    <ToolLayout
      name="list_notes"
      icon={<ListTodo className="h-4 w-4" />}
      summary={summary}
      state={state}
      output={output}
      onApprove={onApprove}
      onDeny={onDeny}
      approvalId={approvalId}
    />
  );
}
