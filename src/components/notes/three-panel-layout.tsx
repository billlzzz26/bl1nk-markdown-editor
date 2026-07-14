"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FileText, PenLine, MessageSquare, Plus, Search, Menu } from "lucide-react";

type Panel = "sidebar" | "main" | "right";

interface ThreePanelLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  right: ReactNode;
  defaultPanel?: Panel;
  onNewNote?: () => void;
  onSearch?: () => void;
  onMenu?: () => void;
}

const PANELS: { id: Panel; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "sidebar", label: "Notes", icon: FileText },
  { id: "main", label: "Editor", icon: PenLine },
  { id: "right", label: "Chat", icon: MessageSquare },
];

export function ThreePanelLayout({
  sidebar,
  main,
  right,
  defaultPanel = "main",
  onNewNote,
  onSearch,
  onMenu,
}: ThreePanelLayoutProps) {
  const [active, setActive] = useState<Panel>(defaultPanel);

  return (
    <div className="flex h-full flex-col bg-neutral-950">
      {/* Top tab bar (mobile only) */}
      <nav className="flex border-b border-neutral-800 bg-neutral-900 lg:hidden">
        {PANELS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors min-h-[44px]",
              active === id
                ? "text-[color:var(--accent-teal)] border-b-2 border-[color:var(--accent-teal)]"
                : "text-neutral-400"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile: show active panel only */}
        <div className="flex h-full lg:hidden">
          {active === "sidebar" && (
            <div className="w-full h-full overflow-y-auto">{sidebar}</div>
          )}
          {active === "main" && (
            <div className="w-full h-full overflow-y-auto">{main}</div>
          )}
          {active === "right" && (
            <div className="w-full h-full overflow-y-auto">{right}</div>
          )}
        </div>

        {/* Desktop: show all 3 panels */}
        <div className="hidden lg:flex h-full">
          <div className="w-72 shrink-0 h-full overflow-y-auto border-r border-neutral-800">
            {sidebar}
          </div>
          <div className="flex-1 min-w-0 h-full overflow-y-auto">{main}</div>
          <div className="w-80 shrink-0 h-full overflow-y-auto border-l border-neutral-800">
            {right}
          </div>
        </div>
      </div>

      {/* Bottom action bar (mobile only) */}
      <nav className="flex items-center justify-around border-t border-neutral-800 bg-neutral-900 px-4 py-2 lg:hidden">
        <button
          onClick={onMenu}
          className="flex items-center justify-center size-11 rounded-xl text-neutral-400 hover:text-[color:var(--accent-teal)] transition-colors"
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </button>
        <button
          onClick={onNewNote}
          className="flex items-center justify-center size-11 rounded-xl text-neutral-400 hover:text-[color:var(--accent-teal)] transition-colors"
          aria-label="New note"
        >
          <Plus className="size-5" />
        </button>
        <button
          onClick={onSearch}
          className="flex items-center justify-center size-11 rounded-xl text-neutral-400 hover:text-[color:var(--accent-teal)] transition-colors"
          aria-label="Search"
        >
          <Search className="size-5" />
        </button>
      </nav>
    </div>
  );
}
