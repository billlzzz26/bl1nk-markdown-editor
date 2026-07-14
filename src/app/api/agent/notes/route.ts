import { NextRequest, NextResponse } from "next/server";
import { generateId, type UIMessage } from "ai";

/**
 * Eve agent API proxy.
 *
 * Forwards chat messages to the eve agent's HTTP API.
 * The eve agent runs as a separate process (or deployment).
 *
 * Env:
 *   EVE_AGENT_URL — eve agent base URL (default: http://127.0.0.1:2000)
 */

const EVE_AGENT_URL = process.env.EVE_AGENT_URL || "http://127.0.0.1:2000";
const EVE_SESSION_TIMEOUT_MS = 30_000;

// In-memory session store — maps thread IDs to eve session data.
// In production, persist this in a database or use thread IDs from Convex.
const sessions = new Map<string, { sessionId: string; continuationToken: string }>();

async function callEveAgent(
  sessionId: string | null,
  message: string
): Promise<{ sessionId: string; continuationToken: string; text: string }> {
  let url: string;
  let body: Record<string, unknown>;

  if (sessionId) {
    // Continue existing session
    const session = sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    url = `${EVE_AGENT_URL}/eve/v1/session/${session.sessionId}`;
    body = { continuationToken: session.continuationToken, message };
  } else {
    // Start new session
    url = `${EVE_AGENT_URL}/eve/v1/session`;
    body = { message };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EVE_SESSION_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Eve agent error (${res.status}): ${text}`);
    }

    const data = await res.json();
    clearTimeout(timeout);

    return {
      sessionId: data.sessionId || (sessionId ?? ""),
      continuationToken: data.continuationToken || "",
      text: data.text || (data.message as string) || "",
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, threadId, sessionId: clientSessionId } = body as {
      messages: UIMessage[];
      threadId?: string;
      sessionId?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    // Get the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) {
      return NextResponse.json({ error: "No user message found" }, { status: 400 });
    }

    const userText = lastUserMsg.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("\n");

    // Look up existing session or create new one
    const sessionKey = threadId || clientSessionId || "default";
    const existingSession = sessions.get(sessionKey);
    const existingId = existingSession?.sessionId;

    // Call eve agent
    const result = await callEveAgent(existingId, userText);

    // Store session data for continuation
    if (result.continuationToken) {
      sessions.set(sessionKey, {
        sessionId: result.sessionId || existingId || result.sessionId,
        continuationToken: result.continuationToken,
      });
    }

    // Build response as UIMessage
    const responseMessage: UIMessage = {
      id: generateId(),
      role: "assistant",
      parts: [{ type: "text" as const, text: result.text || "No response" }],
    };

    return NextResponse.json({
      message: responseMessage,
      sessionId: result.sessionId || existingId || null,
    });
  } catch (error) {
    console.error("Eve agent proxy error:", error);
    // Fallback: try starting a new session if continuation failed
    try {
      const { messages } = await req.json();
      const lastUserMsg = [...(messages as UIMessage[])].reverse().find((m) => m.role === "user");
      const userText = lastUserMsg?.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("\n") || "Hello";

      const result = await callEveAgent(null, userText);
      const responseMessage: UIMessage = {
        id: generateId(),
        role: "assistant",
        parts: [{ type: "text" as const, text: result.text || "No response" }],
      };
      return NextResponse.json({ message: responseMessage, sessionId: result.sessionId || null });
    } catch (fallbackErr) {
      return NextResponse.json(
        { error: `Agent unavailable: ${error instanceof Error ? error.message : String(error)}` },
        { status: 503 }
      );
    }
  }
}
