"use client";

interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
}

interface NoteToolRenderersProps {
  toolCalls: ToolCall[];
}

export function NoteToolRenderers({ toolCalls }: NoteToolRenderersProps) {
  if (toolCalls.length === 0) return null;

  const getIcon = (toolName: string) => {
    switch (toolName) {
      case "save_note":
        return "💾";
      case "search_notes":
        return "🔍";
      case "list_notes":
        return "📋";
      case "get_notes_by_tag":
        return "🏷️";
      case "update_note":
        return "✏️";
      case "delete_note":
        return "🗑️";
      default:
        return "🔧";
    }
  };

  const getResultMessage = (toolName: string, result: unknown) => {
    if (typeof result === "string") return result;

    const r = result as { message?: string; notes?: unknown[]; count?: number };
    if (r.message) return r.message;

    const count =
      typeof r.count === "number"
        ? r.count
        : Array.isArray(r.notes)
          ? r.notes.length
          : undefined;

    if (typeof count === "number") {
      return count === 1 ? "1 note found" : `${count} notes found`;
    }

    return toolName === "delete_note" ? "Note deleted" : "Operation completed";
  };

  return (
    <div className="flex flex-col gap-2 my-2">
      {toolCalls.map((tc, index) => (
        <div
          key={index}
          className="bg-neutral-800 rounded-lg p-3 flex items-start gap-3"
        >
          <span className="sm:text-lg">{getIcon(tc.toolName)}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {tc.toolName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {getResultMessage(tc.toolName, tc.result)}
            </p>
            <details className="mt-3 rounded-xl border border-white/8 bg-black/30">
              <summary className="cursor-pointer px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                View payload
              </summary>
              <div className="space-y-3 border-t border-white/8 p-3">
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                    Arguments
                  </p>
                  <pre className="overflow-x-auto rounded-xl border border-white/8 bg-black/40 p-3 text-xs leading-6 text-neutral-300">
                    <code>{JSON.stringify(tc.args, null, 2)}</code>
                  </pre>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                    Result
                  </p>
                  <pre className="overflow-x-auto rounded-xl border border-white/8 bg-black/40 p-3 text-xs leading-6 text-neutral-300">
                    <code>{JSON.stringify(tc.result, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </details>
          </div>
        </div>
      ))}
    </div>
  );
}
