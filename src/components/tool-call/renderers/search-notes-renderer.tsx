"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { ToolLayout } from "../tool-layout";
import type { UIMessage } from "ai";
import { Badge } from "@/components/ui/badge";

type ToolPart = UIMessage["parts"][number] & {
  type: "tool-search-notes";
  toolName?: string;
  input?: { search?: string };
  result?: {
    success?: boolean;
    notes?: Array<{
      id: string;
      title: string;
      content: string;
      tags: string[];
      updatedAt: number;
    }>;
    count: number;
    message?: string;
  };
};

export function SearchNotesRenderer({
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

  const summary: ReactNode = `Search: "${input?.search || ""}"`;

  const output: ReactNode = result ? (
    <div className="space-y-3">
      {result.success ? (
        <>
          <div className="text-sm">
            Found <span className="font-semibold">{result.count}</span> note(s)
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
                  <div className="mt-1 line-clamp-2 text-muted-foreground">
                    {note.content.substring(0, 200)}
                    {note.content.length > 200 && "..."}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No matching notes found</div>
          )}
        </>
      ) : (
        <div className="text-red-600">Search failed</div>
      )}
    </div>
  ) : state.running ? (
    <div className="text-muted-foreground">Searching notes...</div>
  ) : null;

  return (
    <ToolLayout
      name="search_notes"
      icon={<Search className="h-4 w-4" />}
      summary={summary}
      state={state}
      output={output}
      onApprove={onApprove}
      onDeny={onDeny}
      approvalId={approvalId}
    />
  );
}
