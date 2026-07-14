"use client";

import { FileIcon, ImageIcon, FileText, Download, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AppFile {
  _id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  noteId?: string;
  createdAt: number;
  updatedAt: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("pdf")) return FileText;
  return FileIcon;
}

function getFileColor(type: string): string {
  if (type.startsWith("image/")) return "text-aurora-lime";
  if (type.includes("pdf")) return "text-aurora-red";
  if (type.includes("text") || type.includes("markdown")) return "text-accent-teal";
  return "text-warm-grey";
}

interface FileCardProps {
  file: AppFile;
  onDelete?: (id: string) => void;
}

export function FileCard({ file, onDelete }: FileCardProps) {
  const Icon = getFileIcon(file.type);
  const color = getFileColor(file.type);

  return (
    <div className="group relative flex items-start gap-3 rounded-xl border border-glass-border bg-glass p-3 transition-all hover:border-neutral-700">
      {/* Icon */}
      <div className={cn("mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-800", color)}>
        <Icon className="size-5" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{file.name}</p>
        <p className="text-xs text-neutral-400">
          {formatSize(file.size)} &middot; {formatDate(file.createdAt)}
        </p>
        {file.noteId && (
          <p className="mt-0.5 text-xs text-accent-teal/70">Attached to note</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Open"
        >
          <ExternalLink className="size-4" />
        </a>
        <button
          onClick={() => {
            const a = document.createElement("a");
            a.href = file.url;
            a.download = file.name;
            a.click();
          }}
          className="flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Download"
        >
          <Download className="size-4" />
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(file._id)}
            className="flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:text-aurora-red hover:bg-neutral-800 transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
