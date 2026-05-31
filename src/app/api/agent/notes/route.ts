import { NextRequest, NextResponse } from "next/server";
import { notesAgent } from "@/lib/agent/agent";
import { generateId, type UIMessage } from "ai";

/**
 * Agent chat endpoint for the Notes Agent.
 *
 * Expects: { messages: UIMessage[] }
 * Returns: Stream of UIMessage with tool invocations and results
 *
 * Uses ToolLoopAgent to handle the full tool-calling loop server-side.
 * Client uses useChat() with this endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages }: { messages: UIMessage[] } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages must be an array" },
        { status: 400 }
      );
    }

    // Use ToolLoopAgent to generate the response
    // The agent handles tool calling automatically
    const result = await notesAgent.generate({
      messages: messages as any,
      options: { maxSteps: 10 }
    });

    // Return the final message (tool results already embedded in parts)
    const responseMessage: UIMessage = {
      id: generateId(),
      role: "assistant",
      parts: (result as any).message?.parts || [
        { type: "text", text: (result as any).text || "" }
      ],
    };

    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    console.error("Notes agent error:", error);
    return NextResponse.json(
      { error: "Agent failed to generate response" },
      { status: 500 }
    );
  }
}
