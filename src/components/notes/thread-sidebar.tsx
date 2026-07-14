"use client";

import { X } from "lucide-react";

interface Thread {
  id: string;
  title: string;
}

interface ThreadSidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onClose?: () => void;
  isMobileOverlay?: boolean;
}

export function ThreadSidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onClose,
  isMobileOverlay,
}: ThreadSidebarProps) {
  return (
    <div className="w-full lg:w-56 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <button
          onClick={onNewThread}
          className="flex-1 px-3 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors min-h-[44px]"
        >
          New Chat
        </button>
        {isMobileOverlay && onClose && (
          <button
            onClick={onClose}
            className="ml-2 p-2 text-neutral-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {threads.length === 0 ? (
          <p className="text-neutral-400 text-sm p-2">No conversations yet</p>
        ) : (
          <ul className="space-y-1">
            {threads.map((thread) => (
              <li key={thread.id}>
                <button
                  onClick={() => onSelectThread(thread.id)}
                  className={`w-full text-left px-3 py-3 sm:py-2 rounded-md text-sm transition-colors min-h-[44px] ${
                    activeThreadId === thread.id
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <span className="truncate block">{thread.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
