import { createGateway, type GatewayModelId, type LanguageModel } from "ai";

const KILO_GATEWAY_BASE_URL =
  process.env.KILO_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_KILO_GATEWAY_URL ||
  "https://api.kilo.ai/v1";

const KILO_API_KEY =
  process.env.KILO_API_KEY || process.env.NEXT_PUBLIC_KILO_API_KEY || "";

/**
 * Kilo AI Gateway provider.
 * Uses the AI SDK's gateway abstraction to route model calls through
 * the Kilo Gateway.
 *
 * Model ID format: "provider/model-name"
 * Example: "anthropic/claude-sonnet-4", "openai/gpt-4.1"
 */
export const agentGateway = createGateway({
  baseURL: `${KILO_GATEWAY_BASE_URL}/v1`,
  headers: {
    Authorization: `Bearer ${KILO_API_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Default model for notes agent.
 * Prioritizes Kilo auto-balanced model (which maps to a good default),
 * falls back to Claude Sonnet.
 */
export const defaultModelLabel: GatewayModelId =
  (process.env.AGENT_MODEL as GatewayModelId) || "anthropic/claude-sonnet-4";

export const defaultModel: LanguageModel = agentGateway(defaultModelLabel);

/**
 * Get a model by ID using the agent gateway.
 */
export function getModel(id: GatewayModelId): LanguageModel {
  return agentGateway(id);
}
