"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Bold,
  Check,
  CheckCheck,
  CloudOff,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  PanelRight,
  PencilLine,
  Plus,
  Quote,
  Search,
  Split,
  Table2,
  Tag,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { MonacoEditor } from "./monaco-editor";

export interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  contentFormat?: string;
  contentVersion?: number;
  lastSyncedAt?: number;
  updatedByClientId?: string;
}

interface NoteEditorProps {
  note?: Note;
  onSave: (note: Partial<Note>) => void;
  onDelete?: (id: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type EditorMode = "write" | "preview" | "split";
type SyncState = "saved" | "draft" | "saving" | "sync_error";

const AVAILABLE_TAGS = [
  "Work",
  "Personal",
  "Project",
  "Meeting",
  "Idea",
  "Todo",
  "High",
  "Medium",
  "Low",
];

const MARKDOWN_SHORTCUTS = [
  { label: "Bold", hint: "Ctrl/Cmd + B" },
  { label: "Italic", hint: "Ctrl/Cmd + I" },
  { label: "Link", hint: "Ctrl/Cmd + K" },
  { label: "Save", hint: "Ctrl/Cmd + S" },
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderInlineMarkdown(input: string) {
  let output = escapeHtml(input);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  output = output.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, label, url) => {
      const safeUrl = String(url)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
      return `<a href="${safeUrl}" target="_blank" rel="noreferrer">${label}</a>`;
    }
  );
  return output;
}

function renderMarkdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let index = 0;
  let inCodeBlock = false;
  let codeFence = "";
  let codeLines: string[] = [];

  const flushParagraph = (paragraphLines: string[]) => {
    if (!paragraphLines.length) return;
    html.push(`<p>${renderInlineMarkdown(paragraphLines.join(" "))}</p>`);
  };

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trimEnd();

    if (inCodeBlock) {
      if (line.startsWith("```")) {
        const language = codeFence.trim();
        html.push(
          `<pre data-language="${escapeHtml(language)}"><code>${escapeHtml(
            codeLines.join("\n")
          )}</code></pre>`
        );
        inCodeBlock = false;
        codeFence = "";
        codeLines = [];
      } else {
        codeLines.push(rawLine);
      }
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      inCodeBlock = true;
      codeFence = line.slice(3);
      index += 1;
      continue;
    }

    if (!line.trim()) {
      html.push("");
      index += 1;
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = Math.min(line.match(/^#+/)?.[0].length ?? 1, 3);
      const content = line.replace(/^#{1,3}\s+/, "");
      html.push(`<h${level}>${renderInlineMarkdown(content)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^---+$/.test(line) || /^\*\*\*+$/.test(line)) {
      html.push("<hr />");
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      html.push(`<blockquote>${quoteLines.map(renderInlineMarkdown).join("<br />")}</blockquote>`);
      continue;
    }

    if (/^- \[[ xX]\]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^- \[[ xX]\]\s+/.test(lines[index].trim())) {
        const taskLine = lines[index].trim();
        const checked = /^- \[[xX]\]\s+/.test(taskLine);
        const content = taskLine.replace(/^- \[[ xX]\]\s+/, "");
        items.push(
          `<li data-task="true"><input type="checkbox" ${
            checked ? "checked" : ""
          } disabled /><span>${renderInlineMarkdown(content)}</span></li>`
        );
        index += 1;
      }
      html.push(`<ul class="task-list">${items.join("")}</ul>`);
      continue;
    }

    if (/^- /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^- /.test(lines[index].trim())) {
        items.push(
          `<li>${renderInlineMarkdown(lines[index].trim().replace(/^- /, ""))}</li>`
        );
        index += 1;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index].trim())) {
        items.push(
          `<li>${renderInlineMarkdown(
            lines[index].trim().replace(/^\d+\.\s/, "")
          )}</li>`
        );
        index += 1;
      }
      html.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (
      line.includes("|") &&
      index + 1 < lines.length &&
      /^\s*\|?[-: ]+\|[-|: ]+\s*$/.test(lines[index + 1])
    ) {
      const headerCells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      index += 2;
      const bodyRows: string[] = [];
      while (index < lines.length && lines[index].includes("|")) {
        const row = lines[index]
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);
        bodyRows.push(
          `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join("")}</tr>`
        );
        index += 1;
      }
      html.push(
        `<div class="table-wrap"><table><thead><tr>${headerCells
          .map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`)
          .join("")}</tr></thead><tbody>${bodyRows.join("")}</tbody></table></div>`
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("```") &&
      !/^#{1,3}\s/.test(lines[index].trim()) &&
      !/^>\s?/.test(lines[index].trim()) &&
      !/^- /.test(lines[index].trim()) &&
      !/^\d+\.\s/.test(lines[index].trim()) &&
      !/^---+$/.test(lines[index].trim()) &&
      !/^\*\*\*+$/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    flushParagraph(paragraphLines);
  }

  return html.filter(Boolean).join("\n");
}

function getSelectionRange(
  textarea: HTMLTextAreaElement | null,
  value: string
) {
  if (!textarea) {
    return { start: value.length, end: value.length, selected: "" };
  }

  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  return { start, end, selected: value.slice(start, end) };
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^- \[[ xX]\]\s+/gm, "")
    .replace(/^- /gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createNoteSnippet(markdown: string) {
  const plain = stripMarkdown(markdown);
  if (plain.length <= 160) return plain || "No content yet";
  return `${plain.slice(0, 157).trim()}...`;
}

function detectNoteFeatures(markdown: string) {
  return {
    hasCode: /```/.test(markdown),
    hasTable: /\|/.test(markdown) && /\n.*\|.*\n/.test(markdown),
    hasTasks: /- \[[ xX]\]/.test(markdown),
  };
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function SyncStatusChip({ state }: { state: SyncState }) {
  const configs: Record<SyncState, { icon: any; label: string; className: string; animate?: boolean }> = {
    draft: {
      icon: PencilLine,
      label: "Unsaved draft",
      className:
        "border-[color:var(--aurora-yellow)]/35 bg-[color:var(--aurora-yellow)]/10 text-[color:var(--aurora-yellow)]",
    },
    saved: {
      icon: CheckCheck,
      label: "Saved",
      className:
        "border-[color:var(--aurora-lime)]/30 bg-[color:var(--aurora-lime)]/10 text-[color:var(--aurora-lime)]",
    },
    saving: {
      icon: Loader2,
      label: "Saving...",
      className:
        "border-[color:var(--accent-teal)]/30 bg-[color:var(--accent-teal)]/10 text-[color:var(--accent-teal)]",
      animate: true,
    },
    sync_error: {
      icon: CloudOff,
      label: "Sync error",
      className:
        "border-[color:var(--aurora-red)]/35 bg-[color:var(--aurora-red)]/10 text-[color:var(--aurora-red)]",
    },
  };

  const config = configs[state];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.08em] uppercase",
        config.className
      )}
    >
      <Icon className={cn("size-3.5", config.animate && "animate-spin")} />
      <span>{config.label}</span>
    </div>
  );
}

function ToolbarButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] border border-transparent text-[color:var(--warm-grey-light)] hover:border-[color:var(--glass-border)] hover:bg-[color:var(--glass)] hover:text-[color:var(--accent-teal)]"
    >
      <Icon className="size-4" />
    </Button>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  const html = React.useMemo(() => renderMarkdownToHtml(content), [content]);

  return (
    <div
      className="markdown-preview min-h-[24rem] rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--black-primary)]/80 p-5"
      // SAFETY: HTML is generated by renderMarkdownToHtml which escapes all user
      // text via escapeHtml(). Links are restricted to https?:// protocols only.
      dangerouslySetInnerHTML={{
        __html:
          html ||
          "<p class='empty'>Preview your Markdown here as you write.</p>",
      }}
    />
  );
}

export function NoteEditorDialog({
  note,
  onSave,
  onDelete,
  isOpen,
  onOpenChange,
}: NoteEditorProps) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [syncStatus, setSyncStatus] = React.useState<SyncState>("saved");
  const [newTag, setNewTag] = React.useState("");
  const [showTagInput, setShowTagInput] = React.useState(false);
  const [editorMode, setEditorMode] = React.useState<EditorMode>("split");
  const [advancedEditor, setAdvancedEditor] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const monacoRef = React.useRef<any>(null);

  // Load note or draft when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      const draftKey = `note-draft-${note?._id || "new"}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        try {
          const { title: dTitle, content: dContent, tags: dTags } = JSON.parse(savedDraft);
          setTitle(dTitle);
          setContent(dContent);
          setTags(dTags);
        } catch (e) {
          console.error("Failed to parse draft", e);
          if (note) {
            setTitle(note.title);
            setContent(note.content);
            setTags(note.tags);
          }
        }
      } else if (note) {
        setTitle(note.title);
        setContent(note.content);
        setTags(note.tags);
      } else {
        setTitle("");
        setContent("");
        setTags([]);
      }
      setEditorMode("split");
      setShowTagInput(false);
      setNewTag("");
      setSyncStatus("saved");
    }
  }, [note, isOpen]);

  // Debounced autosave and draft persistence
  React.useEffect(() => {
    if (!isOpen) return;

    const hasChanges =
      title !== (note?.title || "") ||
      content !== (note?.content || "") ||
      JSON.stringify(tags) !== JSON.stringify(note?.tags || []);

    if (hasChanges) {
      setSyncStatus("draft");
      
      const draftKey = `note-draft-${note?._id || "new"}`;
      localStorage.setItem(draftKey, JSON.stringify({ title, content, tags }));

      const timer = setTimeout(async () => {
        if (!title.trim()) return;
        
        setSyncStatus("saving");
        try {
          await onSave({
            _id: note?._id,
            title: title.trim(),
            content: content.trim(),
            tags,
            updatedAt: Date.now(),
          });
          setSyncStatus("saved");
          // We don't remove the draft immediately to avoid flickering if the user
          // continues typing, but the current state is now "saved" relative to the server.
          // However, the draft on disk is now identical to the server.
        } catch (error) {
          console.error("Autosave failed:", error);
          setSyncStatus("sync_error");
        }
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setSyncStatus("saved");
      // If there are no changes, we can safely remove the draft
      const draftKey = `note-draft-${note?._id || "new"}`;
      localStorage.removeItem(draftKey);
    }
  }, [title, content, tags, note?._id, note?.title, note?.content, note?.tags, onSave, isOpen]);

  const isEditing = !!note;
  const noteFeatures = React.useMemo(() => detectNoteFeatures(content), [content]);

  const applyToSelection = React.useCallback(
    (prefix: string, suffix = prefix, placeholder = "text") => {
      if (advancedEditor && monacoRef.current) {
        const editor = monacoRef.current;
        const selection = editor.getSelection();
        const model = editor.getModel();
        const selectedText = model.getValueInRange(selection);
        const text = selectedText || placeholder;
        
        editor.executeEdits("toolbar", [{
          range: selection,
          text: prefix + text + suffix,
          forceMoveMarkers: true,
        }]);
        
        if (!selectedText) {
          const newStart = selection.startColumn + prefix.length;
          editor.setSelection({
            startLineNumber: selection.startLineNumber,
            startColumn: newStart,
            endLineNumber: selection.endLineNumber,
            endColumn: newStart + text.length
          });
        }
        editor.focus();
        return;
      }

      const textarea = textareaRef.current;
      const { start, end, selected } = getSelectionRange(textarea, content);
      const value = selected || placeholder;
      const nextContent =
        content.slice(0, start) + prefix + value + suffix + content.slice(end);
      setContent(nextContent);

      requestAnimationFrame(() => {
        textarea?.focus();
        if (!textarea) return;
        const selectionStart = start + prefix.length;
        const selectionEnd = selectionStart + value.length;
        textarea.setSelectionRange(selectionStart, selectionEnd);
      });
    },
    [content, advancedEditor]
  );

  const applyLinePrefix = React.useCallback(
    (prefix: string) => {
      if (advancedEditor && monacoRef.current) {
        const editor = monacoRef.current;
        const selection = editor.getSelection();
        const model = editor.getModel();
        
        const edits: any[] = [];
        for (let i = selection.startLineNumber; i <= selection.endLineNumber; i++) {
          edits.push({
            range: { startLineNumber: i, startColumn: 1, endLineNumber: i, endColumn: 1 },
            text: prefix,
          });
        }
        editor.executeEdits("toolbar", edits);
        editor.focus();
        return;
      }

      const textarea = textareaRef.current;
      const { start, end } = getSelectionRange(textarea, content);
      const blockStart = content.lastIndexOf("\n", start - 1) + 1;
      const blockEnd = content.indexOf("\n", end);
      const safeBlockEnd = blockEnd === -1 ? content.length : blockEnd;
      const block = content.slice(blockStart, safeBlockEnd);
      const nextBlock = block
        .split("\n")
        .map((line) => `${prefix}${line}`)
        .join("\n");
      const nextContent =
        content.slice(0, blockStart) + nextBlock + content.slice(safeBlockEnd);
      setContent(nextContent);
      requestAnimationFrame(() => textarea?.focus());
    },
    [content, advancedEditor]
  );

  const insertTable = React.useCallback(() => {
    const table = "\n| Column | Column |\n| --- | --- |\n| Value | Value |\n";
    if (advancedEditor && monacoRef.current) {
      const editor = monacoRef.current;
      const selection = editor.getSelection();
      editor.executeEdits("toolbar", [{
        range: selection,
        text: table,
        forceMoveMarkers: true,
      }]);
      editor.focus();
      return;
    }

    const textarea = textareaRef.current;
    const { start, end } = getSelectionRange(textarea, content);
    const nextContent = content.slice(0, start) + table + content.slice(end);
    setContent(nextContent);
    requestAnimationFrame(() => textarea?.focus());
  }, [content, advancedEditor]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      _id: note?._id,
      title: title.trim(),
      content: content.trim(),
      tags,
      updatedAt: Date.now(),
    });
  };

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags([...tags, normalizedTag]);
    }
    setNewTag("");
    setShowTagInput(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const metadataItems = [
    { label: "Last edited", value: note ? formatDate(note.updatedAt) : "Not saved yet" },
    { label: "Words", value: String(stripMarkdown(content).split(/\s+/).filter(Boolean).length) },
    { label: "Characters", value: String(content.length) },
    { label: "Markdown", value: "GitHub-first" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton
        className="max-w-[min(96vw,1200px)] gap-0 overflow-hidden border-[color:var(--glass-border)] bg-[color:var(--black-secondary)] p-0 text-[color:var(--platinum)] shadow-2xl shadow-black/40"
      >
        <DialogHeader className="border-b border-[color:var(--glass-border)] bg-[color:var(--black-primary)] px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--warm-grey)]">
                <span className="rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass)] px-2 py-1">
                  Markdown Workspace
                </span>
                {isEditing ? <span>Edit note</span> : <span>Create note</span>}
              </div>
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="min-w-0 flex-1">
                  <label htmlFor="note-title" className="sr-only">
                    Note title
                  </label>
                  <Input
                    id="note-title"
                    placeholder="Untitled note"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    autoFocus
                    className="h-12 border-none bg-transparent px-0 text-2xl font-semibold tracking-[-0.02em] text-[color:var(--platinum)] placeholder:text-[color:var(--warm-grey)] focus-visible:ring-0"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SyncStatusChip state={syncStatus} />
                  <div className="inline-flex items-center gap-1 rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass)] px-3 py-1 text-xs text-[color:var(--warm-grey-light)]">
                    <Eye className="size-3.5 text-[color:var(--accent-teal)]" />
                    Auto-save active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="grid min-h-[72vh] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 flex-col">
            <div className="border-b border-[color:var(--glass-border)] bg-[color:var(--black-secondary)] px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-1">
                    <ToolbarButton label="Heading 1" icon={Heading1} onClick={() => applyLinePrefix("# ")} />
                    <ToolbarButton label="Heading 2" icon={Heading2} onClick={() => applyLinePrefix("## ")} />
                    <ToolbarButton label="Heading 3" icon={Heading3} onClick={() => applyLinePrefix("### ")} />
                    <ToolbarButton label="Quote" icon={Quote} onClick={() => applyLinePrefix("> ")} />
                    <ToolbarButton
                      label="Code block"
                      icon={Code2}
                      onClick={() => applyToSelection("\n```ts\n", "\n```\n", "const note = true;")}
                    />
                  </div>

                  <div className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-1">
                    <ToolbarButton label="Bold" icon={Bold} onClick={() => applyToSelection("**", "**", "strong")} />
                    <ToolbarButton label="Italic" icon={Italic} onClick={() => applyToSelection("*", "*", "emphasis")} />
                    <ToolbarButton
                      label="Link"
                      icon={Link2}
                      onClick={() => applyToSelection("[", "](https://example.com)", "label")}
                    />
                    <ToolbarButton label="Bullet list" icon={List} onClick={() => applyLinePrefix("- ")} />
                    <ToolbarButton label="Ordered list" icon={ListOrdered} onClick={() => applyLinePrefix("1. ")} />
                    <ToolbarButton label="Task list" icon={ListChecks} onClick={() => applyLinePrefix("- [ ] ")} />
                    <ToolbarButton label="Table" icon={Table2} onClick={insertTable} />
                  </div>
                </div>

                <div className="inline-flex w-full items-center gap-1 rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-1 lg:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditorMode("write")}
                    className={cn(
                      "flex-1 text-[color:var(--warm-grey-light)] hover:text-[color:var(--platinum)] lg:flex-none",
                      editorMode === "write" &&
                        "border border-[color:var(--glass-border)] bg-[color:var(--black-tertiary)] text-[color:var(--accent-teal)]"
                    )}
                  >
                    <PencilLine className="size-4" />
                    Write
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditorMode("preview")}
                    className={cn(
                      "flex-1 text-[color:var(--warm-grey-light)] hover:text-[color:var(--platinum)] lg:flex-none",
                      editorMode === "preview" &&
                        "border border-[color:var(--glass-border)] bg-[color:var(--black-tertiary)] text-[color:var(--accent-teal)]"
                    )}
                  >
                    <Eye className="size-4" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditorMode("split")}
                    className={cn(
                      "flex-1 text-[color:var(--warm-grey-light)] hover:text-[color:var(--platinum)] lg:flex-none",
                      editorMode === "split" &&
                        "border border-[color:var(--glass-border)] bg-[color:var(--black-tertiary)] text-[color:var(--accent-teal)]"
                    )}
                  >
                    <Split className="size-4" />
                    Split
                  </Button>
                </div>

                <div className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAdvancedEditor(!advancedEditor)}
                    className={cn(
                      "text-[color:var(--warm-grey-light)] hover:text-[color:var(--platinum)]",
                      advancedEditor &&
                        "border border-[color:var(--glass-border)] bg-[color:var(--black-tertiary)] text-[color:var(--accent-teal)]"
                    )}
                    title={advancedEditor ? "Switch to Basic Editor" : "Switch to Advanced Editor (Monaco)"}
                  >
                    <Code2 className="size-4" />
                    <span className="ml-1 hidden sm:inline">{advancedEditor ? "Rich" : "Basic"}</span>
                  </Button>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "grid min-h-0 flex-1 gap-0",
                editorMode === "split" ? "lg:grid-cols-2" : "grid-cols-1"
              )}
            >
              {editorMode !== "preview" && (
                <div className="min-w-0 border-b border-[color:var(--glass-border)] p-4 lg:border-r lg:border-b-0">
                  <label htmlFor="note-content" className="sr-only">
                    Markdown content
                  </label>
                  {advancedEditor ? (
                    <div className="h-[26rem] rounded-md border border-[color:var(--glass-border)] overflow-hidden">
                      <MonacoEditor
                        value={content}
                        onChange={(val) => setContent(val || "")}
                        language="markdown"
                        onMount={(editor) => {
                          monacoRef.current = editor;
                        }}
                      />
                    </div>
                  ) : (
                    <Textarea
                      id="note-content"
                      ref={textareaRef}
                      placeholder="Write in Markdown. Use the toolbar to format quickly."
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      className="min-h-[26rem] resize-none border-[color:var(--glass-border)] bg-[color:var(--black-primary)]/80 px-5 py-4 font-[450] leading-7 text-[color:var(--platinum)] placeholder:text-[color:var(--warm-grey)] focus-visible:border-[color:var(--accent-teal-dim)] focus-visible:ring-[color:var(--accent-teal-dim)]/30"
                    />
                  )}
                </div>
              )}

              {editorMode !== "write" && (
                <div className="min-w-0 p-4">
                  <MarkdownPreview content={content} />
                </div>
              )}
            </div>

            <div className="border-t border-[color:var(--glass-border)] bg-[color:var(--black-primary)]/80 px-4 py-3 text-xs text-[color:var(--warm-grey)]">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {MARKDOWN_SHORTCUTS.map((shortcut) => (
                    <span
                      key={shortcut.label}
                      className="rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass)] px-2.5 py-1"
                    >
                      {shortcut.label}: {shortcut.hint}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span>{stripMarkdown(content).split(/\s+/).filter(Boolean).length} words</span>
                  <span aria-hidden="true">•</span>
                  <span>{content.length} characters</span>
                </div>
              </div>
            </div>
          </div>

          <aside className="border-t border-[color:var(--glass-border)] bg-[color:var(--black-primary)]/90 xl:border-t-0 xl:border-l">
            <div className="flex items-center justify-between border-b border-[color:var(--glass-border)] px-4 py-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--warm-grey)]">
                  Note Metadata
                </p>
                <p className="mt-1 text-sm text-[color:var(--warm-grey-light)]">
                  Keep structure and sync context visible while writing.
                </p>
              </div>
              <PanelRight className="size-4 text-[color:var(--accent-teal)]" />
            </div>
            <ScrollArea className="h-[320px] xl:h-[calc(72vh-4.5rem)]">
              <div className="space-y-5 p-4">
                <section className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--warm-grey)]">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 border border-[color:var(--glass-border)] bg-[color:var(--glass)] text-[color:var(--platinum)]"
                      >
                        {tag}
                        <button
                          type="button"
                          aria-label={`Remove ${tag} tag`}
                          onClick={() => removeTag(tag)}
                          className="text-[color:var(--warm-grey-light)] transition-colors hover:text-[color:var(--aurora-red)]"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                    {showTagInput ? (
                      <div className="flex items-center gap-1">
                        <Input
                          placeholder="Add tag..."
                          value={newTag}
                          onChange={(event) => setNewTag(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addTag(newTag);
                            }
                            if (event.key === "Escape") {
                              setShowTagInput(false);
                              setNewTag("");
                            }
                          }}
                          className="h-8 w-28 border-[color:var(--glass-border)] bg-[color:var(--black-tertiary)] text-[color:var(--platinum)]"
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => addTag(newTag)}
                          className="min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] text-[color:var(--accent-teal)] hover:bg-[color:var(--glass)]"
                        >
                          <Check className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTagInput(true)}
                        className="border-[color:var(--glass-border)] bg-[color:var(--glass)] text-[color:var(--warm-grey-light)] hover:bg-[color:var(--black-tertiary)] hover:text-[color:var(--platinum)]"
                      >
                        <Plus className="size-3.5" />
                        Add tag
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.filter((tag) => !tags.includes(tag)).map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="rounded-full border border-[color:var(--glass-border)] px-2 py-1 text-[11px] text-[color:var(--warm-grey-light)] transition-colors hover:border-[color:var(--accent-teal-dim)] hover:text-[color:var(--accent-teal)]"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--warm-grey)]">
                    Document Insights
                  </p>
                  <div className="grid gap-2">
                    {metadataItems.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] px-3 py-2"
                      >
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[color:var(--warm-grey)]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--platinum)]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--warm-grey)]">
                    Document Signals
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "border border-[color:var(--glass-border)] bg-[color:var(--glass)]",
                        noteFeatures.hasCode
                          ? "text-[color:var(--accent-teal)]"
                          : "text-[color:var(--warm-grey)]"
                      )}
                    >
                      Code
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "border border-[color:var(--glass-border)] bg-[color:var(--glass)]",
                        noteFeatures.hasTable
                          ? "text-[color:var(--aurora-purple)]"
                          : "text-[color:var(--warm-grey)]"
                      )}
                    >
                      Table
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "border border-[color:var(--glass-border)] bg-[color:var(--glass)]",
                        noteFeatures.hasTasks
                          ? "text-[color:var(--aurora-yellow)]"
                          : "text-[color:var(--warm-grey)]"
                      )}
                    >
                      Tasks
                    </Badge>
                  </div>
                </section>

                <section className="rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-3">
                  <div className="flex items-start gap-2">
                    <TriangleAlert className="mt-0.5 size-4 text-[color:var(--accent-teal)]" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[color:var(--platinum)]">
                        Sync roadmap
                      </p>
                      <p className="text-xs leading-5 text-[color:var(--warm-grey-light)]">
                        This UI is ready for autosave, local draft recovery, and conflict-safe sync states in the next phase.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </aside>
        </div>

        <DialogFooter className="gap-2 border-t border-[color:var(--glass-border)] bg-[color:var(--black-primary)]/95">
          {isEditing && onDelete && (
            <Button variant="destructive" onClick={() => onDelete(note._id)} className="mr-auto">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            className="border-[color:var(--glass-border)] bg-[color:var(--glass)] text-[color:var(--warm-grey-light)] hover:bg-[color:var(--black-tertiary)] hover:text-[color:var(--platinum)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-[color:var(--accent-teal)] text-[color:var(--black-primary)] hover:bg-[color:var(--accent-teal-dim)]"
          >
            <Check className="w-4 h-4 mr-1" />
            {isEditing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NotesListProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

export function NotesList({ notes, onEdit, onDelete }: NotesListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterTag, setFilterTag] = React.useState<string>("all");

  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    notes.forEach((note) => note.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  const filteredNotes = React.useMemo(() => {
    return notes.filter((note) => {
      const normalizedQuery = searchQuery.toLowerCase();
      const snippet = stripMarkdown(note.content).toLowerCase();
      const matchesSearch =
        !normalizedQuery ||
        note.title.toLowerCase().includes(normalizedQuery) ||
        snippet.includes(normalizedQuery);

      const matchesTag = filterTag === "all" || note.tags.includes(filterTag);
      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, filterTag]);

  const tagColors: Record<string, string> = {
    High: "text-[color:var(--aurora-red)]",
    Medium: "text-[color:var(--aurora-yellow)]",
    Low: "text-[color:var(--aurora-lime)]",
    Work: "text-[color:var(--accent-teal)]",
    Personal: "text-[color:var(--warm-grey-light)]",
    Project: "text-[color:var(--aurora-purple)]",
    Meeting: "text-[color:var(--accent-teal-dim)]",
    Idea: "text-[color:var(--platinum)]",
    Todo: "text-[color:var(--aurora-yellow)]",
  };

  if (notes.length === 0) {
    return (
      <Card className="border-[color:var(--glass-border)] bg-[color:var(--black-secondary)] text-[color:var(--platinum)]">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-[color:var(--platinum)]">No notes yet</p>
          <p className="mt-1 text-xs text-[color:var(--warm-grey)]">
            Create your first note to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--warm-grey)]" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="border-[color:var(--glass-border)] bg-[color:var(--black-secondary)] pl-9 text-[color:var(--platinum)] placeholder:text-[color:var(--warm-grey)]"
          />
        </div>
        <Select value={filterTag} onValueChange={setFilterTag}>
          <SelectTrigger className="w-[150px] border-[color:var(--glass-border)] bg-[color:var(--black-secondary)] text-[color:var(--platinum)]">
            <Tag className="mr-2 size-4 text-[color:var(--accent-teal)]" />
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent className="border-[color:var(--glass-border)] bg-[color:var(--black-secondary)] text-[color:var(--platinum)]">
            <SelectItem value="all">All Tags</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredNotes.map((note) => {
            const features = detectNoteFeatures(note.content);
            return (
              <Card
                key={note._id}
                className="cursor-pointer border-[color:var(--glass-border)] bg-[color:var(--black-secondary)] text-[color:var(--platinum)] transition-colors hover:bg-[color:var(--glass)]"
                onClick={() => onEdit(note)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <CardTitle className="truncate text-sm font-medium">
                        {note.title}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {features.hasCode && (
                          <Badge variant="secondary" className="border-[color:var(--glass-border)] bg-[color:var(--glass)] text-[color:var(--accent-teal)]">
                            Code
                          </Badge>
                        )}
                        {features.hasTable && (
                          <Badge variant="secondary" className="border-[color:var(--glass-border)] bg-[color:var(--glass)] text-[color:var(--aurora-purple)]">
                            Table
                          </Badge>
                        )}
                        {features.hasTasks && (
                          <Badge variant="secondary" className="border-[color:var(--glass-border)] bg-[color:var(--glass)] text-[color:var(--aurora-yellow)]">
                            Tasks
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(note._id);
                      }}
                      className="min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] text-[color:var(--warm-grey-light)] hover:bg-[color:var(--glass)] hover:text-[color:var(--aurora-red)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="line-clamp-2 text-sm leading-6 text-[color:var(--warm-grey-light)]">
                    {createNoteSnippet(note.content)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass)] px-2 py-0.5 text-xs",
                          tagColors[tag] || "text-[color:var(--warm-grey-light)]"
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-[color:var(--warm-grey)]">
                    {formatDate(note.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {filteredNotes.length === 0 && (
        <p className="py-8 text-center text-[color:var(--warm-grey)]">
          No notes match your search
        </p>
      )}
    </div>
  );
}

export default { NoteEditorDialog, NotesList };
