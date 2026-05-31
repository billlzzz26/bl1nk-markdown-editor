import { stepCountIs, ToolLoopAgent, zodSchema, type ToolSet } from "ai";
import { z } from "zod";
import { addCacheControl } from "./context-management";
import { defaultModel } from "./models";
import { buildSystemPrompt } from "./system-prompt";
import { tools } from "./tools";

export type AgentOptions = z.infer<typeof agentOptionsSchema>;

const agentOptionsSchema = z.object({
  customInstructions: z.string().optional(),
  maxSteps: z.number().min(1).max(20).default(10),
});

/**
 * Notes Agent using ToolLoopAgent from the AI SDK.
 * Handles note CRUD operations through tool calls in a loop.
 *
 * Pattern: open-agent's ToolLoopAgent with cache control + configurable steps
 */
export const notesAgent = new ToolLoopAgent<AgentOptions, ToolSet>({
  model: defaultModel,
  instructions: buildSystemPrompt(),
  tools,
  stopWhen: stepCountIs(10),
  callOptionsSchema: zodSchema(agentOptionsSchema),
  prepareStep: ({ messages, model }) => ({
    messages: addCacheControl(messages as any, (model as any).modelId || ""),
  }),
  prepareCall: ({ options, ...settings }) => ({
    ...settings,
    maxSteps: options?.maxSteps,
    ...(options?.customInstructions
      ? { additionalInstructions: options.customInstructions }
      : {}),
  }),
});

export type NotesAgent = typeof notesAgent;
