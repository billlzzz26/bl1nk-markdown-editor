"use client";

import {
  CircleX,
  Loader2,
  Minus,
  OctagonPause,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ApprovalButtons } from "./approval-buttons";
import { Button } from "@/components/ui/button";

export type ToolRenderState = {
  running: boolean;
  approvalRequested: boolean;
  denied: boolean;
  error: boolean;
  interrupted: boolean;
};

export type ToolLayoutProps = {
  name: string;
  summary?: ReactNode;
  summaryClassName?: string;
  meta?: ReactNode;
  rightAlignMeta?: boolean;
  errorMeta?: ReactNode;
  state: ToolRenderState;
  output?: ReactNode;
  children?: ReactNode;
  expandedContent?: ReactNode;
  onApprove?: (id: string) => void;
  onDeny?: (id: string, reason?: string) => void;
  defaultExpanded?: boolean;
  approvalId?: string;
  icon?: ReactNode;
  nameClassName?: string;
  className?: string;
};

const EXPANDED_CONTENT_TRANSITION_MS = 200;

function StatusIndicator({ state }: { state: ToolRenderState }) {
  if (state.interrupted) {
    return <span className="inline-block h-2 w-2 rounded-full border border-yellow-500" />;
  }

  if (state.running) {
    return <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />;
  }

  const color = state.denied
    ? "bg-red-500"
    : state.approvalRequested
    ? "bg-yellow-500"
    : state.error
    ? "bg-red-500"
    : "bg-green-500";

  return <span className={cn("inline-block h-2 w-2 rounded-full", color)} />;
}

export function ToolLayout({
  name,
  summary,
  summaryClassName,
  meta,
  rightAlignMeta = false,
  errorMeta,
  state,
  output,
  children,
  expandedContent,
  onApprove,
  onDeny,
  defaultExpanded = false,
  approvalId,
  icon,
  nameClassName,
  className,
}: ToolLayoutProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const showApproval = state.approvalRequested && approvalId;

  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    <div
      className={cn(
        "group not-prose mb-4 w-full rounded-md border",
        state.error && "border-red-500",
        state.denied && "border-orange-500",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        {/* Expand/collapse button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={toggleExpanded}
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>

        {/* Status indicator */}
        <StatusIndicator state={state} />

        {/* Tool name */}
        <span className={cn("font-mono text-sm", nameClassName)}>
          {icon} {name}
        </span>

        {/* Summary text (optional) */}
        {summary && (
          <span className={cn("ml-2 text-sm text-muted-foreground", summaryClassName)}>
            {summary}
          </span>
        )}

        {/* Meta (right-aligned) */}
        {meta && (
          <span
            className={cn("ml-auto text-sm text-muted-foreground", {
              "ml-auto": rightAlignMeta,
            })}
          >
            {meta}
          </span>
        )}

        {/* Error meta (e.g., exit code) */}
        {errorMeta && state.error && (
          <span className="ml-auto text-sm text-red-600">{errorMeta}</span>
        )}
      </div>

      {/* Approval buttons */}
      {showApproval && (
        <ApprovalButtons
          approvalId={approvalId}
          onApprove={onApprove}
          onDeny={onDeny}
        />
      )}

      {/* Output area */}
      {expanded && output && (
        <div
          className="border-t bg-muted/30 p-3 text-sm"
          style={{
            animation: `slideDown ${EXPANDED_CONTENT_TRANSITION_MS}ms ease-out`,
          }}
        >
          {output}
        </div>
      )}

      {/* Children (default output if no explicit output prop) */}
      {expanded && !output && children}
    </div>
  );
}
