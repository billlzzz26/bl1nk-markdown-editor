"use client";

import { useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message, MessageContent, MessageActions, MessageAction } from "@/components/ai-elements/message";
import { ToolCall } from "@/components/tool-call";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";

/**
 * Determine tool render state from a tool part.
 */
function getToolRenderState(
  part: any
): import("@/components/tool-call/tool-layout").ToolRenderState {
  const state = part.state as string | undefined;

  return {
    running: state === "input-streaming" || state === "partial-call" || state === "call",
    approvalRequested: state === "approval-requested",
    denied: state === "denied" || state === "error",
    error: state === "error",
    interrupted: false,
  };
}

export function NoteTaker() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } =
    useChat({
      transport: new DefaultChatTransport({ api: "/api/agent/notes" }),
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  const isLoading = status !== "ready";

  const getMessageText = (message: UIMessage) => {
    return message.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => (part as { text: string }).text)
      .join("\n");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="mb-2 h-12 w-12" />
            <p>Start a conversation to manage your notes</p>
            <p className="text-sm">
              Try: &quot;Save a note about meeting with team&quot; or &quot;Search for notes about Q3 goals&quot;
            </p>
          </div>
        ) : (
          messages.map((message, idx) => (
            <Message key={message.id || idx} from={message.role}>
              <MessageContent>
                {message.parts.map((part: any, partIdx: number) => {
                  // Tool invocation parts
                  if (part.type.startsWith("tool-")) {
                    const toolPart = part as any;
                    const toolName = toolPart.toolName || part.type.replace("tool-", "");
                    return (
                      <ToolCall
                        key={`${message.id}-${partIdx}`}
                        part={{
                          type: part.type,
                          toolName: toolName,
                          input: toolPart.input || toolPart.args || {},
                          ...(toolPart.output
                            ? { result: toolPart.output as Record<string, unknown> }
                            : {}),
                        }}
                        state={getToolRenderState(part)}
                      />
                    );
                  }
                  // Text content parts
                  if (part.type === "text") {
                    return <div key={partIdx}>{(part as { text: string }).text}</div>;
                  }
                  return null;
                })}
              </MessageContent>
              {message.role === "assistant" && (
                <MessageActions>
                  <MessageAction
                    tooltip="Copy"
                    label="Copy"
                    onClick={() => navigator.clipboard.writeText(getMessageText(message))}
                  >
                    Copy
                  </MessageAction>
                </MessageActions>
              )}
            </Message>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={onSubmit}
        className="flex shrink-0 gap-2 border-t p-4"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your notes or create new ones..."
          className="min-h-[44px] max-h-32 flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as any);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          className="min-h-[44px] min-w-[44px]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
