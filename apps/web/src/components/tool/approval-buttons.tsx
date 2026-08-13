import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ApprovalButtonsProps = {
  approvalId: string;
  onApprove?: (id: string) => void;
  onDeny?: (id: string, reason?: string) => void;
  className?: string;
};

/**
 * Approval buttons for tool calls requiring user confirmation.
 * Minimal styling matching the open-agent pattern with green/red borders.
 */
export function ApprovalButtons({
  approvalId,
  onApprove,
  onDeny,
  className,
}: ApprovalButtonsProps) {
  return (
    <div className={cn("mt-3 flex items-center gap-2 pl-5", className)}>
      <Button
        size="sm"
        variant="outline"
        className="h-7 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
        onClick={() => onApprove?.(approvalId)}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
        onClick={() => onDeny?.(approvalId)}
      >
        Deny
      </Button>
    </div>
  );
}
