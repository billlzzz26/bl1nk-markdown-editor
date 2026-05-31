export interface ToolCallResult {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Re-export helpful AI SDK types
export type { UIMessage } from "ai";
