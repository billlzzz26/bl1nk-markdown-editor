import type { ModelMessage, SystemModelMessage } from "ai";

/**
 * Internal message type for agent processing.
 * Matches the AI SDK Message shape used by ToolLoopAgent.
 */
export type AgentMessage = ModelMessage;

/**
 * Add cache-control headers to messages for Anthropic models.
 * This enables the 90% cost savings on repeated requests by caching
 * the system prompt and other repeated content.
 *
 * Based on open-agent's context-management pattern:
 * packages/agent/context-management/cache-control.ts
 */
export function addCacheControl(
  messages: AgentMessage[],
  modelId: string
): AgentMessage[] {
  // Only apply to Anthropic models
  if (!modelId.toLowerCase().includes("anthropic")) {
    return messages;
  }

  const isAdaptiveThinking = modelId.includes("4.6") || modelId.includes("4.7");

  // Add header to system message
  const withCacheControl = messages.map((msg) => {
    if (msg.role === "system") {
      const systemMsg = msg as SystemModelMessage;
      const headers: Record<string, string> = { ...((systemMsg as any).headers || {}) };
      if (isAdaptiveThinking) {
        headers["anthropic-beta"] = "max-tokens-3-5-sonnet-2024-07-15";
      }
      return {
        ...systemMsg,
        headers,
      } as AgentMessage;
    }
    return msg;
  });

  return withCacheControl;
}
