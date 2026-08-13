"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Bold,
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
  PencilLine,
  Plus,
  Quote,
  Split,
  Table2,
} from "lucide-react";
import type { Note } from "./note-editor";

type EditorMode = "write" | "preview" | "split";

interface NoteEditorInlineProps {
  note: Note | null;
  onSave: (note: Partial<Note>) => void;
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

function MarkdownPreview({ content }: { content: string }) {
  const html = React.useMemo(() => renderMarkdownToHtml(content), [content]);
  return (
    <div
      className="markdown-preview min-h-full rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--black-primary)]/80 p-5"
      dangerouslySetInnerHTML={{
        __html:
          html ||
          "<p class='empty'>Preview your Markdown here as you write.</p>",
      }}
    />
  );
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

export function NoteEditorInline({ note, onSave }: NoteEditorInlineProps) {
  const [title, setTitle] = React.useState(note?.title || "");
  const [content, setContent] = React.useState(note?.content || "");
  const [editorMode, setEditorMode] = React.useState<EditorMode>("write");
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle("");
      setContent("");
    }
    setEditorMode("write");
  }, [note]);

  const hasChanges =
    title !== (note?.title || "") || content !== (note?.content || "");

  const applyToSelection = React.useCallback(
    (prefix: string, suffix = prefix, placeholder = "text") => {
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
    [content]
  );

  const applyLinePrefix = React.useCallback(
    (prefix: string) => {
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
    [content]
  );

  const insertTable = React.useCallback(() => {
    const table = "\n| Column | Column |\n| --- | --- |\n| Value | Value |\n";
    const textarea = textareaRef.current;
    const { start, end } = getSelectionRange(textarea, content);
    const nextContent = content.slice(0, start) + table + content.slice(end);
    setContent(nextContent);
    requestAnimationFrame(() => textarea?.focus());
  }, [content]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      _id: note?._id,
      title: title.trim(),
      content: content.trim(),
      tags: note?.tags || [],
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="flex h-full flex-col bg-[color:var(--black-secondary)]">
      {/* Title */}
      <div className="border-b border-[color:var(--glass-border)] px-4 py-3">
        <Input
          placeholder="Untitled note"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-10 border-none bg-transparent px-0 text-lg font-semibold text-[color:var(--platinum)] placeholder:text-[color:var(--warm-grey)] focus-visible:ring-0"
        />
      </div>

      {/* Toolbar */}
      <div className="border-b border-[color:var(--glass-border)] bg-[color:var(--black-secondary)] px-3 py-2">
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
            <ToolbarButton label="Link" icon={Link2} onClick={() => applyToSelection("[", "](https://example.com)", "label")} />
            <ToolbarButton label="Bullet list" icon={List} onClick={() => applyLinePrefix("- ")} />
            <ToolbarButton label="Ordered list" icon={ListOrdered} onClick={() => applyLinePrefix("1. ")} />
            <ToolbarButton label="Task list" icon={ListChecks} onClick={() => applyLinePrefix("- [ ] ")} />
            <ToolbarButton label="Table" icon={Table2} onClick={insertTable} />
          </div>
          <div className="ml-auto inline-flex items-center gap-1 rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-1">
            <Button type="button" variant="ghost" size="sm"
              onClick={() => setEditorMode("write")}
              className={cn("text-[color:var(--warm-grey-light)]", editorMode === "write" && "text-[color:var(--accent-teal)]")}
            >
              <PencilLine className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm"
              onClick={() => setEditorMode("preview")}
              className={cn("text-[color:var(--warm-grey-light)]", editorMode === "preview" && "text-[color:var(--accent-teal)]")}
            >
              <Eye className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm"
              onClick={() => setEditorMode("split")}
              className={cn("text-[color:var(--warm-grey-light)]", editorMode === "split" && "text-[color:var(--accent-teal)]")}
            >
              <Split className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className={cn("flex min-h-0 flex-1", editorMode === "split" ? "flex-col lg:flex-row" : "flex-col")}>
        {editorMode !== "preview" && (
          <div className="min-w-0 flex-1 p-3">
            <Textarea
              ref={textareaRef}
              placeholder="Write in Markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-full min-h-[20rem] resize-none border-[color:var(--glass-border)] bg-[color:var(--black-primary)]/80 px-4 py-3 font-[450] leading-7 text-[color:var(--platinum)] placeholder:text-[color:var(--warm-grey)] focus-visible:border-[color:var(--accent-teal-dim)] focus-visible:ring-[color:var(--accent-teal-dim)]/30"
            />
          </div>
        )}
        {editorMode !== "write" && (
          <div className="min-w-0 flex-1 p-3">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[color:var(--glass-border)] bg-[color:var(--black-primary)]/80 px-4 py-2 text-xs text-[color:var(--warm-grey)]">
        <span>{stripMarkdown(content).split(/\s+/).filter(Boolean).length} words</span>
        <Button
          onClick={handleSave}
          disabled={!title.trim()}
          size="sm"
          className="bg-[color:var(--accent-teal)] text-[color:var(--black-primary)] hover:bg-[color:var(--accent-teal-dim)]"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
