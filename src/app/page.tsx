"use client";

import { useEffect, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { NotesList, type Note } from "@/components/ui/note-editor";
import { NoteEditorInline } from "@/components/ui/note-editor-inline";
import { ThreePanelLayout } from "./components/three-panel-layout";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message, MessageContent, MessageActions, MessageAction } from "@/components/ai-elements/message";
import { ToolCall } from "@/components/tool-call";
import { generateId, type UIMessage } from "ai";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listNotes", args: {} }),
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSaveNote = async (data: Partial<Note>) => {
    const action = data._id ? "updateNote" : "saveNote";
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, args: data }),
      });
      if (response.ok) {
        await fetchNotes();
      }
    } catch (error) {
      console.error("Save note error:", error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteNote", args: { id } }),
      });
      if (response.ok) {
        await fetchNotes();
        if (activeNote?._id === id) setActiveNote(null);
      }
    } catch (error) {
      console.error("Delete note error:", error);
    }
  };

  const handleSendMessage = async (rawMessage?: string) => {
    const userMessage = (rawMessage ?? input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setIsLoading(true);

    // Add user message
    const userMsg: UIMessage = { 
      id: generateId(), 
      role: 'user', 
      parts: [{ type: 'text', text: userMessage }]
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Prepare all messages in UIMessage format
      const allMessages: UIMessage[] = [...messages, userMsg];

      // Call agent API
      const response = await fetch('/api/agent/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!response.ok) {
        throw new Error('Agent request failed');
      }

      const data = await response.json();
      const assistantMsg: UIMessage = data.message;

      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh notes if any tool calls were made
      if (assistantMsg.parts.some(p => p.type.startsWith('tool-'))) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { 
          id: generateId(),
          role: 'assistant', 
          parts: [{ type: 'text', text: 'Sorry, I encountered an error.' }]
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageText = (message: UIMessage) => {
    return message.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => (part as { text: string }).text)
      .join("\n");
  };

  // Left panel: Notes list
  const notesSidebar = (
    <div className="flex h-full flex-col bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-800 p-3">
        <h2 className="text-sm font-semibold text-white">Notes</h2>
        <Button
          size="sm"
          onClick={() => setActiveNote(null)}
          className="gap-1 bg-[color:var(--accent-teal)] text-black hover:bg-[color:var(--accent-teal-dim)]"
        >
          <Plus className="size-3.5" />
          New
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <NotesList
          notes={notes}
          onEdit={(note) => setActiveNote(note)}
          onDelete={handleDeleteNote}
        />
      </div>
    </div>
  );

  // Center panel: Editor
  const editorPanel = (
    <NoteEditorInline
      note={activeNote}
      onSave={handleSaveNote}
    />
  );

  // Right panel: Chat
  const chatPanel = (
    <div className="flex h-full flex-col bg-neutral-950">
      <Conversation className="flex-1">
        <ConversationContent className="px-3 py-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              className="min-h-[40vh]"
              description="Ask me to remember something"
              title="Chat"
            >
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-semibold text-white">Chat</h3>
                <p className="text-xs text-neutral-400">
                  Ask me to remember something, and I&apos;ll save it for you.
                </p>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message, index) => (
              <Message key={message.id || index} from={message.role}>
                <MessageContent>
                  {message.parts.map((part: any, partIdx) => {
                    if (part.type.startsWith("tool-")) {
                      const toolPart = part as any;
                      const toolName = toolPart.toolName || part.type.replace("tool-", "");
                      return (
                        <ToolCall
                          key={`${message.id || index}-${partIdx}`}
                          part={{
                            type: part.type as any,
                            toolName: toolName,
                            input: toolPart.input || toolPart.args || {},
                            ...(toolPart.output
                              ? { result: toolPart.output as Record<string, unknown> }
                              : {}),
                          }}
                          state={{
                            running: toolPart.state === "call" || toolPart.state === "partial-call" || toolPart.state === "input-streaming",
                            approvalRequested: toolPart.state === "approval-requested",
                            denied: toolPart.state === "denied" || toolPart.state === "error",
                            error: toolPart.state === "error",
                            interrupted: false,
                          }}
                        />
                      );
                    }
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
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-neutral-400 px-3 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--accent-teal)]" />
              Thinking...
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-neutral-800 p-2">
        <PromptInput
          onSubmit={({ text }) => handleSendMessage(text)}
        >
          <PromptInputTextarea
            className="min-h-[44px] border-0 bg-transparent px-3 py-2 text-sm text-white placeholder:text-neutral-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            disabled={isLoading}
          />
          <div className="flex items-center justify-end border-t border-white/8 px-3 py-1.5">
            <PromptInputSubmit
              className="rounded-full bg-[color:var(--accent-teal)] text-black hover:bg-[color:var(--accent-teal-dim)]"
              disabled={!isLoading && !input.trim()}
              status={isLoading ? "submitted" : "ready"}
            />
          </div>
        </PromptInput>
      </div>
    </div>
  );

  return (
    <div className="h-screen">
      <ThreePanelLayout
        sidebar={notesSidebar}
        main={editorPanel}
        right={chatPanel}
        defaultPanel="main"
        onNewNote={() => setActiveNote(null)}
        onSearch={() => {}}
        onMenu={() => {}}
      />
    </div>
  );
}
